export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: 'user' | 'mentor' | 'admin';
  totalAnalyses: number;
  createdAt: any;
  updatedAt: any;
}

export interface RepoMetadata {
  url: string;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  visibility: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdatedAt: string | null;
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
}

export interface AISuggestion {
  title: string;
  explanation: string;
  priority: 'low' | 'medium' | 'high';
  steps: string[];
}

export interface ScoreDetails {
  overall: number;
  structure: number;
  readme: number;
  deployment: number;
  security: number;
  portfolio: number;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  progressStage: string;
  repository: RepoMetadata;
  detectedStack: {
    languages: string[];
    frontend: string[];
    backend: string[];
    database: string[];
    testing: string[];
    deployment: string[];
    packageManagers: string[];
  };
  scores: ScoreDetails;
  checks: CodebaseChecks;
  missingFiles: string[];
  issues: SecurityIssue[];
  aiSuggestions: AISuggestion[];
  deployment: DeploymentDetails;
  summary: string;
  resumePoint: string;
  portfolioDescription: string;
  pdf: {
    generated: boolean;
    storagePath: string | null;
    downloadUrl: string | null;
  };
  errorMessage: string | null;
  createdAt: any;
  updatedAt: any;
  completedAt: any;
}
