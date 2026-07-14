# AI-Powered GitHub Project Analyzer & Deployment Readiness Checker

GitAnalyzer is a fullstack developer-mentor platform designed for students, freshers, placement trainers, and mentors. It audits public GitHub repositories, computes quality scores, matches hosting paths, and uses Gemini AI to compile resume CV bullet points and codebase suggestions.

---

## 🚀 Key Features
1. **GitHub Static Audits:** Normalizes URLs and traverses file trees recursively up to 1000 items (no local code execution).
2. **Technographics detection:** Analyzes manifests (`package.json`, `requirements.txt`) to identify frontend/backend framworks and database packages.
3. **Safety Analysis:** Warns developers about exposed secrets files (e.g. `.env`, `.pem`, private certificates) or committed cache folders.
4. **README Grading:** Audits README content for installation blocks, screenshots, licenses, contact links, and demo badging.
5. **Deployment Guide:** Matches tech setups with hosting targets (Vercel, Render), suggestion scripts, and variables.
6. **Gemini AI technical mentor:** Outputs Cv bullet points, portfolio descriptions, and prioritize steps.
7. **Report exports:** Generates professional A4 PDF reports (using PDFKit) and uploads them securely to Firebase Storage.

---

## 🛠 Required Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons, React Hook Form, Zod.
- **Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Axios, Zod, PDFKit, Helmet, CORS, Rate Limiters.
- **Database / Cloud:** Firebase Auth (Email/Pass), Cloud Firestore, Cloud Storage.
- **AI Integration:** Google Gemini 1.5 Flash.

---

## 📁 Repository Directory Layout
```
ai-github-project-analyzer/
├── firebase/
│   ├── firestore.rules          # Security constraints for Firestore collections
│   ├── storage.rules            # Security constraints for PDF Storage paths
│   └── firestore.indexes.json   # Composite indexing details
├── backend/
│   ├── src/
│   │   ├── config/              # Environment config validation
│   │   ├── controllers/         # Endpoint request controllers
│   │   ├── middleware/          # Auth guards and request validates
│   │   ├── routes/              # Routing bindings
│   │   ├── services/            # Modularity API services (AI, PDF, GitHub, etc.)
│   │   └── server.ts            # Express launcher boot script
│   ├── tests/                   # Jest unit testing suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router paths
│   │   ├── components/          # Shared components
│   │   ├── contexts/            # Firebase Auth React context provider
│   │   ├── lib/                 # Firebase Web SDK initialization
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
└── docs/                        # Architecture, APIs, and schemas guides
```

---

## ⚙️ Local Installations & Setup

### Pre-requisites
- **Node.js** (v18+)
- **Firebase Project:** Create a Firebase project named `ai-powered-github-project` on the Firebase Console, and activate Email/Password signups under Authentication.

### 1. Backend Server Setup
1. Move to the backend folder:
   ```bash
   cd backend
   ```
2. Copy and configure variables:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase admin service credential client email, private key certificate, Gemini API key, and GitHub token.
3. Install and trigger dev mode:
   ```bash
   npm install
   npm run dev
   ```

### 2. Frontend Client Setup
1. Move to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Copy and configure variables:
   ```bash
   cp .env.example .env.local
   ```
   Insert your Firebase Web API config parameters.
3. Install and run client:
   ```bash
   npm install
   npm run dev
   ```
4. Access the web client locally at `http://localhost:3000`.

---

## 🧪 Testing and Compiles
To check types and compile files in production modes:

- **Backend compilation:** `cd backend && npm run build`
- **Backend unit tests:** `cd backend && npm run test`
- **Frontend compilation:** `cd frontend && npm run build`

---

## 📖 Available Documentation Guides
Read detailed references inside the `docs/` folder:
1. [Architecture & Flows](file:///docs/architecture.md)
2. [REST API Details](file:///docs/api-documentation.md)
3. [Firestore Schemas](file:///docs/firebase-schema.md)
4. [Deployment Procedures](file:///docs/deployment-guide.md)
5. [Testing Specifications](file:///docs/testing-guide.md)
6. [Postman Endpoints Collection](file:///docs/postman-collection.json)
