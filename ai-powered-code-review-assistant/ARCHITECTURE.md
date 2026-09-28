# Architecture & System Design Specification

## 1. System Overview

The **AI-Powered Code Review Assistant** is architected as an enterprise-grade monorepo combining a high-performance **NestJS REST API** backend, a modern **Next.js 15 App Router** frontend, a **PostgreSQL** relational database managed through **Prisma ORM**, and a decoupled **Dynamic AI Provider Engine** capable of dispatching prompts to Google Gemini (`gemini-3.8-flash`), OpenAI, or local offline LLMs (Ollama / LM Studio).

---

## 2. ASCII Data Flow & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                       Next.js 15 App Router (Frontend)                   |   |
|   |  - Route Guards (middleware.ts)                                            |   |
|   |  - Code Explorer & Tree Parser                                            |   |
|   |  - Syntax-Highlighted Viewer / Editor                                     |   |
|   |  - 3-Mode Review Trigger (Security / Performance / Quality)               |   |
|   |  - Contextual AI Chat & Bonus Generators (Docs & Tests)                   |   |
|   +---------------------------------------------------------------------------+   |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON (Bearer JWT)
                                           v
+-----------------------------------------------------------------------------------+
|                                  API GATEWAY                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                         NestJS Application Server                         |   |
|   |                                                                           |   |
|   |   +-------------------+  +--------------------+  +--------------------+   |   |
|   |   |    AuthModule     |  |   ProjectsModule   |  | AIProviderModule   |   |   |
|   |   | (JWT, Passport,   |  | (CRUD, File Tree,  |  | (Dynamic Client,   |   |   |
|   |   |  Bcrypt Hashing)  |  |  ZIP Extraction)   |  |  OpenAI/Ollama)    |   |   |
|   |   +-------------------+  +--------------------+  +--------------------+   |   |
|   |                                                                           |   |
|   |   +-------------------+  +--------------------+  +--------------------+   |   |
|   |   | CodeReviewModule  |  |    ChatModule      |  |    BonusModule     |   |   |
|   |   | (3 Mode Engine,   |  | (Context Builder,  |  | (DocGen, TestGen,  |   |   |
|   |   |  JSON Enforcer)   |  |  Session Store)    |  |  Vitest/Jest)      |   |   |
|   |   +---------+---------+  +---------+----------+  +---------+----------+   |   |
|   |             |                      |                       |              |   |
|   +-------------|----------------------|-----------------------|--------------+   |
+-----------------|----------------------|-----------------------|------------------+
                  |                      |                       |
                  v                      v                       v
+-----------------------------------------------------------------------------------+
|                             AI ORCHESTRATION LAYER                                |
|                                                                                   |
|   +---------------------------------------+  +--------------------------------+   |
|   |        Google Gemini Server SDK       |  |     Dynamic AI HTTP Client     |   |
|   |   - Model: 'gemini-3.8-flash'         |  |   - OpenAI (gpt-4o, o1)        |   |
|   |   - JSON Schema Constraint Enforced   |  |   - Local Ollama (/v1)         |   |
|   |   - User-Agent: 'aistudio-build'      |  |   - LM Studio (/v1)            |   |
|   +-------------------+-------------------+  +----------------+---------------+   |
|                       |                                       |                   |
+-----------------------|---------------------------------------|-------------------+
                        v                                       v
             +---------------------+                 +--------------------+
             | Google Gemini Cloud |                 | Custom / Local LLM |
             +---------------------+                 +--------------------+
                                      |
                                      | Structured JSON / Markdown
                                      v
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE LAYER                                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                    Prisma ORM 5.x (PostgreSQL Database)                   |   |
|   |                                                                           |   |
|   |  - users        : UUID, email, passwordHash, timestamps                   |   |
|   |  - projects     : UUID, userId (FK), name, description                    |   |
|   |  - files        : UUID, projectId (FK), path (UNIQUE), content, size      |   |
|   |  - reviews      : UUID, projectId (FK), mode, summary, issuesJson,        |   |
|   |                   recommendationsJson, severity                           |   |
|   |  - ai_providers : UUID, userId (FK), baseUrl, apiKeyEncrypted, modelName  |   |
|   |  - chat_sessions: UUID, projectId (FK), title                             |   |
|   |  - messages     : UUID, sessionId (FK), sender, text                      |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Design Decisions

### Relational Integrity with PostgreSQL & Prisma
1. **Cascade Deletes**:
   - `User -> Project -> [File, Review, ChatSession -> Message]`
   - Deleting a project automatically purges associated files, review audits, and chat history, eliminating orphan records and storage bloat.
2. **Compound Unique Constraints**:
   - `File`: `@@unique([projectId, path])` ensures that file paths are deterministic and idempotent within a project repository, preventing duplicate path collisions during bulk uploads or ZIP extractions.
3. **Optimized Indexes for Performance**:
   - `@@index([userId])` on `projects` and `ai_providers` ensures instant querying of user workspaces.
   - `@@index([projectId])` on `files` and `reviews` accelerates recursive tree rendering and review history pagination.
   - `@@index([mode])` and `@@index([severity])` on `reviews` allow fast filtering on dashboard analytics.
4. **Structured JSON vs. Normalized Issue Rows**:
   - `issuesJson` and `recommendationsJson` are stored as native PostgreSQL `Json` columns on `Review`.
   - *Rationale*: AI code reviews produce variable schema outputs (line, rule, suggestedFix, severity). Storing issues inside an indexed `Json` document enables atomic writes of the entire review payload in a single transaction without multi-table locks, while retaining the capability to query JSON attributes with PostgreSQL `->>` operators.

---

## 4. AI Orchestration & Review Engine Logic

### 1. Dynamic Provider Abstraction
The system incorporates an `AIProviderService` that acts as a strategy pattern:
- **Default Cloud Model**: When no custom endpoint is supplied, the NestJS backend uses `@google/genai` with model `gemini-3.8-flash`. The API key is securely retrieved from server-side environment variables (`GEMINI_API_KEY`) with `User-Agent: 'aistudio-build'`.
- **Custom / Offline Endpoints**: When developers configure a custom provider (e.g., local Ollama for privacy or enterprise OpenAI instance), the `DynamicAIClient` adapts the request into the standardized OpenAI-compatible `/chat/completions` protocol with customized temperature and JSON response format constraints.

### 2. Prompt Engineering & Structured JSON Enforcement
To eliminate markdown clutter and guarantee predictable UI rendering:
- System prompts explicitly mandate a strict JSON grammar schema.
- Gemini is invoked with `responseMimeType: 'application/json'`.
- A resilient parser (`cleanAndParseJson`) strips potential markdown code fences (` ```json `) and ensures default fallbacks in the event of edge-case schema deviations.

### 3. Review Modes Logic
- **Security Mode**: Focuses on OWASP Top 10, sanitization, authentication gates, cryptographic weaknesses, and secret exposure.
- **Performance Mode**: Pinpoints time/space complexity hotspots, unindexed database queries, memory leaks, and blocking I/O.
- **Code Quality Mode**: Enforces SOLID principles, DRY, cyclomatic complexity reduction, TypeScript strictness, and modular boundaries.

### 4. Code Context Packaging for AI Chat
- Files selected or present in the active repository are transformed into tagged markdown envelopes (`### FILE: path\n```content````).
- The assistant receives the repository context in its system instruction and maintains chat history in the `messages` table for conversational continuity.
