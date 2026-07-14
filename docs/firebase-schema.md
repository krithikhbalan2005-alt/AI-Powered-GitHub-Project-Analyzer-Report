# Firebase Schema Configuration

This document specifies the Firestore databases schema, types, collections structure, and Storage folders layout.

---

## 1. Cloud Firestore Collections

### Collection: `users`
Tracks registered platform developers and placement applicants.

- **Document ID:** Firebase Auth UID
- **Fields:**
```typescript
{
  uid: string;            // Same as Document ID
  name: string;           // Display Name (e.g. John Doe)
  email: string;          // User Email Address
  photoURL: string | null;// Profile Image Link
  role: "user" | "mentor" | "admin";
  totalAnalyses: number;  // Count of audits triggered
  createdAt: Timestamp;   // System creation date
  updatedAt: Timestamp;   // Profile update date
}
```

### Collection: `analyses`
Holds completed repository auditing metrics and suggestions.

- **Document ID:** Automatically Generated UUID
- **Fields:**
```typescript
{
  id: string;             // Same as Document ID
  userId: string;         // Owning developer UID
  status: "pending" | "analyzing" | "completed" | "failed";
  progressStage: string;  // Active run stage for UX loaders

  repository: {
    url: string;          // GitHub repository link
    owner: string;        // Account Owner login
    name: string;         // Repository identifier name
    fullName: string;     // owner/repo-name
    description: string | null;
    defaultBranch: string;
    visibility: "public" | "private";
    primaryLanguage: string | null;
    languages: Record<string, number>; // Language shares (e.g. { TypeScript: 5000 })
    stars: number;
    forks: number;
    openIssues: number;
    lastUpdatedAt: string | null;
  };

  detectedStack: {
    languages: string[];
    frontend: string[];
    backend: string[];
    database: string[];
    testing: string[];
    deployment: string[];
    packageManagers: string[];
  };

  scores: {
    overall: number;      // Summary Score [0 - 100]
    structure: number;    // Structure rating [0 - 25]
    readme: number;       // Documentation rating [0 - 20]
    deployment: number;   // Cloud deploy rating [0 - 25]
    security: number;     // Security rating [0 - 15]
    portfolio: number;    // Portfolio presentation [0 - 5]
  };

  checks: {
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
  };

  missingFiles: string[];

  issues: [
    {
      id: string;
      title: string;
      description: string;
      category: "Security" | "Structure" | "Configuration" | "Documentation";
      severity: "low" | "medium" | "high" | "critical";
      recommendation: string;
    }
  ];

  aiSuggestions: [
    {
      title: string;
      explanation: string;
      priority: "low" | "medium" | "high";
      steps: string[];
    }
  ];

  deployment: {
    ready: boolean;
    detectedFramework: string | null;
    buildCommand: string | null;
    startCommand: string | null;
    outputDirectory: string | null;
    environmentVariablesRequired: boolean;
    recommendedPlatform: string;
    recommendationReason: string;
  };

  summary: string;                  // Short AI evaluation summary
  resumePoint: string;              // Resume CV bullet point
  portfolioDescription: string;     // Project description text

  pdf: {
    generated: boolean;             // PDF state flag
    storagePath: string | null;     // Path inside Storage Bucket
    downloadUrl: string | null;     // Refreshed Signed link URL
  };

  errorMessage: string | null;      // Error message if status is 'failed'
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}
```

### Collection: `mentorComments` (Optional)
Tracks mentor reviews linked to student analyses.

- **Document ID:** Auto-generated UUID
- **Fields:**
```typescript
{
  analysisId: string;
  userId: string;
  mentorId: string;
  comment: string;
  status: "pending" | "reviewed" | "approved";
  createdAt: Timestamp;
}
```

---

## 2. Cloud Storage Directory Layout

Report PDFs are stored inside the `reports/` folder:
```
reports/
└── {userId}/
    └── {analysisId}/
        └── analysis-report.pdf
```
- **Access Policies:** Read access is restricted to the owning client auth matching the path `{userId}`. Write actions are locked entirely to prevent manipulation, allowing uploads only via the Express backend Admin SDK credentials.
