import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { bucket } from '../firebase/firebase';
import { config } from '../../config';
import { FullAnalysisResult } from '../analyzer/analyzer';
import { ScoreBreakdown } from '../analyzer/scoring';
import { AISuggestionsResponse } from '../ai/gemini';

export interface PDFGenerationInput {
  analysisId: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  analysis: FullAnalysisResult;
  score: ScoreBreakdown;
  aiSuggestions: AISuggestionsResponse;
}

export async function generateAnalysisPDF(input: PDFGenerationInput): Promise<{ storagePath: string; downloadUrl: string }> {
  const { analysisId, userId, repoOwner, repoName, repoUrl, analysis, score, aiSuggestions } = input;
  
  const tempDir = os.tmpdir();
  const tempFileName = `github-analysis-${repoOwner}-${repoName}-${Date.now()}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  const tempFilePath = path.join(tempDir, tempFileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(tempFilePath);
      doc.pipe(writeStream);

      // Colors Configuration (Navy / Dark theme)
      const primaryColor = '#1e293b';   // Dark Navy Slate
      const secondaryColor = '#4f46e5'; // Indigo accent
      const textColor = '#334155';      // Slate gray
      const warningColor = '#d97706';   // Amber
      const dangerColor = '#dc2626';    // Red
      const safeColor = '#16a34a';      // Green
      const lightBg = '#f8fafc';        // Off white slate

      // --- PAGE 1: TITLE & COVER ---
      // Primary Header Banner
      doc.rect(0, 0, 595.28, 120).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('PORTFOLIO ANALYSIS & DEPLOYMENT CHECKER', 50, 45);
      doc.fontSize(12).font('Helvetica').text('AI-Powered Repository Evaluation Report', 50, 75);

      // Repo Information
      doc.y = 150;
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Project Target Information');
      doc.rect(50, 175, 495, 1).fill('#e2e8f0');

      doc.y = 190;
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('Owner / Author: ', { continued: true }).font('Helvetica').text(repoOwner);
      doc.font('Helvetica-Bold').text('Repository Name: ', { continued: true }).font('Helvetica').text(repoName);
      doc.font('Helvetica-Bold').text('GitHub Link: ', { continued: true }).font('Helvetica').fillColor(secondaryColor).text(repoUrl, { link: repoUrl });
      doc.fillColor(textColor).font('Helvetica-Bold').text('Report ID: ', { continued: true }).font('Helvetica').text(analysisId);
      doc.font('Helvetica-Bold').text('Generated Date: ', { continued: true }).font('Helvetica').text(new Date().toLocaleDateString());

      // Score Callout Box
      doc.rect(50, 290, 495, 100).fill(lightBg);
      doc.fillColor(primaryColor).fontSize(40).font('Helvetica-Bold').text(`${score.overall}`, 80, 310, { width: 100, align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Overall Quality Score', 80, 360, { width: 100, align: 'center' });

      doc.fillColor(secondaryColor).fontSize(18).font('Helvetica-Bold').text(`Rating: ${score.category}`, 210, 315);
      doc.fillColor(textColor).fontSize(9).font('Helvetica').text('Computed deterministically using codebase separation structure, README documentation content, deployment parameters, safety configs, and demo links.', 210, 340, { width: 310 });

      // Breakdown Metrics
      doc.y = 420;
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Evaluation Score Breakdown');
      doc.rect(50, 440, 495, 1).fill('#e2e8f0');

      const drawScoreMetric = (label: string, value: number, max: number, startY: number) => {
        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(label, 60, startY);
        // Draw progress bar background
        doc.rect(200, startY, 200, 10).fill('#e2e8f0');
        // Fill percentage
        const fillWidth = (value / max) * 200;
        doc.rect(200, startY, fillWidth, 10).fill(secondaryColor);
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`${value}/${max}`, 420, startY);
      };

      drawScoreMetric('Codebase Structure', score.structure.score, score.structure.max, 460);
      drawScoreMetric('README & Docs', score.readme.score, score.readme.max, 485);
      drawScoreMetric('Deployment Readiness', score.deployment.score, score.deployment.max, 510);
      drawScoreMetric('Security Configurations', score.security.score, score.security.max, 535);
      drawScoreMetric('Project Completeness', score.completeness.score, score.completeness.max, 560);
      drawScoreMetric('Portfolio Presentation', score.portfolio.score, score.portfolio.max, 585);

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Page 1 of 3 - Antigravity AI GitHub Analyzer Service', 50, 780, { align: 'center' });

      // --- PAGE 2: TECH STACK, CHECKS & ISSUES ---
      doc.addPage();
      doc.rect(0, 0, 595.28, 40).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('TECHNICAL STACK & ANOMALIES DETECTION', 50, 15);

      // Stack details
      doc.y = 70;
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Detected Stack Summary');
      doc.rect(50, 90, 495, 1).fill('#e2e8f0');
      
      const languagesString = analysis.detectedStack.languages.join(', ') || 'None';
      const frontendString = analysis.detectedStack.frontend.join(', ') || 'Generic / None';
      const backendString = analysis.detectedStack.backend.join(', ') || 'Generic / None';
      const dbString = analysis.detectedStack.database.join(', ') || 'Not Detected';
      const deployString = analysis.detectedStack.deployment.join(', ') || 'Not Detected';

      doc.y = 105;
      doc.fillColor(textColor).fontSize(9);
      doc.font('Helvetica-Bold').text('Languages: ', { continued: true }).font('Helvetica').text(languagesString);
      doc.font('Helvetica-Bold').text('Frontend Framework: ', { continued: true }).font('Helvetica').text(frontendString);
      doc.font('Helvetica-Bold').text('Backend Environment: ', { continued: true }).font('Helvetica').text(backendString);
      doc.font('Helvetica-Bold').text('Databases: ', { continued: true }).font('Helvetica').text(dbString);
      doc.font('Helvetica-Bold').text('Deployment Tools: ', { continued: true }).font('Helvetica').text(deployString);

      // Issues scanner
      doc.y = 200;
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Codebase Quality & Security Findings');
      doc.rect(50, 220, 495, 1).fill('#e2e8f0');

      if (analysis.issues.length === 0) {
        doc.y = 240;
        doc.fillColor(safeColor).fontSize(10).font('Helvetica-Bold').text('✔ Excellent! No critical or moderate issues detected in the codebase structure.');
      } else {
        doc.y = 235;
        analysis.issues.slice(0, 5).forEach((issue) => {
          let badgeColor = warningColor;
          if (issue.severity === 'critical' || issue.severity === 'high') {
            badgeColor = dangerColor;
          } else if (issue.severity === 'low') {
            badgeColor = textColor;
          }
          
          doc.fillColor(badgeColor).fontSize(9).font('Helvetica-Bold').text(`[${issue.severity.toUpperCase()}] ${issue.title}`);
          doc.fillColor(textColor).font('Helvetica').text(issue.description, { width: 480 });
          doc.font('Helvetica-Oblique').text(`Recommendation: ${issue.recommendation}`, { width: 480 });
          doc.moveDown(0.5);
        });
        if (analysis.issues.length > 5) {
          doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text(`+ ${analysis.issues.length - 5} more issues. Please check the web dashboard.`, { align: 'right' });
        }
      }

      // Missing critical files list
      doc.y = 480;
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('Missing Required Repository Files');
      doc.rect(50, 500, 495, 1).fill('#e2e8f0');
      
      doc.y = 515;
      if (analysis.missingFiles.length === 0) {
        doc.fillColor(safeColor).fontSize(10).font('Helvetica').text('✔ All expected config and metadata files are present.');
      } else {
        doc.fillColor(dangerColor).fontSize(9).font('Helvetica-Bold').text('Missing Files: ', { continued: true });
        doc.fillColor(textColor).font('Helvetica').text(analysis.missingFiles.join(', '));
      }

      doc.fontSize(8).fillColor('#94a3b8').text('Page 2 of 3 - Antigravity AI GitHub Analyzer Service', 50, 780, { align: 'center' });

      // --- PAGE 3: DEPLOYMENT GUIDE & AI SUGGESTIONS ---
      doc.addPage();
      doc.rect(0, 0, 595.28, 40).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('DEPLOYMENT READINESS & AI RECOMMENDATIONS', 50, 15);

      // Deployment Strategy
      doc.y = 70;
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('Deployment Strategy & Guidelines');
      doc.rect(50, 90, 495, 1).fill('#e2e8f0');

      doc.y = 105;
      doc.fillColor(textColor).fontSize(9);
      doc.font('Helvetica-Bold').text('Target Application: ', { continued: true }).font('Helvetica').text(analysis.deployment.detectedFramework || 'Generic App');
      doc.font('Helvetica-Bold').text('Recommended Hosting Platform: ', { continued: true }).font('Helvetica').text(analysis.deployment.recommendedPlatform);
      doc.font('Helvetica-Bold').text('Recommendation Reason: ', { continued: true }).font('Helvetica').text(analysis.deployment.recommendationReason, { width: 480 });
      
      if (analysis.deployment.buildCommand) {
        doc.font('Helvetica-Bold').text('Suggested Build Command: ', { continued: true }).font('Helvetica').text(analysis.deployment.buildCommand);
      }
      if (analysis.deployment.startCommand) {
        doc.font('Helvetica-Bold').text('Suggested Start Command: ', { continued: true }).font('Helvetica').text(analysis.deployment.startCommand);
      }

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Deployment Steps:');
      analysis.deployment.guideSteps.forEach((step) => {
        doc.font('Helvetica').text(step, { width: 480, indent: 15 });
      });

      // AI Suggestions Section
      doc.y = 355;
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('AI Mentor Evaluation & Suggestions');
      doc.rect(50, 375, 495, 1).fill('#e2e8f0');

      doc.y = 390;
      doc.fillColor(textColor).fontSize(9);
      
      // Resume Point
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Suggested CV/Resume Point:');
      doc.fillColor(textColor).font('Helvetica').text(`• ${aiSuggestions.resumePoint}`, { width: 480 });
      doc.moveDown(0.5);

      // Portfolio Point
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Suggested Portfolio Description:');
      doc.fillColor(textColor).font('Helvetica').text(aiSuggestions.portfolioDescription, { width: 480 });
      doc.moveDown(0.5);

      // Key Mentor Suggestions
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Key Mentor Improvement Steps:');
      aiSuggestions.suggestions.slice(0, 2).forEach((sug) => {
        doc.font('Helvetica-Bold').fillColor(textColor).text(`- ${sug.title} (${sug.priority.toUpperCase()} Priority)`);
        doc.font('Helvetica').text(`  ${sug.explanation}`);
        if (sug.steps && sug.steps.length > 0) {
          doc.font('Helvetica-Oblique').text(`  Action: ${sug.steps.join(' → ')}`, { width: 460 });
        }
        doc.moveDown(0.3);
      });

      // Disclaimer Bottom Section
      doc.rect(50, 680, 495, 60).fill('#fffbeb'); // light warning box
      doc.fillColor('#78350f').fontSize(7.5).font('Helvetica').text('DISCLAIMER: This report is generated dynamically using static code structure diagnostics and metadata rules. Antigravity AI does not execute repository code or guarantee successful deployment. Actual deployment depends on correct database connections, external system integrations, configurations, and API provider credentials.', 60, 690, { width: 470 });

      doc.fontSize(8).fillColor('#94a3b8').text('Page 3 of 3 - Antigravity AI GitHub Analyzer Service', 50, 780, { align: 'center' });

      doc.end();

      writeStream.on('finish', async () => {
        try {
          const storagePath = `reports/${userId}/${analysisId}/analysis-report.pdf`;
          
          // Upload to Firebase Storage
          await bucket.upload(tempFilePath, {
            destination: storagePath,
            metadata: {
              contentType: 'application/pdf',
              cacheControl: 'public, max-age=3600'
            }
          });

          // Generate Signed Download URL
          const expiration = Date.now() + config.REPORT_SIGNED_URL_EXPIRATION_MINUTES * 60 * 1000;
          const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
            action: 'read',
            expires: expiration,
          });

          // Remove temp file
          await fs.promises.unlink(tempFilePath);

          resolve({
            storagePath,
            downloadUrl: signedUrl
          });
        } catch (uploadError) {
          console.error('PDF Storage upload failed:', uploadError);
          // Attempt to remove temp file anyway
          try {
            await fs.promises.unlink(tempFilePath);
          } catch (_) {}
          reject(uploadError);
        }
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}
