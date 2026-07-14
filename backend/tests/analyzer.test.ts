import { parseGitHubUrl } from '../src/services/github/github';
import { detectTechnologyStack, analyzeReadmeQuality } from '../src/services/analyzer/analyzer';
import { calculateProjectScore } from '../src/services/analyzer/scoring';

describe('GitHub URL Parser', () => {
  it('should parse standard GitHub URLs', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result.owner).toBe('facebook');
    expect(result.name).toBe('react');
  });

  it('should parse URLs with .git extension', () => {
    const result = parseGitHubUrl('https://github.com/angular/angular.git');
    expect(result.owner).toBe('angular');
    expect(result.name).toBe('angular');
  });

  it('should parse URLs without protocol prefixes', () => {
    const result = parseGitHubUrl('github.com/vuejs/core');
    expect(result.owner).toBe('vuejs');
    expect(result.name).toBe('core');
  });

  it('should parse URLs with extra path segments', () => {
    const result = parseGitHubUrl('https://github.com/expressjs/express/tree/master/examples');
    expect(result.owner).toBe('expressjs');
    expect(result.name).toBe('express');
  });

  it('should throw error on non-github URLs', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/some/repo')).toThrow();
  });
});

describe('Technology Stack Detector', () => {
  it('should detect Next.js framework from package.json and config files', () => {
    const fileTree = [
      { path: 'package.json', type: 'blob' as const },
      { path: 'next.config.js', type: 'blob' as const }
    ];
    const packageJson = JSON.stringify({
      dependencies: {
        'react': '^18.0.0',
        'next': '^14.0.0',
        'tailwindcss': '^3.0.0'
      }
    });

    const stack = detectTechnologyStack(fileTree, { 'TypeScript': 5000 }, packageJson);
    
    expect(stack.frontend).toContain('Next.js');
    expect(stack.frontend).toContain('React');
    expect(stack.frontend).toContain('Tailwind CSS');
    expect(stack.backend).toContain('Node.js');
  });

  it('should detect Express backend from package.json dependencies', () => {
    const fileTree = [{ path: 'package.json', type: 'blob' as const }];
    const packageJson = JSON.stringify({
      dependencies: {
        'express': '^4.18.0'
      }
    });

    const stack = detectTechnologyStack(fileTree, { 'JavaScript': 2000 }, packageJson);
    expect(stack.backend).toContain('Express.js');
  });
});

describe('README Quality Checker', () => {
  it('should score 0 for missing README', () => {
    const analysis = analyzeReadmeQuality(undefined);
    expect(analysis.score).toBe(0);
    expect(analysis.missingSections).toContain('README.md file is completely missing');
  });

  it('should evaluate detailed README correctly', () => {
    const detailedReadme = `
# E-Commerce Project Dashboard
      
      This project dashboard manages online shop configurations.
      
      ## Features
      - Stripe Payment Integration
      - NextJS Server actions
      
      ## Installation
      \`\`\`bash
      npm install
      \`\`\`
      
      ## Usage
      \`\`\`bash
      npm run dev
      \`\`\`
      
      ## Tech Stack
      Built using React and NextJS.
      
      ## Live Demo
      Check it out live at [Live Site](https://my-demo-link.vercel.app)
      
      ![Dashboard Mockup](https://example.com/screenshot.png)
      
      ## License
      MIT License.
      
      ## Contact
      Author: dev@example.com
    `;

    const analysis = analyzeReadmeQuality(detailedReadme);
    expect(analysis.score).toBeGreaterThanOrEqual(80);
    expect(analysis.strongSections).toContain('Title');
    expect(analysis.strongSections).toContain('Installation / Setup');
    expect(analysis.strongSections).toContain('Demo Link');
  });
});

describe('Scoring & AI Fallback Calculations', () => {
  const dummyChecks = {
    readmeExists: true,
    envExampleExists: true,
    gitignoreExists: true,
    licenseExists: true,
    packageFileExists: true,
    lockFileExists: true,
    buildScriptExists: true,
    startScriptExists: true,
    screenshotsFound: true,
    demoLinkFound: true,
    installationStepsFound: true,
    usageSectionFound: true,
    apiDocumentationFound: true,
    frontendBackendSeparated: true,
  };

  it('should calculate perfect score when no configuration errors occur', () => {
    const score = calculateProjectScore(dummyChecks, [], 100, ['.gitignore', 'package.json', 'package-lock.json', 'src/app.ts', 'tsconfig.json']);
    expect(score.overall).toBe(100);
    expect(score.category).toBe('Excellent');
  });

  it('should deduct points for missing config files and lockfiles', () => {
    const brokenChecks = { ...dummyChecks, gitignoreExists: false, lockFileExists: false };
    const score = calculateProjectScore(brokenChecks, [], 100, ['package.json']);
    expect(score.overall).toBeLessThan(100);
    expect(score.structure.deductions.some(d => d.reason.includes('Missing .gitignore'))).toBe(true);
  });
});
