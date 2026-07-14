# Quality Testing Guide

This guide describes the testing suites, commands, and QA checklist for the GitAnalyzer fullstack project.

---

## 1. Automated Testing

The backend includes a testing framework using **Jest** and **ts-jest**.

### Pre-requisites
Ensure dev dependencies are installed by running `npm install` inside the `backend` directory.

### Run Tests
Trigger Jest from the `backend/` directory root:
```bash
npm run test
```
To run tests in watch mode:
```bash
npx jest --watch
```

### Covered Service Modules
Automated unit tests check:
1. **GitHub URL parser:** Checks parser returns owner and name correctly, handles `.git` extension and tree branch prefixes, throws errors on invalid domains.
2. **Technology stack detector:** Mocks file lists and dependencies to confirm React, Next.js, Express, and database libraries identify correctly.
3. **README grader:** Validates score calculation weights for empty README vs. detailed README with installation and live demo links.
4. **Scoring matrix:** Verifies that point totals match expected values and deducts scores for missing files.

---

## 2. Manual QA Verification Checklist

Verify these 15 scenarios to confirm platform compliance:

| ID | Test Scenario | Expected Outcome |
|----|---------------|------------------|
| 1 | Register new user | Profile details are created in Firestore users collection. Role is "user". |
| 2 | Login with email | ID Token generated. Redirects to dashboard showing stats cards. |
| 3 | Submit React Vite Repo | Fetches metadata, scans tree, detects React/Vite, generates CV points, uploads PDF. |
| 4 | Submit Next.js Repo | Framework identified as Next.js. Deploy target recommends Vercel. |
| 5 | Submit Express Repo | Framework identified as Express.js Node backend. Deploy recommends Render. |
| 6 | Submit Fullstack Repo | Separation check identifies frontend & backend folders. Guide outlines dual deploy. |
| 7 | Submit repo without README | README score displays 0. suggestions list "Create README.md documentation". |
| 8 | Submit repo without package | completeness score drops. lists missing manifest file. |
| 9 | Submit repo without lockfile | structure score deducts. warns about missing lockfile. |
| 10| Submit invalid repository URL | Displays "Invalid GitHub URL format" in input form, blocking API scans. |
| 11| Submit private repository | Displays error: "Private repositories are not supported... Please provide public URL." |
| 12| Trigger PDF generation | PDF compiles, uploads to reports/ folder, returns clickable signed download URL. |
| 13| Refresh profile data | Updating name in `/profile` updates database user record. photoURL supports null. |
| 14| Delete analysis log | Document removed from analyses collection. report PDF file deleted from storage. |
| 15| Access others analyses | Accessing `/analyses/:id` where uid !== owner returns `403 Forbidden` error. |
