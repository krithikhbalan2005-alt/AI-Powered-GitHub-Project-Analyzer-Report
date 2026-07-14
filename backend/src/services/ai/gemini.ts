import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { FullAnalysisResult } from '../analyzer/analyzer';
import { ScoreBreakdown } from '../analyzer/scoring';

export interface AISuggestion {
  title: string;
  explanation: string;
  priority: 'low' | 'medium' | 'high';
  steps: string[];
}

export interface AISuggestionsResponse {
  summary: string;
  topIssues: string[];
  suggestions: AISuggestion[];
  resumePoint: string;
  portfolioDescription: string;
  readmeRecommendations: string[];
  deploymentRecommendations: string[];
  aiEnhanced: boolean;
}

/**
 * Fallback generator when Gemini API is unavailable/fails.
 * Creates deterministic improvement plans based on static analysis findings.
 */
export function generateDeterministicFallback(
  analysis: FullAnalysisResult,
  score: ScoreBreakdown
): AISuggestionsResponse {
  const suggestions: AISuggestion[] = [];
  const topIssues: string[] = [];
  const readmeRecommendations: string[] = [];
  const deploymentRecommendations: string[] = [];

  // Map checks/issues to instructions
  if (!analysis.checks.readmeExists) {
    topIssues.push('README.md documentation is missing');
    readmeRecommendations.push('Create a structured README.md using the outline suggested.');
    suggestions.push({
      title: 'Create README.md Documentation',
      explanation: 'Documentation is critical for portfolios. Recruiters and peer developers need a guide to understand, setup, and test the project.',
      priority: 'high',
      steps: [
        'Initialize README.md in the root directory.',
        'Add a clear project title and description.',
        'List out project prerequisites and commands to build/run.'
      ]
    });
  } else {
    if (!analysis.checks.installationStepsFound) {
      readmeRecommendations.push('Document detailed local installation and configuration guidelines.');
      suggestions.push({
        title: 'Include Local Installation Walkthrough',
        explanation: 'Local installation guides make the repository accessible to testers. Lack of instructions blocks developer review.',
        priority: 'medium',
        steps: [
          'Add a "Getting Started" or "Installation" section in the README.',
          'Provide terminal command blocks showing npm installs or environment setup.',
        ]
      });
    }
    if (!analysis.checks.demoLinkFound) {
      readmeRecommendations.push('Provide a URL link to a live preview or production instance.');
      suggestions.push({
        title: 'Deploy to Staging & Add Demo URL',
        explanation: 'Mentors and recruiters prefer clicking a single link to review functionality rather than checking out and running code locally.',
        priority: 'high',
        steps: [
          'Deploy the static client codebase to Vercel or Netlify.',
          'Add a noticeable link button (e.g. "[Live Site](https://url)") at the top of your README.'
        ]
      });
    }
  }

  // Security/Config
  const envCritical = analysis.issues.find(i => i.category === 'Security' && i.severity === 'critical');
  if (envCritical) {
    topIssues.push(envCritical.title);
    suggestions.push({
      title: 'Remove Committed API Keys & Secrets',
      explanation: 'Committing .env files or PEM keys exposes private services. If credentials leak, servers can be compromised or charged.',
      priority: 'high',
      steps: [
        'Run: git rm --cached .env',
        'Add ".env" to the .gitignore configurations.',
        'Immediately rotate and invalidate the committed API keys or service credentials.'
      ]
    });
  }

  if (!analysis.checks.envExampleExists) {
    topIssues.push('No .env.example environment variables template file');
    deploymentRecommendations.push('Add a .env.example configuration file template.');
    suggestions.push({
      title: 'Create Environment Configuration Template',
      explanation: 'Without a .env.example template, other developers must guess what environment keys are needed to run the API.',
      priority: 'medium',
      steps: [
        'Create a new ".env.example" file in your root folder.',
        'Add variable definitions without their secret values (e.g. PORT=, DB_URI=).',
        'Reference this file in the README setup instructions.'
      ]
    });
  }

  // Deployment
  if (!analysis.checks.buildScriptExists) {
    topIssues.push('Missing package compilation/build scripts');
    deploymentRecommendations.push('Add build scripts to compile TypeScript/frontend bundles.');
    suggestions.push({
      title: 'Add Standard Compile/Build Script',
      explanation: 'Hosting providers like Vercel and Render require building the files prior to running. Pushing raw source without a build script fails automated host builds.',
      priority: 'high',
      steps: [
        'Add a "build" command under the "scripts" section of package.json (e.g. "tsc" or "vite build").',
        'Verify the build runs successfully locally by running "npm run build".'
      ]
    });
  }

  // General Summary
  const frameworkName = analysis.deployment.detectedFramework || 'generic repository';
  const summary = `The codebase represents a ${frameworkName} project. It scored ${score.overall}/100. It is currently categorized as ${score.category}. ` +
    (topIssues.length > 0 
      ? `Main areas to address immediately include resolving ${topIssues.length} high priority configuration/security issue(s).` 
      : 'The project structure is clean, and next steps should focus on polishing documentation and code metrics.');

  const resumePoint = `Architected and developed a ${frameworkName} including core logic folders, config setup, and structural manifests.`;
  const portfolioDescription = `A structured software repository representing a ${frameworkName} application, implementing configurations and dependency manifests.`;

  return {
    summary,
    topIssues: topIssues.length > 0 ? topIssues : ['Polish advanced documentation and tests'],
    suggestions: suggestions.length > 0 ? suggestions : [
      {
        title: 'Implement Automated Unit Tests',
        explanation: 'Adding testing suites improves portfolio score and demonstrates quality assurance skills to recruiters.',
        priority: 'low',
        steps: [
          'Add a testing library like Jest or Mocha.',
          'Write tests checking critical controllers or models.',
          'Hook tests to package.json "test" script.'
        ]
      }
    ],
    resumePoint,
    portfolioDescription,
    readmeRecommendations: readmeRecommendations.length > 0 ? readmeRecommendations : ['Your README is already very detailed.'],
    deploymentRecommendations: deploymentRecommendations.length > 0 ? deploymentRecommendations : ['No outstanding deployment configuration errors detected.'],
    aiEnhanced: false
  };
}

/**
 * Primary AI suggestions coordinator.
 * Sends safe metadata and calls Gemini API, falling back safely on failure.
 */
export async function generateAISuggestions(
  analysis: FullAnalysisResult,
  score: ScoreBreakdown
): Promise<AISuggestionsResponse> {
  if (!config.GEMINI_API_KEY) {
    console.log('Gemini API key is not configured. Running fallback engine.');
    return generateDeterministicFallback(analysis, score);
  }

  try {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const promptPayload = {
      repositoryType: analysis.deployment.detectedFramework,
      languages: analysis.detectedStack.languages,
      frontendTech: analysis.detectedStack.frontend,
      backendTech: analysis.detectedStack.backend,
      databaseTech: analysis.detectedStack.database,
      missingFiles: analysis.missingFiles,
      scores: {
        overall: score.overall,
        structure: score.structure.score,
        readme: score.readme.score,
        deployment: score.deployment.score,
        security: score.security.score,
        completeness: score.completeness.score,
        portfolio: score.portfolio.score
      },
      issues: analysis.issues.map(i => ({
        title: i.title,
        severity: i.severity,
        category: i.category,
        description: i.description
      }))
    };

    const prompt = `You are a senior tech lead and placement advisor evaluating a student's portfolio repository.
Analyze the following JSON metadata structure and generate optimization suggestions, resume points, and recommendations.

PAYLOAD DATA:
${JSON.stringify(promptPayload, null, 2)}

You MUST respond strictly with a valid JSON object matching the JSON schema below. DO NOT include any markdown wraps outside of the JSON.

SCHEMA REQUIRED:
{
  "summary": "1-2 sentence high-level review of the project quality and readiness.",
  "topIssues": ["String list of the 2-4 most critical issues to fix immediately."],
  "suggestions": [
    {
      "title": "Actionable title (e.g. Remove committed credentials)",
      "explanation": "Why this is an issue and how it impacts quality or portfolio evaluation.",
      "priority": "low | medium | high",
      "steps": ["Step 1 to resolve", "Step 2 to resolve"]
    }
  ],
  "resumePoint": "A high-impact resume bullet point describing this project for a developer CV (e.g., 'Designed and built a fullstack React application utilizing Express.js APIs and Firebase Firestore, incorporating CORS routing, and automated client builds.').",
  "portfolioDescription": "A professional 2-3 sentence project description suitable for a portfolio site.",
  "readmeRecommendations": ["1-2 items to improve README quality specifically."],
  "deploymentRecommendations": ["1-2 items to improve cloud hosting/deployment setup."]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON
    const parsedData = JSON.parse(responseText.trim());
    
    // Validate required fields
    if (
      parsedData.summary &&
      Array.isArray(parsedData.topIssues) &&
      Array.isArray(parsedData.suggestions) &&
      parsedData.resumePoint &&
      parsedData.portfolioDescription &&
      Array.isArray(parsedData.readmeRecommendations) &&
      Array.isArray(parsedData.deploymentRecommendations)
    ) {
      return {
        ...parsedData,
        aiEnhanced: true
      };
    } else {
      throw new Error('AI response is missing required properties.');
    }
  } catch (error) {
    console.error('❌ Gemini API execution error. Falling back to rules-based suggestions.', error);
    return generateDeterministicFallback(analysis, score);
  }
}
