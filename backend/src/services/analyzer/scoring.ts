import { CodebaseChecks, SecurityIssue } from './analyzer';

export interface ScoreCategory {
  score: number;
  max: number;
  deductions: { points: number; reason: string }[];
}

export interface ScoreBreakdown {
  overall: number;
  category: 'Excellent' | 'Very Good' | 'Good' | 'Needs Improvement' | 'Unprepared';
  structure: ScoreCategory;
  readme: ScoreCategory;
  deployment: ScoreCategory;
  security: ScoreCategory;
  completeness: ScoreCategory;
  portfolio: ScoreCategory;
}

export function calculateProjectScore(
  checks: CodebaseChecks,
  issues: SecurityIssue[],
  readmeScore: number,
  filePaths: string[]
): ScoreBreakdown {
  const lowercasePaths = filePaths.map(p => p.toLowerCase());

  // 1. Structure (Max: 25)
  const structureDeductions: { points: number; reason: string }[] = [];
  let structurePoints = 25;

  if (!checks.gitignoreExists) {
    structurePoints -= 5;
    structureDeductions.push({ points: 5, reason: 'Missing .gitignore config file' });
  }
  if (!checks.frontendBackendSeparated && !lowercasePaths.some(p => p.startsWith('src/'))) {
    structurePoints -= 10;
    structureDeductions.push({ points: 10, reason: 'Lacks frontend/backend separation and does not group code inside a "src/" folder' });
  }
  if (checks.packageFileExists && !checks.lockFileExists) {
    structurePoints -= 5;
    structureDeductions.push({ points: 5, reason: 'Manifest exists but no lockfile found (e.g. package-lock.json, yarn.lock, requirements.txt without lock)' });
  }
  
  const hasConfig = lowercasePaths.some(p => p.includes('config') || p.includes('tsconfig') || p.includes('vite.config') || p.includes('.eslintrc'));
  if (!hasConfig) {
    structurePoints -= 5;
    structureDeductions.push({ points: 5, reason: 'No standard project configuration files found (tsconfig, webpack, eslint, etc.)' });
  }
  structurePoints = Math.max(0, structurePoints);

  // 2. README and documentation (Max: 20)
  // Scale the raw README score (out of 100) to 20
  const readmePoints = Math.round(readmeScore * 0.2);
  const readmeDeductions: { points: number; reason: string }[] = [];
  if (readmeScore < 100) {
    const diff = 20 - readmePoints;
    readmeDeductions.push({ points: diff, reason: `README quality checks failed some segments (Raw Score: ${readmeScore}/100)` });
  }

  // 3. Deployment Readiness (Max: 25)
  const deploymentDeductions: { points: number; reason: string }[] = [];
  let deploymentPoints = 25;

  // Check vercel.json, dockerfile, etc. or package scripts
  const hasDeploymentConfig = lowercasePaths.some(p => 
    p.includes('docker') || p.includes('vercel.json') || p.includes('netlify.toml') || p.includes('render.yaml')
  );
  if (!hasDeploymentConfig && !checks.buildScriptExists) {
    deploymentPoints -= 5;
    deploymentDeductions.push({ points: 5, reason: 'No cloud-specific deployment manifests (vercel.json, netlify.toml) or docker files' });
  }
  
  if (!checks.buildScriptExists) {
    deploymentPoints -= 10;
    deploymentDeductions.push({ points: 10, reason: 'Missing package/application build script ("build" command in package.json/build config)' });
  }
  if (!checks.startScriptExists) {
    deploymentPoints -= 5;
    deploymentDeductions.push({ points: 5, reason: 'Missing package start command ("start" in package.json or application start hook)' });
  }

  // Scan for localhost URLs
  const hasLocalhostUrl = issues.some(i => i.title.includes('localhost')); // logic check if localhost issue was created
  // Alternatively check lockfile or we can deduct if not setup for CORS
  if (hasLocalhostUrl) {
    deploymentPoints -= 5;
    deploymentDeductions.push({ points: 5, reason: 'Hardcoded localhost server links found' });
  }
  deploymentPoints = Math.max(0, deploymentPoints);

  // 4. Security & Env Preparation (Max: 15)
  const securityDeductions: { points: number; reason: string }[] = [];
  let securityPoints = 15;

  const hasEnvFile = issues.some(i => i.severity === 'critical' && i.title.includes('.env'));
  if (hasEnvFile) {
    securityPoints -= 10;
    securityDeductions.push({ points: 10, reason: 'Committed local environment files (.env) containing secrets' });
  }

  const hasCert = issues.some(i => i.severity === 'critical' && i.title.includes('Exposed Private'));
  if (hasCert) {
    securityPoints -= 5;
    securityDeductions.push({ points: 5, reason: 'Tracked private certificates or service accounts (.pem, firebase-key.json)' });
  }

  const hasNodeModules = issues.some(i => i.title.includes('node_modules'));
  if (hasNodeModules) {
    securityPoints -= 3;
    securityDeductions.push({ points: 3, reason: 'Committed dependencies directory (node_modules)' });
  }

  const hasBuildDir = issues.some(i => i.title.includes('Build Outputs'));
  if (hasBuildDir) {
    securityPoints -= 2;
    securityDeductions.push({ points: 2, reason: 'Tracked compilation builds (dist/build/.next)' });
  }
  securityPoints = Math.max(0, securityPoints);

  // 5. Completeness (Max: 10)
  const completenessDeductions: { points: number; reason: string }[] = [];
  let completenessPoints = 10;

  if (!checks.packageFileExists) {
    completenessPoints -= 5;
    completenessDeductions.push({ points: 5, reason: 'Missing dependency manifest file' });
  }
  if (!checks.licenseExists) {
    completenessPoints -= 2;
    completenessDeductions.push({ points: 2, reason: 'Lacks open source LICENSE declaration' });
  }
  if (!checks.apiDocumentationFound) {
    completenessPoints -= 3;
    completenessDeductions.push({ points: 3, reason: 'No Swagger/Postman schema or README API endpoint documentation' });
  }
  completenessPoints = Math.max(0, completenessPoints);

  // 6. Portfolio Presentation (Max: 5)
  const portfolioDeductions: { points: number; reason: string }[] = [];
  let portfolioPoints = 5;

  if (!checks.demoLinkFound) {
    portfolioPoints -= 3;
    portfolioDeductions.push({ points: 3, reason: 'No active deployed live demo link in README' });
  }
  if (!checks.screenshotsFound) {
    portfolioPoints -= 2;
    portfolioDeductions.push({ points: 2, reason: 'No mockups or UI screenshots embedded in README' });
  }
  portfolioPoints = Math.max(0, portfolioPoints);

  // Total
  const overall = structurePoints + readmePoints + deploymentPoints + securityPoints + completenessPoints + portfolioPoints;

  // Grade Categories
  let category: ScoreBreakdown['category'] = 'Unprepared';
  if (overall >= 90) {
    category = 'Excellent';
  } else if (overall >= 75) {
    category = 'Very Good';
  } else if (overall >= 60) {
    category = 'Good';
  } else if (overall >= 40) {
    category = 'Needs Improvement';
  }

  return {
    overall,
    category,
    structure: { score: structurePoints, max: 25, deductions: structureDeductions },
    readme: { score: readmePoints, max: 20, deductions: readmeDeductions },
    deployment: { score: deploymentPoints, max: 25, deductions: deploymentDeductions },
    security: { score: securityPoints, max: 15, deductions: securityDeductions },
    completeness: { score: completenessPoints, max: 10, deductions: completenessDeductions },
    portfolio: { score: portfolioPoints, max: 5, deductions: portfolioDeductions },
  };
}
