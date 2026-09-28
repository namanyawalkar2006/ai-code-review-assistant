# AI Usage & Transparency Log

## 1. Overview & Tooling Disclosure

In compliance with the technical assessment submission guidelines, this document provides an honest, comprehensive account of how Artificial Intelligence tools were utilized during the design, development, and prompt engineering phases of the **AI-Powered Code Review Assistant**.

### Primary Tooling & Allocation
- **Google AI Studio / Gemini 3.8 Flash**: Employed for rapid scaffolding of repetitive boilerplate, initial NestJS module skeletons, and React UI layout structures.
- **Manual Senior Engineering**: Handcrafted and rigorously maintained for:
  - **Prisma Schema Relations & Constraints**: Multi-tenant relational integrity (`User -> Project -> File -> Review -> ChatSession`), cascade deletions, composite indices, and JSON data structures for reviews.
  - **Custom NestJS Guards & Security**: Custom JWT authentication guards, dynamic parameter validation with `class-validator`, rate limiting, and safe error boundary handling without exposing internal traces.
  - **Prompt Engineering Logic & Output Enforcement**: Deterministic JSON extraction grammar, system instructions tailored for DevSecOps, high-scale performance diagnostics, and fallback regex sanitization for AI completions.

---

## 2. Engineering Division: Code Generation vs. Manual Engineering

| Workstream / Component | AI-Assisted Scaffolding (%) | Manual Senior Engineering (%) | Core Manual Engineering Responsibility |
| :--- | :--- | :--- | :--- |
| **System Architecture & Monorepo** | 20% | 80% | Monorepo layout, modular NestJS boundaries, dynamic provider strategy pattern. |
| **Database Schema (Prisma/Postgres)** | 15% | 85% | Hand-tuned relations, foreign key cascades, JSON column tradeoffs, composite indexing. |
| **NestJS Backend & Security Guards** | 25% | 75% | Custom Passport JWT guards, dynamic HTTP client resilience, class-validator sanitization. |
| **AI Prompt Engineering & Validation** | 25% | 75% | Strict zero-shot JSON grammar, role-specific prompts (Security, Performance, Quality). |
| **Frontend UI/UX & Code Explorer** | 35% | 65% | Recursive tree algorithms, Monaco/Prism styling, loading skeletons, dark mode palette. |
| **Documentation & Technical Specs** | 30% | 70% | Architectural accuracy verification, ASCII diagram curation, installation verification. |
| **Overall Project Average** | **25%** | **75%** | **Rigorous manual architecture accelerated with targeted AI scaffolding.** |

---

## 3. Exact AI Prompt Templates Utilized

### Template 1: Security Code Review Engine (Prompt)
```text
You are a Principal Application Security Architect and Lead DevSecOps Auditor.
Perform an exhaustive SECURITY REVIEW on the submitted codebase.
Detect:
1. OWASP Top 10 vulnerabilities (SQL/NoSQL/Command injection, SSRF, Broken Access Control, IDOR).
2. Hardcoded secrets, API tokens, unhashed credentials, insecure cryptography or random generators.
3. Authentication and authorization bypasses, JWT misconfigurations, CORS/CSRF vulnerabilities.
4. Input validation and sanitization oversights.
5. Insecure dependencies and deserialization vectors.

CRITICAL OUTPUT FORMAT:
You MUST respond with a single valid, well-formed JSON object ONLY (no markdown surrounding ticks).
The JSON schema MUST match:
{
  "summary": "Executive overview of findings and architectural health score (3-5 sentences)",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "issues": [
    {
      "file": "relative/file/path.ext",
      "line": 42,
      "rule": "Specific rule name e.g. SEC-001-HARDCODED-SECRET",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "message": "Precise description of the vulnerability or defect",
      "suggestedFix": "Code diff snippet or concrete replacement code"
    }
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}
```

### Template 2: Performance Review Engine (Prompt)
```text
You are a Principal Performance Engineer and High-Scale Systems Architect.
Perform an exhaustive PERFORMANCE REVIEW on the submitted codebase.
Detect:
1. Inefficient algorithmic complexity (O(N^2) loops, nested iterations).
2. Database bottlenecks (N+1 query problems, missing indexes, unpaginated scans, connection leakages).
3. Memory leaks, unbounded cache growth, dangling listeners or event subscriptions.
4. Blocking I/O or synchronous operations in asynchronous event loops.
5. Frontend rendering bottlenecks (unmemoized re-renders, large bundle imports, layout thrashing).

[Same JSON Schema Constraint Enforced]
```

### Template 3: Code Quality Review Engine (Prompt)
```text
You are a Staff Software Architect and Clean Code Evangelist.
Perform an exhaustive CODE QUALITY REVIEW on the submitted codebase.
Detect:
1. Architectural violations (separation of concerns, SOLID principles, spaghetti code, god classes).
2. Code maintainability, cyclomatic complexity, code duplication (DRY violations).
3. Type safety gaps, implicit 'any', unsafe casts, unhandled promise rejections.
4. Inconsistent naming conventions, lack of readability, dead code or commented-out code.
5. Error handling resilience and edge-case boundaries.

[Same JSON Schema Constraint Enforced]
```

### Template 4: Contextual Codebase Chat
```text
You are an elite Senior Staff Engineer and AI Code Review Assistant.
You have full access to the user's project codebase below:
{{filesContext}}

Instructions:
1. Answer the developer's question directly with high technical precision.
2. Ground your answers specifically in the provided codebase files, citing exact files, classes, and lines.
3. Suggest concrete, production-ready code examples when recommending improvements or fixes.
4. Keep explanations concise, professional, and actionable.
```

---

## 4. Key Architectural Decisions Justified

1. **Why NestJS over Express/Ad-hoc microservices?**
   - *Justification*: NestJS provides enterprise-grade dependency injection, modular domain boundaries, native TypeScript support, and out-of-the-box integration with Passport and Class-Validator. This prevents architectural decay as the codebase expands.

2. **Why dynamic OpenAI-compatible provider alongside Gemini?**
   - *Justification*: In enterprise code review settings, privacy policies frequently mandate on-premise execution (e.g., using Ollama or LM Studio on local GPUs) to prevent intellectual property transmission to third-party clouds. Supporting dynamic base URLs and models offers true vendor independence.

3. **Why PostgreSQL JSON columns for review issues?**
   - *Justification*: Preserving the whole review payload as atomic JSON guarantees that historical reviews remain immutable even if the issue schema evolves over time, while avoiding complex table joins for simple review reports.
