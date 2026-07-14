import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db, bucket } from '../services/firebase/firebase';
import {
  fetchGitHubRepository,
  fetchGitHubFileContent,
  parseGitHubUrl,
} from '../services/github/github';
import { runDeterministicAnalysis } from '../services/analyzer/analyzer';
import { calculateProjectScore } from '../services/analyzer/scoring';
import { generateAISuggestions } from '../services/ai/gemini';
import { generateAnalysisPDF } from '../services/report/pdf';
import admin from 'firebase-admin';
import { config } from '../config';

/**
 * Submit and process a GitHub Repository analysis
 */
export async function createAnalysis(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const { repositoryUrl } = req.body;

  let owner = '';
  let name = '';

  try {
    const parsed = parseGitHubUrl(repositoryUrl);
    owner = parsed.owner;
    name = parsed.name;
  } catch (urlError: any) {
    return res.status(400).json({
      success: false,
      message: urlError.message || 'Invalid GitHub URL format',
      code: 'analysis/invalid-url',
    });
  }

  // 1. Create a pending analysis record in Firestore
  const analysisRef = db.collection('analyses').doc();
  const analysisId = analysisRef.id;

  const initialDoc = {
    id: analysisId,
    userId: uid,
    status: 'analyzing',
    progressStage: 'Extracting repository metadata',
    repository: {
      url: repositoryUrl,
      owner,
      name,
      fullName: `${owner}/${name}`,
      description: null,
      defaultBranch: 'main',
      visibility: 'public',
      primaryLanguage: null,
      languages: {},
      stars: 0,
      forks: 0,
      openIssues: 0,
      lastUpdatedAt: null,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null,
    errorMessage: null,
  };

  await analysisRef.set(initialDoc);

  // Return immediately or perform synchronously
  // For robustness, perform inline. Usually completes in 4-6 seconds.
  try {
    // 2. Fetch repo from GitHub
    console.log(`Analyzing repo ${owner}/${name} for user ${uid}`);
    const repoData = await fetchGitHubRepository(repositoryUrl);
    
    await analysisRef.update({
      progressStage: 'Reading configuration and documentation files',
      'repository.description': repoData.metadata.description,
      'repository.defaultBranch': repoData.metadata.defaultBranch,
      'repository.primaryLanguage': repoData.metadata.primaryLanguage,
      'repository.languages': repoData.languages,
      'repository.stars': repoData.metadata.stars,
      'repository.forks': repoData.metadata.forks,
      'repository.openIssues': repoData.metadata.openIssues,
      'repository.lastUpdatedAt': repoData.metadata.lastUpdatedAt,
    });

    // 3. Read README.md and package.json if they exist
    let readmeContent: string | undefined;
    let packageJsonContent: string | undefined;

    const readmeFile = repoData.fileTree.find(f => f.path.toLowerCase() === 'readme.md');
    const packageFile = repoData.fileTree.find(f => f.path.toLowerCase() === 'package.json');

    if (readmeFile) {
      try {
        readmeContent = await fetchGitHubFileContent(owner, name, repoData.metadata.defaultBranch, readmeFile.path);
      } catch (e) {
        console.warn('Failed to read README content:', e);
      }
    }

    if (packageFile) {
      try {
        packageJsonContent = await fetchGitHubFileContent(owner, name, repoData.metadata.defaultBranch, packageFile.path);
      } catch (e) {
        console.warn('Failed to read package.json content:', e);
      }
    }

    // 4. Run static structural checks
    await analysisRef.update({ progressStage: 'Running static codebase analyzer' });
    const analysisResult = await runDeterministicAnalysis(
      repoData.metadata,
      repoData.languages,
      repoData.fileTree,
      readmeContent,
      packageJsonContent
    );

    // 5. Compute scores
    await analysisRef.update({ progressStage: 'Calculating overall readiness scores' });
    const filePaths = repoData.fileTree.map(f => f.path);
    const scoreBreakdown = calculateProjectScore(
      analysisResult.checks,
      analysisResult.issues,
      analysisResult.readme.score,
      filePaths
    );

    // 6. Generate AI suggestions
    await analysisRef.update({ progressStage: 'Generating mentor recommendations' });
    const aiSuggestions = await generateAISuggestions(analysisResult, scoreBreakdown);

    // 7. Complete record and write
    const finalDocUpdate = {
      status: 'completed',
      progressStage: 'Completed',
      detectedStack: analysisResult.detectedStack,
      scores: {
        overall: scoreBreakdown.overall,
        structure: scoreBreakdown.structure.score,
        readme: scoreBreakdown.readme.score,
        deployment: scoreBreakdown.deployment.score,
        security: scoreBreakdown.security.score,
        portfolio: scoreBreakdown.portfolio.score,
      },
      checks: analysisResult.checks,
      missingFiles: analysisResult.missingFiles,
      issues: analysisResult.issues,
      aiSuggestions: aiSuggestions.suggestions,
      deployment: {
        ready: analysisResult.deployment.ready,
        detectedFramework: analysisResult.deployment.detectedFramework,
        buildCommand: analysisResult.deployment.buildCommand,
        startCommand: analysisResult.deployment.startCommand,
        outputDirectory: analysisResult.deployment.outputDirectory,
        environmentVariablesRequired: analysisResult.deployment.environmentVariablesRequired,
        recommendedPlatform: analysisResult.deployment.recommendedPlatform,
        recommendationReason: analysisResult.deployment.recommendationReason,
        guideSteps: analysisResult.deployment.guideSteps,
      },
      summary: aiSuggestions.summary,
      resumePoint: aiSuggestions.resumePoint,
      portfolioDescription: aiSuggestions.portfolioDescription,
      pdf: {
        generated: false,
        storagePath: null,
        downloadUrl: null,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await analysisRef.update(finalDocUpdate);

    // Increment user's total analyses count
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      totalAnalyses: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(err => console.warn('Failed to update totalAnalyses for user:', err));

    // Retrieve completed doc to return to client
    const completedDoc = await analysisRef.get();

    return res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      data: completedDoc.data(),
    });

  } catch (analysisError: any) {
    console.error('Fatal analysis runner error:', analysisError);
    
    const errorDetails = {
      status: 'failed',
      progressStage: 'Failed',
      errorMessage: analysisError.message || 'An unexpected error occurred during codebase scanning.',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await analysisRef.update(errorDetails);

    return res.status(500).json({
      success: false,
      message: errorDetails.errorMessage,
      code: 'analysis/runner-failure',
    });
  }
}

/**
 * Get analyses history for the user (paginated & sorted)
 */
export async function getAnalyses(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const status = req.query.status as string | undefined;
  const limit = Number(req.query.limit || 10);
  const page = Number(req.query.page || 1);

  try {
    let query: admin.firestore.Query = db
      .collection('analyses')
      .where('userId', '==', uid);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Sort newest first
    query = query.orderBy('createdAt', 'desc');

    // Simple pagination using offsets (limit/offset)
    // Note: in high production, using startAfter document is better, but limit + offset is standard for standard web clients
    const snapshot = await query.limit(limit * page).get();
    
    const allDocs = snapshot.docs.map(doc => doc.data());
    // Slice for page
    const offset = (page - 1) * limit;
    const paginatedDocs = allDocs.slice(offset, offset + limit);

    // Get total count
    const totalCountSnap = await db
      .collection('analyses')
      .where('userId', '==', uid)
      .count()
      .get();
      
    const total = totalCountSnap.data().count;

    return res.status(200).json({
      success: true,
      message: 'Analyses history fetched',
      data: {
        analyses: paginatedDocs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to query analyses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis logs history',
      code: 'analysis/query-error',
    });
  }
}

/**
 * Get a single analysis record by ID (with ownership verification)
 */
export async function getAnalysisById(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const { analysisId } = req.params;

  try {
    const docRef = db.collection('analyses').doc(analysisId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
        code: 'analysis/not-found',
      });
    }

    const data = doc.data();

    // Verify ownership
    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this analysis record',
        code: 'analysis/forbidden-access',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis record fetched',
      data,
    });
  } catch (error: any) {
    console.error('Failed to get analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis',
      code: 'analysis/fetch-failed',
    });
  }
}

/**
 * Delete analysis from database and files from Storage
 */
export async function deleteAnalysis(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const { analysisId } = req.params;

  try {
    const docRef = db.collection('analyses').doc(analysisId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
        code: 'analysis/not-found',
      });
    }

    const data = doc.data();

    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this record',
        code: 'analysis/forbidden-delete',
      });
    }

    // Delete associated Storage report if generated
    if (data.pdf && data.pdf.storagePath) {
      try {
        await bucket.file(data.pdf.storagePath).delete();
        console.log(`Deleted report PDF at ${data.pdf.storagePath}`);
      } catch (storageError) {
        console.warn('PDF storage deletion failed (it might have been deleted already):', storageError);
      }
    }

    // Delete firestore document
    await docRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Analysis record successfully deleted from history',
      data: { id: analysisId },
    });
  } catch (error: any) {
    console.error('Failed to delete analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting analysis log',
      code: 'analysis/delete-failed',
    });
  }
}

/**
 * Generate PDF Report and store it on Firebase Storage
 */
export async function generateReport(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const { analysisId } = req.params;

  try {
    const docRef = db.collection('analyses').doc(analysisId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
        code: 'analysis/not-found',
      });
    }

    const data = doc.data();

    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Ownership verification failed',
        code: 'analysis/forbidden-report',
      });
    }

    if (data.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reports can only be generated for successfully completed analyses.',
        code: 'analysis/incomplete',
      });
    }

    // Format analysis input data
    const analysisInput = {
      detectedStack: data.detectedStack,
      checks: data.checks,
      missingFiles: data.missingFiles,
      issues: data.issues,
      deployment: data.deployment,
      readme: {
        score: Math.round(data.scores.readme * 5), // scale back up to 100
        missingSections: [], // already completed
        strongSections: [],
        suggestions: [],
        outline: '',
      },
    };

    // Reconstruct score structures
    const scoreBreakdown = {
      overall: data.scores.overall,
      category: data.scores.overall >= 90 ? 'Excellent' : data.scores.overall >= 75 ? 'Very Good' : data.scores.overall >= 60 ? 'Good' : 'Needs Improvement',
      structure: { score: data.scores.structure, max: 25, deductions: [] },
      readme: { score: data.scores.readme, max: 20, deductions: [] },
      deployment: { score: data.scores.deployment, max: 25, deductions: [] },
      security: { score: data.scores.security, max: 15, deductions: [] },
      completeness: { score: data.scores.overall - data.scores.structure - data.scores.readme - data.scores.deployment - data.scores.security - data.scores.portfolio, max: 10, deductions: [] }, // approximate
      portfolio: { score: data.scores.portfolio, max: 5, deductions: [] },
    } as any;

    const aiSuggestions = {
      summary: data.summary,
      topIssues: data.issues.slice(0, 3).map((i: any) => i.title),
      suggestions: data.aiSuggestions,
      resumePoint: data.resumePoint,
      portfolioDescription: data.portfolioDescription,
      readmeRecommendations: [],
      deploymentRecommendations: [],
      aiEnhanced: true,
    };

    const pdfResult = await generateAnalysisPDF({
      analysisId,
      userId: uid,
      repoOwner: data.repository.owner,
      repoName: data.repository.name,
      repoUrl: data.repository.url,
      analysis: analysisInput as any,
      score: scoreBreakdown,
      aiSuggestions,
    });

    // Save report references to Firestore
    await docRef.update({
      pdf: {
        generated: true,
        storagePath: pdfResult.storagePath,
        downloadUrl: pdfResult.downloadUrl,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: 'PDF report generated successfully',
      data: {
        downloadUrl: pdfResult.downloadUrl,
      },
    });

  } catch (error: any) {
    console.error('PDF generation handler failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate and upload PDF report',
      code: 'report/generation-failed',
    });
  }
}

/**
 * Retrieve signed download URL for PDF report
 */
export async function getReportUrl(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized', code: 'auth/unauthorized' });
  }

  const { uid } = req.user;
  const { analysisId } = req.params;

  try {
    const docRef = db.collection('analyses').doc(analysisId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
        code: 'analysis/not-found',
      });
    }

    const data = doc.data();

    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Owner validation failed',
        code: 'analysis/forbidden-report-access',
      });
    }

    if (!data.pdf || !data.pdf.generated || !data.pdf.storagePath) {
      return res.status(404).json({
        success: false,
        message: 'PDF report is not generated yet for this analysis',
        code: 'report/not-generated',
      });
    }

    // Refresh and fetch a signed URL
    const expiration = Date.now() + config.REPORT_SIGNED_URL_EXPIRATION_MINUTES * 60 * 1000;
    const [signedUrl] = await bucket.file(data.pdf.storagePath).getSignedUrl({
      action: 'read',
      expires: expiration,
    });

    return res.status(200).json({
      success: true,
      message: 'Signed URL successfully generated',
      data: {
        downloadUrl: signedUrl,
      },
    });

  } catch (error: any) {
    console.error('Failed to get signed URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve secure download link',
      code: 'report/url-failed',
    });
  }
}
