# Aether

### Customizable RAG AI Workspace with Memory, Evaluation & Production CI/CD

**Aether** is a full-stack AI workspace built around a **customizable Retrieval-Augmented Generation (RAG) system**. It combines document-grounded retrieval, persistent conversational memory, workspace-based knowledge management, RAG evaluation, configurable experimentation, and a production deployment pipeline.

Rather than treating RAG as a fixed `retrieve → generate` pipeline, Aether provides an environment to **configure, test, evaluate, experiment, compare, and iteratively improve** RAG behavior.

> **Configure → Test → Evaluate → Experiment → Compare → Improve → Deploy**

---

## 🚀 Live Demo

**[Aether](https://aether-chi-pied.vercel.app/)**

---

## ✨ Key Features

### 🧠 Advanced RAG + Memory

- **Document ingestion and processing**
- **Embedding generation and vector search**
- **Workspace-aware knowledge retrieval**
- **Context assembly for LLM generation**
- **Conversational memory extraction**
- **Persistent memories reused across interactions**
- Combines **retrieved knowledge + conversation context + memory + workspace context**

---

### 🧬 Customizable RAG Experiments

Aether treats the RAG pipeline as a **tunable system** rather than a fixed implementation.

The experiment framework allows different RAG configurations to be **modified and evaluated systematically**:

```text
Configure RAG
     ↓
Run Experiment
     ↓
Evaluate Results
     ↓
Compare Configurations
     ↓
Improve RAG
```

This creates an iterative environment for investigating how changes to the RAG pipeline affect its behavior.

---

### 📊 RAG Evaluation

Aether includes a dedicated evaluation framework for **systematically measuring RAG response quality**, rather than relying only on manual inspection.

The evaluation pipeline uses an **LLM-as-a-Judge approach** to assess generated responses against the retrieved context and evaluation criteria.

Evaluation can be used to:

- Run controlled RAG test cases
- Evaluate generated responses using an **LLM judge**
- Assess response quality against the available context
- Analyze RAG behavior across different configurations
- Compare results between RAG experiments
- Identify weaknesses and areas for improvement

This creates an evaluation loop:

```text
RAG Test Case
     ↓
RAG Pipeline
     ↓
Generated Response
     ↓
LLM-as-a-Judge
     ↓
Evaluation Results
     ↓
Compare Configurations
     ↓
Improve RAG
---

### 🗂️ Workspaces & Knowledge Management

Workspaces provide separate environments for organizing:

- **Documents**
- **Conversations**
- **Retrieved knowledge**
- **AI interactions**

This allows users to maintain multiple knowledge domains within the same application.

---

### 💬 AI Chat

Context-aware conversational AI combining:

- **LLM generation**
- **Retrieved document knowledge**
- **Conversational context**
- **Persistent memory**
- **Workspace context**

---

### 🎙️ AI Transcription

Includes an **AI-powered transcription pipeline** for converting speech/audio into text through a dedicated backend API.

---

### 🔐 Authentication

- Passport.js authentication
- Express sessions
- Session-based access control
- Production cross-origin credential handling

---

# 🏗️ Architecture

```text
                    React / Vite
                         │
                      HTTPS
                         │
                         ▼
                  Node / Express
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     Workspaces      RAG + Memory    Authentication
          │              │
          │      ┌───────┴───────┐
          │      │               │
          │      ▼               ▼
          │   Documents       Memories
          │      │               │
          │      ▼               │
          │  Vector Search       │
          │      │               │
          └──────┼───────────────┘
                 ▼
          Context Assembly
                 │
                 ▼
                LLM
                 │
                 ▼
          AI Response
                 │
                 ▼
        Memory Extraction
```

### RAG Development Loop

```text
        RAG Pipeline
             │
             ▼
        RAG Tests
             │
             ▼
        Evaluation
             │
             ▼
       Experiments
             │
             ▼
       Compare Results
             │
             ▼
        Improve RAG
             │
             └──────→ Iterate
```

---

# ☁️ Production Deployment

Aether is deployed as a **real full-stack production application**.

### Frontend

**React / Vite → Vercel → HTTPS**

### Backend

**Node.js / Express → Docker → Docker Hub → AWS EC2**

### Database

**MongoDB Atlas**

The production backend runs inside a **Docker container on AWS EC2** and communicates with the frontend over HTTPS.

SSL certificates and production secrets are kept outside the source repository and supplied at runtime.

---

# 🔄 CI/CD

Aether uses **GitHub Actions for automated backend deployment**.

A push to `main` triggers:

```text
git push
   ↓
GitHub Actions
   ↓
Build Docker Image
   ↓
Push to Docker Hub
   ↓
SSH into AWS EC2
   ↓
Pull Latest Image
   ↓
Replace Running Container
   ↓
Production Backend
```

The frontend is independently connected to Vercel, so frontend pushes automatically trigger new production deployments.

This gives Aether **automated deployment across both frontend and backend**.

---

# 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, JavaScript |
| **Backend** | Node.js, Express.js, REST APIs |
| **AI / RAG** | LLM APIs, Embeddings, Vector Search, RAG, Memory Extraction |
| **Evaluation** | RAG Tests, Evaluation, Configurable Experiments |
| **Database** | MongoDB Atlas, Vector Search |
| **Authentication** | Passport.js, Express Session |
| **Infrastructure** | Docker, Docker Hub, AWS EC2 |
| **Deployment** | Vercel, HTTPS / SSL |
| **CI/CD** | GitHub Actions |

---

# 🎯 Engineering Highlights

### 🧠 Customizable RAG

RAG behavior can be **configured and experimented on** rather than treated as a fixed pipeline.

### 📊 Evaluation-Driven Development

Dedicated testing and evaluation workflows for **analyzing RAG behavior and identifying areas for improvement**.

### 🧬 RAG Experimentation

**Modify configurations → Run experiments → Compare results → Iteratively improve the system.**

### 💭 Persistent Memory

Extract useful information from conversations and **reuse it as future context**.

### 🗂️ Workspace Architecture

Organize **documents, conversations, and knowledge** into separate workspaces.

### 💻 Full-Stack Ownership

React frontend, Node/Express backend, MongoDB data layer, and AI/RAG infrastructure.

### 🐳 Production Deployment

Dockerized backend running on **AWS EC2 with HTTPS and MongoDB Atlas**.

### 🔄 CI/CD

GitHub Actions automatically **builds, publishes, and deploys backend Docker images**.

### ▲ Continuous Frontend Deployment

Vercel automatically **builds and deploys frontend changes**.

---

# 📁 Project Structure

```text
Aether/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── FRONTEND/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── Evaluation.jsx
│       ├── RAGTests.jsx
│       ├── RAGExperiments.jsx
│       └── ...
│
├── BACKEND/
│   ├── config/
│   ├── models/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── document.js
│   │   ├── workspace.js
│   │   ├── evaluation.js
│   │   ├── RAGTest.js
│   │   ├── RAGExperiment.js
│   │   └── transcription.js
│   │
│   ├── utils/
│   │   ├── embeddings.js
│   │   ├── extractMemories.js
│   │   └── openai.js
│   │
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# 👨‍💻 Author

**Rohan Saikumar**

IIT Bhubaneswar
