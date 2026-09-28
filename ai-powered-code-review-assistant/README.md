# AI-Powered Code Review Assistant

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%20PostgreSQL-2D3748.svg)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-4285F4.svg)](https://deepmind.google/technologies/gemini/)

A production-grade, end-to-end web application that conducts in-depth automated code reviews across multiple specialized templates, provides context-grounded AI chat with whole repository knowledge, and generates comprehensive test suites and technical documentation. Designed with a flexible multi-provider architecture compatible with Google Gemini, OpenAI, and local offline models via Ollama and LM Studio.

---

## 📽️ Demo Video
> **Submission Demo Walkthrough**: [Link to 5-Minute Technical Assessment Video Placeholder](https://www.youtube.com/watch?v=placeholder-demo)

---

## 🌟 Feature Tree & Capabilities

```
AI-Powered Code Review Assistant
├── 🔐 Authentication & Session Security
│   ├── JWT Stateless Authentication (Bearer Tokens)
│   ├── Bcrypt Salted Password Hashing (10 rounds)
│   ├── Class-Validator Input Whitelisting & Sanitization
│   └── Next.js Edge Middleware Route Protection
├── 🌐 Dynamic Multi-Provider AI Engine
│   ├── Google Gemini 3.8 Flash (Server-Side Native SDK)
│   ├── OpenAI Protocol Support (gpt-4o, o1, custom models)
│   ├── Local Offline Models (Ollama, LM Studio via http://localhost:*)
│   └── Latency Ping & Connection Health Checker
├── 📂 Interactive Code Explorer
│   ├── Recursive Tree Parser (auto-sorting folders & files)
│   ├── Drag-and-Drop File Upload & ZIP Archive Extraction (JSZip)
│   ├── Syntax-Highlighted Viewer (Line numbers, active defect markers)
│   └── Live In-Browser Code Editor for Instant Fix Retesting
├── 🛡️ Specialized AI Review Engine (Structured JSON)
│   ├── Mode 1: Security Audit (OWASP Top 10, Secrets, Auth Bypasses)
│   ├── Mode 2: Performance Audit (N+1 queries, O(N^2) complexity, leaks)
│   ├── Mode 3: Code Quality & Clean Architecture (SOLID, DRY, Typings)
│   ├── Scope Control: Single File, Selected Files, or Entire Project
│   ├── Automated Severity Scoring (Critical, High, Medium, Low)
│   └── Review History (Paginated, Searchable, Detailed Inspector Modal)
├── 💬 Contextual Repository Chat
│   ├── In-Memory & Database-Backed Code Context Injection
│   ├── Preserved Session Conversation Threading
│   └── Quick Prompt Presets (Architecture, Security, Optimization)
└── ⚡ Bonus Superpowers
    ├── Automated Documentation Generator (Markdown README / API Docs)
    └── Automated Test Suite Generator (Jest, Vitest, Playwright specs)
```

---

## 🏗️ Monorepo Architecture

```
ai-code-review-assistant/
├── backend/                  # NestJS REST API microservice
│   ├── src/
│   │   ├── auth/             # JWT auth, Passport strategy, login/signup DTOs
│   │   ├── projects/         # Project CRUD, file upload, tree parsing
│   │   ├── ai-provider/      # Dynamic AI client, custom provider management
│   │   ├── code-review/      # 3 review modes, structured JSON validation
│   │   ├── chat/             # Contextual codebase chat & session history
│   │   ├── bonus/            # Automated doc & test generator endpoints
│   │   ├── prisma/           # Prisma client module & database service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/              # App router pages (dashboard, reviews, chat, settings)
│   │   └── components/       # CodeExplorer, ReviewModal, CodeViewer
│   ├── middleware.ts         # Route protection middleware
│   ├── package.json
│   └── tailwind.config.ts
├── prisma/
│   └── schema.prisma         # PostgreSQL schema (User, Project, File, Review, etc.)
├── README.md                 # Setup guide and feature catalog
├── ARCHITECTURE.md           # Deep-dive architecture and dataflow diagram
└── AI_USAGE.md               # Transparency log and prompt templates
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- Node.js `v20.x` or higher
- PostgreSQL instance (local or hosted e.g., Supabase / Neon / Cloud SQL)
- NPM or PNPM

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/assessment/ai-code-review-assistant.git
cd ai-code-review-assistant
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/code_review_db?schema=public"

# JWT Secret
JWT_SECRET="your-high-entropy-jwt-secret-key-32-chars-min"

# Google Gemini API (for default server-side AI execution)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Frontend & Backend Ports
PORT=4000
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 2. Database Migrations (Prisma + PostgreSQL)
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to PostgreSQL
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio database viewer
npx prisma studio
```

### 3. Launch NestJS Backend
```bash
cd backend
npm install
npm run start:dev
```
*Backend API will be live on `http://localhost:4000`.*

### 4. Launch Next.js Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend web application will be live on `http://localhost:3000`.*

---

## 🧪 Running Automated Tests
```bash
# Run backend unit & integration tests
cd backend
npm run test

# Run frontend tests
cd ../frontend
npm run test
```

---

## 🔒 Security Best Practices Implemented
- **Class-Validator Whitelisting**: Blocks malicious payloads, SQL parameter tampering, and prototype pollution.
- **Bcrypt Password Hashing**: Passwords stored using 10-round salted bcrypt hashes.
- **JWT Authorization Guards**: All private endpoints strictly guarded via Passport JWT Bearer tokens.
- **Zero API Key Leakage**: Dynamic AI provider calls are proxied securely on the backend server.
