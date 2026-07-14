# Backend API Documentation

The GitAnalyzer backend exposes a REST API built on Express.js and protected by Firebase ID tokens.

---

## Global Headers & Formatting

For all **Protected** endpoints, you must supply the Firebase ID token in the authorization header:
```http
Authorization: Bearer <firebase-id-token>
```

### Success Response Format
```json
{
  "success": true,
  "message": "Human readable action message",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Human readable error statement",
  "code": "error/identifier-code",
  "details": []
}
```

---

## Endpoint Details

### 1. Health Status check (Public)
Checks backend status and connection environment.

- **Method:** `GET`
- **Route:** `/api/health`
- **Response (200):**
```json
{
  "success": true,
  "message": "AI Powered GitHub Analyzer Engine online",
  "data": {
    "status": "healthy",
    "timestamp": "2026-07-14T06:30:00Z",
    "environment": "development"
  }
}
```

### 2. Submit Repository Audit (Protected)
Submits a public GitHub URL to process a full codebase analysis.

- **Method:** `POST`
- **Route:** `/api/analyses`
- **Body:**
```json
{
  "repositoryUrl": "https://github.com/facebook/react"
}
```
- **Response (200):**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "id": "ANALYSIS_DOCUMENT_ID",
    "userId": "FIREBASE_USER_UID",
    "status": "completed",
    "repository": {
      "url": "https://github.com/facebook/react",
      "owner": "facebook",
      "name": "react",
      "stars": 220000,
      "defaultBranch": "main"
    },
    "scores": {
      "overall": 92,
      "structure": 25,
      "readme": 18,
      "deployment": 25,
      "security": 15,
      "portfolio": 9
    },
    "detectedStack": {
      "languages": ["JavaScript", "TypeScript"],
      "frontend": ["React"]
    },
    "aiSuggestions": [ ... ],
    "resumePoint": "CV string representation...",
    "portfolioDescription": "Portfolio description..."
  }
}
```

### 3. Retrieve Analyses History (Protected)
Fetches a list of previous audits for the logged-in user.

- **Method:** `GET`
- **Route:** `/api/analyses`
- **Query Params:**
  - `status` (Optional): "pending" | "analyzing" | "completed" | "failed"
  - `limit` (Optional): number (default 10)
  - `page` (Optional): number (default 1)
- **Response (200):**
```json
{
  "success": true,
  "message": "Analyses history fetched",
  "data": {
    "analyses": [ ... ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

### 4. Fetch Analysis Detail (Protected)
Retrieves a specific repository analysis detail log.

- **Method:** `GET`
- **Route:** `/api/analyses/:analysisId`
- **Response (200):** returns the analysis JSON details (same as POST response).

### 5. Delete Analysis Log (Protected)
Deletes a scan record from Firestore and cleans up its PDF report from Cloud Storage.

- **Method:** `DELETE`
- **Route:** `/api/analyses/:analysisId`
- **Response (200):**
```json
{
  "success": true,
  "message": "Analysis record successfully deleted from history",
  "data": { "id": "ANALYSIS_DOCUMENT_ID" }
}
```

### 6. Generate PDF Report (Protected)
Renders a PDF report layout and uploads it to Firebase Storage.

- **Method:** `POST`
- **Route:** `/api/analyses/:analysisId/report`
- **Response (200):**
```json
{
  "success": true,
  "message": "PDF report generated successfully",
  "data": {
    "downloadUrl": "https://storage.googleapis.com/...signed-url..."
  }
}
```

### 7. Fetch Report Download URL (Protected)
Returns a refreshed signed link for the audit report.

- **Method:** `GET`
- **Route:** `/api/analyses/:analysisId/report`
- **Response (200):**
```json
{
  "success": true,
  "message": "Signed URL successfully generated",
  "data": {
    "downloadUrl": "https://storage.googleapis.com/...signed-url..."
  }
}
```

### 8. Fetch User Profile details (Protected)
Fetches user details from Firestore. If first time logging in, registers their database document.

- **Method:** `GET`
- **Route:** `/api/profile`
- **Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "uid": "FIREBASE_USER_UID",
    "name": "Developer Name",
    "email": "dev@example.com",
    "role": "user",
    "totalAnalyses": 4
  }
}
```

### 9. Edit Profile details (Protected)
Updates display parameters for user profile.

- **Method:** `PUT`
- **Route:** `/api/profile`
- **Body:**
```json
{
  "name": "Updated Name",
  "photoURL": "https://example.com/photo.png"
}
```
- **Response (200):**
```json
{
  "success": true,
  "message": "Profile details updated successfully",
  "data": { ... }
}
```

### 10. Admin Analytics Console (Admin Only)
Fetches platform aggregates. Restrained using admin validation checks.

- **Method:** `GET`
- **Route:** `/api/admin/analytics`
- **Response (200):**
```json
{
  "success": true,
  "message": "Admin metrics fetched successfully",
  "data": {
    "totalUsers": 24,
    "totalAnalyses": 182,
    "averageScore": 76,
    "deploymentReadyRate": 64,
    "topTechnologies": [
      { "name": "React (Vite)", "count": 42 },
      { "name": "Next.js", "count": 28 }
    ]
  }
}
```
