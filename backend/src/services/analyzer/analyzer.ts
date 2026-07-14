import { GitHubFile, GitHubRepoMetadata } from '../github/github';

export interface TechEvidence {
  technology: string;
  detectedFrom: string[];
  confidence: number;
}

export interface DetectedStack {
  languages: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  testing: string[];
  deployment: string[];
  packageManagers: string[];
  evidence: TechEvidence[];
}

export interface ReadmeAnalysis {
  score: number;
  missingSections: string[];
  strongSections: string[];
  suggestions: string[];
  outline: string;
}

export interface CodebaseChecks {
  readmeExists: boolean;
  envExampleExists: boolean;
  gitignoreExists: boolean;
  licenseExists: boolean;
  packageFileExists: boolean;
  lockFileExists: boolean;
  buildScriptExists: boolean;
  startScriptExists: boolean;
  screenshotsFound: boolean;
  demoLinkFound: boolean;
  installationStepsFound: boolean;
  usageSectionFound: boolean;
  apiDocumentationFound: boolean;
  frontendBackendSeparated: boolean;
}

export interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface DeploymentDetails {
  ready: boolean;
  detectedFramework: string | null;
  buildCommand: string | null;
  startCommand: string | null;
  outputDirectory: string | null;
  environmentVariablesRequired: boolean;
  recommendedPlatform: string;
  recommendationReason: string;
  guideSteps: string[];
}

export interface FullAnalysisResult {
  detectedStack: DetectedStack;
  checks: CodebaseChecks;
  missingFiles: string[];
  issues: SecurityIssue[];
  deployment: DeploymentDetails;
  readme: ReadmeAnalysis;
}

// ----------------------------------------------------
// 1. TECHNOLOGY DETECTOR
// ----------------------------------------------------
export function detectTechnologyStack(
  fileTree: GitHubFile[],
  languages: Record<string, number>,
  packageJsonContent?: string
): DetectedStack {
  const filePaths = fileTree.map(f => f.path.toLowerCase());
  const evidenceMap: Map<string, TechEvidence> = new Map();

  const addEvidence = (tech: string, source: string, weight: number) => {
    const existing = evidenceMap.get(tech);
    if (existing) {
      if (!existing.detectedFrom.includes(source)) {
        existing.detectedFrom.push(source);
      }
      existing.confidence = Math.min(100, existing.confidence + weight);
    } else {
      evidenceMap.set(tech, {
        technology: tech,
        detectedFrom: [source],
        confidence: weight,
      });
    }
  };

  // Parse package.json
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let scripts: Record<string, string> = {};

  if (packageJsonContent) {
    try {
      const parsed = JSON.parse(packageJsonContent);
      dependencies = parsed.dependencies || {};
      devDependencies = parsed.devDependencies || {};
      scripts = parsed.scripts || {};
      addEvidence('Node.js', 'package.json', 80);
      addEvidence('npm', 'package.json', 90);
    } catch (e) {
      console.warn('Failed to parse package.json for tech detection', e);
    }
  }

  // Detect Package Managers
  if (filePaths.includes('package-lock.json')) addEvidence('npm', 'package-lock.json', 95);
  if (filePaths.includes('yarn.lock')) addEvidence('Yarn', 'yarn.lock', 95);
  if (filePaths.includes('pnpm-lock.yaml')) addEvidence('pnpm', 'pnpm-lock.yaml', 95);
  if (filePaths.includes('gemfile.lock')) addEvidence('Bundler', 'gemfile.lock', 95);
  if (filePaths.includes('composer.lock')) addEvidence('Composer', 'composer.lock', 95);
  if (filePaths.includes('go.sum')) addEvidence('Go Modules', 'go.sum', 95);
  if (filePaths.includes('cargo.lock')) addEvidence('Cargo', 'cargo.lock', 95);

  // Frontend Technologies
  const hasReact = dependencies['react'] || devDependencies['react'];
  if (hasReact) addEvidence('React', 'package.json (dependencies)', 90);

  const hasNext = dependencies['next'] || devDependencies['next'];
  if (hasNext) addEvidence('Next.js', 'package.json (dependencies)', 95);
  if (filePaths.some(p => p.startsWith('next.config.'))) addEvidence('Next.js', 'next.config file', 95);

  const hasVue = dependencies['vue'] || devDependencies['vue'];
  if (hasVue) addEvidence('Vue.js', 'package.json (dependencies)', 90);

  const hasAngular = dependencies['@angular/core'] || devDependencies['@angular/core'];
  if (hasAngular) addEvidence('Angular', 'package.json (dependencies)', 95);
  if (filePaths.includes('angular.json')) addEvidence('Angular', 'angular.json', 95);

  const hasVite = dependencies['vite'] || devDependencies['vite'] || filePaths.some(p => p.startsWith('vite.config.'));
  if (hasVite) addEvidence('Vite', 'package.json or vite.config file', 90);

  const hasTailwind = dependencies['tailwindcss'] || devDependencies['tailwindcss'] || filePaths.some(p => p.startsWith('tailwind.config.'));
  if (hasTailwind) addEvidence('Tailwind CSS', 'Tailwind configuration', 95);

  const hasBootstrap = dependencies['bootstrap'] || devDependencies['bootstrap'];
  if (hasBootstrap) addEvidence('Bootstrap', 'package.json (dependencies)', 85);

  // Backend Technologies
  const hasExpress = dependencies['express'] || devDependencies['express'];
  if (hasExpress) addEvidence('Express.js', 'package.json (dependencies)', 95);

  const hasNest = dependencies['@nestjs/core'] || devDependencies['@nestjs/core'] || filePaths.includes('nest-cli.json');
  if (hasNest) addEvidence('NestJS', 'Nest dependency/config', 95);

  // Python backend
  if (filePaths.includes('manage.py')) addEvidence('Django', 'manage.py', 95);
  if (filePaths.includes('wsgi.py')) addEvidence('Django', 'wsgi.py', 90);
  
  // Simple check for django/flask/fastapi in text would require loading, let's look for common files or fallback
  if (filePaths.includes('requirements.txt')) addEvidence('Python PIP', 'requirements.txt', 80);
  if (filePaths.includes('pyproject.toml')) addEvidence('Poetry/Python', 'pyproject.toml', 85);
  
  if (filePaths.some(p => p.includes('app/main.py') || p.includes('api/main.py'))) {
    addEvidence('FastAPI', 'main.py structure', 70);
  }

  // Java
  if (filePaths.includes('pom.xml')) addEvidence('Spring Boot', 'pom.xml', 85);
  if (filePaths.includes('build.gradle')) addEvidence('Spring Boot / Gradle', 'build.gradle', 85);

  // PHP
  if (filePaths.includes('artisan')) addEvidence('Laravel', 'artisan (PHP)', 95);
  if (filePaths.includes('composer.json')) addEvidence('PHP Composer', 'composer.json', 90);

  // Databases
  const depsKeys = [...Object.keys(dependencies), ...Object.keys(devDependencies)];
  if (depsKeys.includes('mongoose') || depsKeys.includes('mongodb')) addEvidence('MongoDB', 'package.json (dependencies)', 90);
  if (depsKeys.includes('pg') || depsKeys.includes('sequelize') && depsKeys.some(d => d.includes('postgres'))) addEvidence('PostgreSQL', 'package.json (dependencies)', 80);
  if (depsKeys.includes('mysql') || depsKeys.includes('mysql2')) addEvidence('MySQL', 'package.json (dependencies)', 85);
  if (depsKeys.includes('sqlite3') || depsKeys.includes('better-sqlite3')) addEvidence('SQLite', 'package.json (dependencies)', 90);
  if (depsKeys.includes('@supabase/supabase-js')) addEvidence('Supabase', 'package.json (dependencies)', 95);
  if (depsKeys.includes('firebase-admin') || depsKeys.includes('firebase') || filePaths.includes('firebase.json')) addEvidence('Firebase', 'Firebase library/config', 95);

  // DevOps & Deployment
  if (filePaths.includes('dockerfile') || filePaths.includes('docker-compose.yml')) addEvidence('Docker', 'Docker configuration', 95);
  if (fileTree.some(f => f.path.startsWith('.github/workflows/'))) addEvidence('GitHub Actions', '.github/workflows folder', 95);
  if (filePaths.includes('vercel.json')) addEvidence('Vercel', 'vercel.json', 95);
  if (filePaths.includes('netlify.toml')) addEvidence('Netlify', 'netlify.toml', 95);
  if (filePaths.includes('render.yaml')) addEvidence('Render', 'render.yaml', 95);

  // Testing
  if (depsKeys.includes('jest') || scripts['test']?.includes('jest')) addEvidence('Jest', 'Jest configuration', 90);
  if (depsKeys.includes('mocha') || scripts['test']?.includes('mocha')) addEvidence('Mocha', 'Mocha dependency', 85);
  if (depsKeys.includes('cypress')) addEvidence('Cypress', 'Cypress dependency', 90);
  if (depsKeys.includes('@playwright/test')) addEvidence('Playwright', 'Playwright dependency', 90);

  // Categorize
  const languagesList = Object.keys(languages);
  const frontend: string[] = [];
  const backend: string[] = [];
  const database: string[] = [];
  const testing: string[] = [];
  const deployment: string[] = [];
  const packageManagers: string[] = [];

  evidenceMap.forEach(ev => {
    const name = ev.technology;
    // Categorize based on rules
    if (['React', 'Next.js', 'Vue.js', 'Angular', 'Vite', 'Tailwind CSS', 'Bootstrap'].includes(name)) {
      frontend.push(name);
    } else if (['Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Node.js'].includes(name)) {
      backend.push(name);
    } else if (['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Supabase', 'Firebase'].includes(name)) {
      database.push(name);
    } else if (['Jest', 'Mocha', 'Cypress', 'Playwright'].includes(name)) {
      testing.push(name);
    } else if (['Docker', 'GitHub Actions', 'Vercel', 'Netlify', 'Render'].includes(name)) {
      deployment.push(name);
    } else if (['npm', 'Yarn', 'pnpm', 'Composer', 'Go Modules', 'Cargo', 'Bundler', 'Python PIP'].includes(name)) {
      packageManagers.push(name);
    }
  });

  // Fallbacks based on languages if no framework detected
  if (languages['JavaScript'] || languages['TypeScript']) {
    if (!backend.includes('Node.js') && packageJsonContent) backend.push('Node.js');
  }
  if (languages['Python'] && backend.length === 0) {
    if (filePaths.includes('requirements.txt')) {
      backend.push('Python (Generic)');
    }
  }

  return {
    languages: languagesList,
    frontend,
    backend,
    database,
    testing,
    deployment,
    packageManagers,
    evidence: Array.from(evidenceMap.values()),
  };
}

// ----------------------------------------------------
// 2. README QUALITY CHECKER
// ----------------------------------------------------
export function analyzeReadmeQuality(readmeContent?: string): ReadmeAnalysis {
  if (!readmeContent) {
    return {
      score: 0,
      missingSections: ['README.md file is completely missing'],
      strongSections: [],
      suggestions: ['Create a README.md file in the root directory to document your project.'],
      outline: '# Project Title\n\n## Overview\n\n## Installation\n\n## Usage\n\n## License',
    };
  }

  const scoreDetails: { section: string; score: number; found: boolean }[] = [
    { section: 'Title', score: 10, found: false },
    { section: 'Overview / Description', score: 10, found: false },
    { section: 'Features', score: 10, found: false },
    { section: 'Installation / Setup', score: 15, found: false },
    { section: 'Usage Instructions', score: 10, found: false },
    { section: 'Tech Stack', score: 10, found: false },
    { section: 'Screenshots / Media', score: 10, found: false },
    { section: 'Demo Link', score: 10, found: false },
    { section: 'License', score: 5, found: false },
    { section: 'Contact / Author Details', score: 10, found: false },
  ];

  // Regex checks for section headers or patterns in README
  const lowercaseReadme = readmeContent.toLowerCase();

  // 1. Title (# Title)
  if (/^#\s+.+/m.test(readmeContent)) {
    scoreDetails[0].found = true;
  }

  // 2. Overview / Description
  if (
    lowercaseReadme.includes('description') || 
    lowercaseReadme.includes('overview') || 
    lowercaseReadme.includes('about the project') ||
    (scoreDetails[0].found && readmeContent.split('\n').slice(1, 10).some(line => line.trim().length > 30))
  ) {
    scoreDetails[1].found = true;
  }

  // 3. Features
  if (lowercaseReadme.includes('feature') || lowercaseReadme.includes('key functionalities')) {
    scoreDetails[2].found = true;
  }

  // 4. Installation
  if (
    lowercaseReadme.includes('install') || 
    lowercaseReadme.includes('setup') || 
    lowercaseReadme.includes('getting started') ||
    lowercaseReadme.includes('npm install') ||
    lowercaseReadme.includes('pip install')
  ) {
    scoreDetails[3].found = true;
  }

  // 5. Usage
  if (
    lowercaseReadme.includes('usage') || 
    lowercaseReadme.includes('how to use') || 
    lowercaseReadme.includes('running the') ||
    lowercaseReadme.includes('npm start') ||
    lowercaseReadme.includes('npm run dev')
  ) {
    scoreDetails[4].found = true;
  }

  // 6. Tech Stack
  if (
    lowercaseReadme.includes('tech stack') || 
    lowercaseReadme.includes('built with') || 
    lowercaseReadme.includes('technologies') ||
    lowercaseReadme.includes('dependencies')
  ) {
    scoreDetails[5].found = true;
  }

  // 7. Screenshots
  // Formats: ![caption](path/image.png) or <img src="..."
  if (/!\[.*\]\(.*\)/.test(readmeContent) || lowercaseReadme.includes('<img') || lowercaseReadme.includes('screenshot')) {
    scoreDetails[6].found = true;
  }

  // 8. Demo Link
  // Formats: [Demo](http...) or links under live demo
  if (
    /\[.*\]\(https?:\/\/[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}.*\)/.test(readmeContent) && 
    (lowercaseReadme.includes('demo') || lowercaseReadme.includes('live') || lowercaseReadme.includes('deploy'))
  ) {
    scoreDetails[7].found = true;
  }

  // 9. License
  if (lowercaseReadme.includes('license') || lowercaseReadme.includes('mit license') || lowercaseReadme.includes('apache')) {
    scoreDetails[8].found = true;
  }

  // 10. Contact
  if (
    lowercaseReadme.includes('contact') || 
    lowercaseReadme.includes('email') || 
    lowercaseReadme.includes('author') ||
    lowercaseReadme.includes('linkedin') ||
    lowercaseReadme.includes('twitter')
  ) {
    scoreDetails[9].found = true;
  }

  const earnedScore = scoreDetails.reduce((sum, item) => sum + (item.found ? item.score : 0), 0);

  const missingSections = scoreDetails.filter(s => !s.found).map(s => s.section);
  const strongSections = scoreDetails.filter(s => s.found).map(s => s.section);

  const suggestions: string[] = [];
  if (!scoreDetails[3].found) suggestions.push('Add step-by-step Installation instructions to help users run the project locally.');
  if (!scoreDetails[4].found) suggestions.push('Explain how to run the project commands under a Usage section.');
  if (!scoreDetails[6].found) suggestions.push('Include high-quality screenshots or gifs showing the visual interface of the application.');
  if (!scoreDetails[7].found) suggestions.push('Deploy the application and add a direct live Demo Link to show recruiters a live working version.');
  if (!scoreDetails[8].found) suggestions.push('Include a License section (e.g. MIT, Apache 2.0) to declare permissions for your repository code.');
  if (!scoreDetails[9].found) suggestions.push('Provide clear Contact details or your LinkedIn profile so mentors/recruiters can reach you.');

  const suggestedOutline = `# [Project Name]

> A short, descriptive overview statement of what this project accomplishes and who it is for.

## Live Demo
[View Live Site](https://your-demo-link.vercel.app)

## Features
- **Key Feature 1**: Brief description.
- **Key Feature 2**: Brief description.
- **Key Feature 3**: Brief description.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, Firebase Admin SDK
- **Database**: Google Cloud Firestore
- **Deployment**: Vercel (Frontend), Render (Backend)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn / pnpm

### Installation
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/username/repo-name.git
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables in a \`.env\` file. See \`.env.example\` for details.
4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## License
Distributed under the MIT License. See \`LICENSE\` for details.

## Contact
Your Name - your.email@example.com
Project Link: [https://github.com/username/repo-name](https://github.com/username/repo-name)
`;

  return {
    score: earnedScore,
    missingSections,
    strongSections,
    suggestions: suggestions.length > 0 ? suggestions : ['Your README is highly detailed and professional. Keep updating it as features expand.'],
    outline: suggestedOutline,
  };
}

// ----------------------------------------------------
// 3. REPOSITORY STRUCTURE ANALYZER
// ----------------------------------------------------
export function analyzeRepositoryStructure(
  fileTree: GitHubFile[],
  readmeContent?: string
): { checks: CodebaseChecks; missingFiles: string[]; issues: SecurityIssue[] } {
  const filePaths = fileTree.map(f => f.path.toLowerCase());
  const filePathsRaw = fileTree.map(f => f.path);

  // Missing files checklist
  const missingFiles: string[] = [];
  if (!filePaths.includes('readme.md')) missingFiles.push('README.md');
  if (!filePaths.includes('.env.example') && !filePaths.includes('.env.sample')) missingFiles.push('.env.example');
  if (!filePaths.includes('.gitignore')) missingFiles.push('.gitignore');
  if (!filePaths.includes('license') && !filePaths.includes('license.txt') && !filePaths.includes('license.md')) missingFiles.push('LICENSE');

  // Verify Package Manifest
  const packageFileExists = filePaths.includes('package.json') || 
                            filePaths.includes('requirements.txt') || 
                            filePaths.includes('pom.xml') || 
                            filePaths.includes('build.gradle') || 
                            filePaths.includes('cargo.toml') || 
                            filePaths.includes('go.mod') || 
                            filePaths.includes('composer.json');

  if (!packageFileExists) missingFiles.push('Dependency Manifest (e.g. package.json / requirements.txt / go.mod)');

  // Checks mapping
  const checks: CodebaseChecks = {
    readmeExists: filePaths.includes('readme.md'),
    envExampleExists: filePaths.includes('.env.example') || filePaths.includes('.env.sample'),
    gitignoreExists: filePaths.includes('.gitignore'),
    licenseExists: filePaths.includes('license') || filePaths.includes('license.txt') || filePaths.includes('license.md'),
    packageFileExists,
    lockFileExists: filePaths.includes('package-lock.json') || 
                    filePaths.includes('yarn.lock') || 
                    filePaths.includes('pnpm-lock.yaml') ||
                    filePaths.includes('requirements.txt') && filePaths.includes('pipfile.lock') ||
                    filePaths.includes('composer.lock') ||
                    filePaths.includes('cargo.lock') ||
                    filePaths.includes('go.sum'),
    buildScriptExists: false, // will update below
    startScriptExists: false, // will update below
    screenshotsFound: readmeContent ? (/!\[.*\]\(.*\)/.test(readmeContent) || readmeContent.toLowerCase().includes('screenshot')) : false,
    demoLinkFound: readmeContent ? (/\[.*\]\(https?:\/\/[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}.*\)/.test(readmeContent) && readmeContent.toLowerCase().includes('demo')) : false,
    installationStepsFound: readmeContent ? (readmeContent.toLowerCase().includes('install') || readmeContent.toLowerCase().includes('setup')) : false,
    usageSectionFound: readmeContent ? (readmeContent.toLowerCase().includes('usage') || readmeContent.toLowerCase().includes('run')) : false,
    apiDocumentationFound: filePaths.some(p => p.includes('api-doc') || p.includes('swagger') || p.includes('postman')) || 
                           (readmeContent ? readmeContent.toLowerCase().includes('api') && readmeContent.toLowerCase().includes('endpoint') : false),
    frontendBackendSeparated: false, // will update below
  };

  // Check separation
  const rootDirs = new Set(filePathsRaw.map(p => p.split('/')[0]));
  const hasFrontendDir = rootDirs.has('frontend') || rootDirs.has('client') || rootDirs.has('ui') || rootDirs.has('web');
  const hasBackendDir = rootDirs.has('backend') || rootDirs.has('server') || rootDirs.has('api') || rootDirs.has('backend-src');
  if (hasFrontendDir && hasBackendDir) {
    checks.frontendBackendSeparated = true;
  }

  // Security scanner
  const issues: SecurityIssue[] = [];

  const addIssue = (
    title: string,
    description: string,
    category: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    recommendation: string
  ) => {
    issues.push({
      id: `SEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      title,
      description,
      category,
      severity,
      recommendation,
    });
  };

  // 1. Committed .env file check
  if (filePaths.some(p => p === '.env' || p.endsWith('/.env'))) {
    addIssue(
      'Committed Local Environment File (.env)',
      'A local environment configurations file (.env) was detected in the repository history/tree. This is a high-risk security issue because API keys, database credentials, and secrets might be exposed.',
      'Security',
      'critical',
      'Remove the .env file from git immediately by running "git rm --cached .env" and adding it to your .gitignore file. Rotate any secrets that have been pushed.'
    );
  }

  // 2. Committed node_modules check
  if (filePaths.some(p => p.startsWith('node_modules/'))) {
    addIssue(
      'Committed node_modules Directory',
      'The "node_modules" folder has been directly pushed to the repository. This increases repository size drastically and violates best practices.',
      'Structure',
      'medium',
      'Remove the node_modules directory from your git index using "git rm -r --cached node_modules", add "node_modules/" to your .gitignore, and push the updates.'
    );
  }

  // 3. Committed build outputs (dist, build, out)
  const committedBuildFiles = filePaths.some(p => p.startsWith('dist/') || p.startsWith('build/') || p.startsWith('.next/'));
  if (committedBuildFiles) {
    addIssue(
      'Committed Build Outputs (dist/build/.next)',
      'Compiled build output folders (like dist/, build/, or .next/) were detected in the repository files. Build directories should be compiled on deployment, not tracked in source control.',
      'Structure',
      'low',
      'Delete the tracked build folders using "git rm -r --cached dist/" (or equivalent) and list these directories in your .gitignore.'
    );
  }

  // 4. Committed Firebase Service Account or PEM keys
  const privateKeys = filePaths.filter(p => p.endsWith('.pem') || p.endsWith('.pkcs12') || p.includes('firebase-key') || p.includes('serviceaccount') || p.endsWith('.key') || p.endsWith('id_rsa'));
  if (privateKeys.length > 0) {
    addIssue(
      'Exposed Private Certificates / API Credentials',
      `Potential private keys or authentication credential certificates were detected: ${privateKeys.join(', ')}. Pushing credentials violates security policies.`,
      'Security',
      'critical',
      'Immediately remove the credentials file from Git, rewrite git history if they were committed in earlier stages, rotate all associated service credentials immediately, and list files in .gitignore.'
    );
  }

  // 5. Missing .env.example
  if (!checks.envExampleExists && (filePaths.includes('package.json') || filePaths.includes('requirements.txt'))) {
    addIssue(
      'Missing .env.example Template',
      'The project references environments or setup but is missing a .env.example template file to guide other developers on what configurations are required.',
      'Configuration',
      'medium',
      'Create a .env.example file listing all environment variable names (with empty or dummy placeholder values) and commit it to the root of the repository.'
    );
  }

  // 6. Missing .gitignore
  if (!checks.gitignoreExists) {
    addIssue(
      'Missing .gitignore Configuration File',
      'No .gitignore file was found in the root of the repository. This will lead to local temporary files, IDE configs, dependencies, and environments being committed unintentionally.',
      'Configuration',
      'high',
      'Create a standard .gitignore file in the repository root containing node_modules/, build outputs, .env, and system temp files.'
    );
  }

  // 7. Missing LICENSE
  if (!checks.licenseExists) {
    addIssue(
      'Missing License File',
      'There is no LICENSE file in this repository. In open-source development, this defaults to restrictive copyrights where others cannot copy, modify, or distribute your code.',
      'Documentation',
      'low',
      'Create a LICENSE file in the root directory. For student portfolio projects, MIT or Apache 2.0 licenses are highly recommended.'
    );
  }

  // 8. Structure folder checks
  const srcExists = filePaths.some(p => p.startsWith('src/'));
  
  if (packageFileExists && !srcExists && !checks.frontendBackendSeparated && rootDirs.size > 15) {
    addIssue(
      'Unstructured Flat Directory Layout',
      'Your repository root contains too many flat source files without grouping them into clean folders (like src/, lib/, components/, config/). This affects code readability.',
      'Structure',
      'medium',
      'Consolidate source files into a dedicated "src" directory, leaving only configuration manifests and configurations in the root folder.'
    );
  }

  return {
    checks,
    missingFiles,
    issues,
  };
}

// ----------------------------------------------------
// 4. DEPLOYMENT READINESS CHECKER
// ----------------------------------------------------
export function checkDeploymentReadiness(
  fileTree: GitHubFile[],
  packageJsonContent?: string,
  checks?: CodebaseChecks
): DeploymentDetails {
  const filePaths = fileTree.map(f => f.path.toLowerCase());
  
  let detectedFramework = 'Static Web App';
  let buildCommand = null;
  let startCommand = null;
  let outputDirectory = null;
  let recommendedPlatform = 'Vercel';
  let recommendationReason = 'Best suited for static websites or frontend-only React portfolios.';
  let environmentVariablesRequired = false;
  const guideSteps: string[] = [];

  // Parse scripts from package.json if available
  let packageJson: any = null;
  let hasBuildScript = false;
  let hasStartScript = false;

  if (packageJsonContent) {
    try {
      packageJson = JSON.parse(packageJsonContent);
      const scripts = packageJson.scripts || {};
      if (scripts.build) {
        hasBuildScript = true;
        buildCommand = scripts.build;
      }
      if (scripts.start) {
        hasStartScript = true;
        startCommand = scripts.start;
      }
      
      const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
      if (deps['next']) {
        detectedFramework = 'Next.js';
        buildCommand = 'next build';
        startCommand = 'next start';
        outputDirectory = '.next';
        recommendedPlatform = 'Vercel';
        recommendationReason = 'Vercel is the creator of Next.js, providing optimized routing, automatic image caching, and serverless edge functions.';
      } else if (deps['react'] && (deps['vite'] || filePaths.some(p => p.startsWith('vite.config.')))) {
        detectedFramework = 'React (Vite)';
        buildCommand = 'vite build';
        outputDirectory = 'dist';
        recommendedPlatform = 'Vercel';
        recommendationReason = 'React built via Vite compiles to a super-fast static site. Vercel hosts static sites globally on their CDN for free.';
      } else if (deps['react'] && (deps['react-scripts'] || filePaths.includes('public/index.html'))) {
        detectedFramework = 'React (Create React App)';
        buildCommand = 'react-scripts build';
        outputDirectory = 'build';
        recommendedPlatform = 'Vercel';
        recommendationReason = 'React single-page application is best deployed on static hosts like Vercel or Netlify.';
      } else if (deps['express']) {
        detectedFramework = 'Express Node.js Backend';
        buildCommand = scripts.build ? 'npm run build' : null;
        startCommand = scripts.start ? 'npm start' : 'node server.js';
        recommendedPlatform = 'Render';
        recommendationReason = 'Express.js backends run as persistent web services, which are supported excellently by Render\'s Node runtime with free tier options.';
      }
    } catch (e) {
      console.warn('Failed to parse package.json for deployment check', e);
    }
  }

  // Update checks if we parsed scripts
  if (checks) {
    checks.buildScriptExists = hasBuildScript;
    checks.startScriptExists = hasStartScript;
  }

  // Non-Node/Express setups
  if (filePaths.includes('manage.py')) {
    detectedFramework = 'Django Backend';
    recommendedPlatform = 'Render';
    recommendationReason = 'Python web application featuring Django. Best hosted on Render via Gunicorn wsgi configuration.';
    buildCommand = 'pip install -r requirements.txt && python manage.py migrate';
    startCommand = 'gunicorn your_project.wsgi';
  } else if (filePaths.includes('main.py') && filePaths.includes('requirements.txt')) {
    detectedFramework = 'FastAPI Backend';
    recommendedPlatform = 'Render';
    recommendationReason = 'Python FastAPI requires an ASGI server like Uvicorn, which runs natively on Render web services.';
    buildCommand = 'pip install -r requirements.txt';
    startCommand = 'uvicorn main:app --host 0.0.0.0 --port $PORT';
  }

  // Double check environment setup
  if (filePaths.includes('.env.example') || filePaths.includes('.env.sample')) {
    environmentVariablesRequired = true;
  }

  // Multi-folder structure (Full-stack separations)
  if (checks?.frontendBackendSeparated) {
    detectedFramework = 'Fullstack App (Separated)';
    recommendedPlatform = 'Vercel (Frontend) & Render (Backend)';
    recommendationReason = 'Deploying frontend and backend separately provides higher availability, independent builds, and optimizes the serverless CDN for web clients and persistent VMs for databases/APIs.';
  }

  // Build deployment steps guide
  guideSteps.push(`1. Create an account on ${recommendedPlatform.split(' ')[0]}.`);
  if (environmentVariablesRequired) {
    guideSteps.push('2. Review the environment keys inside .env.example and prepare configuration values.');
  }
  
  if (recommendedPlatform.includes('Vercel') && !checks?.frontendBackendSeparated) {
    guideSteps.push('3. Import this GitHub repository directly to Vercel.');
    if (buildCommand) guideSteps.push(`4. Configure the Build Command: "${buildCommand}"`);
    if (outputDirectory) guideSteps.push(`5. Set Output Directory to: "${outputDirectory}"`);
    if (environmentVariablesRequired) {
      guideSteps.push('6. Copy-paste environment variable key-value configurations into Vercel Settings.');
    }
    guideSteps.push('7. Click Deploy. Vercel will build and assign a production URL.');
  } else if (recommendedPlatform.includes('Render') && !checks?.frontendBackendSeparated) {
    guideSteps.push('3. Create a new "Web Service" on Render and link this repository.');
    guideSteps.push('4. Select the environment runtime (e.g. Node or Python).');
    if (buildCommand) guideSteps.push(`5. Set Build Command: "${buildCommand}"`);
    if (startCommand) guideSteps.push(`6. Set Start Command: "${startCommand}"`);
    if (environmentVariablesRequired) {
      guideSteps.push('7. Under Environment tab, insert all variables listed in .env.example.');
    }
    guideSteps.push('8. Trigger deploy. Render will pull, run the build command, and spin up the backend server.');
  } else {
    // Fullstack separation guide
    guideSteps.push('3. For the Frontend: Import the "frontend/" or "client/" folder to Vercel as a new project.');
    guideSteps.push('4. For the Backend: Create a Render "Web Service" pointing to the "backend/" or "server/" folder.');
    guideSteps.push('5. Set the backend FRONTEND_URL environment variable to the Vercel live domain.');
    guideSteps.push('6. Set the frontend API endpoint URL to the Render Web Service live link.');
  }

  // Ready check
  // An app is "ready" if there are no critical security issues and has a package manager file or structure setup
  const ready = filePaths.includes('package.json') || filePaths.includes('requirements.txt') || filePaths.includes('manage.py');

  return {
    ready,
    detectedFramework,
    buildCommand,
    startCommand,
    outputDirectory,
    environmentVariablesRequired,
    recommendedPlatform,
    recommendationReason,
    guideSteps,
  };
}

// ----------------------------------------------------
// 5. COMBINED ANALYZER RUNNER
// ----------------------------------------------------
export async function runDeterministicAnalysis(
  _metadata: GitHubRepoMetadata,
  languages: Record<string, number>,
  fileTree: GitHubFile[],
  readmeContent?: string,
  packageJsonContent?: string
): Promise<FullAnalysisResult> {
  // Stack detection
  const detectedStack = detectTechnologyStack(fileTree, languages, packageJsonContent);
  
  // File tree analysis and security checks
  const { checks, missingFiles, issues } = analyzeRepositoryStructure(fileTree, readmeContent);
  
  // Deployment check
  const deployment = checkDeploymentReadiness(fileTree, packageJsonContent, checks);
  
  // README quality check
  const readme = analyzeReadmeQuality(readmeContent);

  return {
    detectedStack,
    checks,
    missingFiles,
    issues,
    deployment,
    readme,
  };
}
