# Cloud Deployment Guide

This guide details instructions for deploying the **AI-Powered GitHub Project Analyzer & Deployment Readiness Checker** to production hosting platforms.

---

## 1. Backend Service Deployment (Render)

Render is excellent for running persistent Node/Express applications.

### Setup Instructions
1. Login to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub account and select this monorepo repository.
3. Configure the following service settings:
   - **Name:** `github-project-analyzer-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (or higher)

### Environment Variables
Under the **Environment** tab, add all required keys:
- `PORT`: `5000` (Render overrides this automatically, but the application reads `process.env.PORT`)
- `NODE_ENV`: `production`
- `FRONTEND_URL`: URL of the frontend deployed on Vercel (e.g. `https://your-app.vercel.app`)
- `FIREBASE_PROJECT_ID`: `ai-powered-github-project`
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Service account private key. Wrap in double quotes e.g. `"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFA...\n-----END PRIVATE KEY-----\n"`. The backend config parser will automatically translate literal `\n` configurations.
- `GITHUB_TOKEN`: Your personal GitHub API access token
- `GEMINI_API_KEY`: Your Gemini API access key

---

## 2. Frontend client Deployment (Vercel)

Vercel is the optimal hosting platform for Next.js applications, offering edge routing, caching, and fast global deliveries.

### Setup Instructions
1. Login to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Select your GitHub repository.
3. Configure the Project parameters:
   - **Root Directory:** Select `frontend`
   - **Framework Preset:** `Next.js`
   - **Build Command:** Automatically detected (`next build`)
   - **Output Directory:** Automatically detected (`.next`)

### Environment Variables
Expand the **Environment Variables** panel and add the client variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase Client API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `ai-powered-github-project.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `ai-powered-github-project`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `ai-powered-github-project.appspot.com`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: App ID
- `NEXT_PUBLIC_API_BASE_URL`: The Render Web Service endpoint URL (e.g. `https://github-analyzer-backend.onrender.com/api`)

Click **Deploy**. Vercel compiles the React application and generates a live production domain link.

---

## 3. Post-Deployment Verification
- Ensure the Render backend service resolves CORS matching the production Vercel domain.
- Register a test account on the client and submit a repository audit. Confirm that the timeline loaders, Gemini AI suggestions, and PDF reports generate and download correctly.
