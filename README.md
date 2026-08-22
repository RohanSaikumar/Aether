# Aether

### Production-Ready AI Workspace with RAG, Evaluation & Automated Deployment

Aether is a full-stack AI workspace designed around **Retrieval-Augmented Generation (RAG)**, enabling users to interact with their knowledge through an AI assistant while providing dedicated tools to **test, evaluate, and experiment with different RAG configurations**.

Aether is built as an end-to-end AI application with a complete production workflow — from document ingestion and retrieval to evaluation, deployment, and continuous delivery.

## 🚀 Live Demo

**Frontend:** https://aether-chi-pied.vercel.app/

---

## ✨ Key Features

### 🤖 AI-Powered Chat

- Conversational AI interface powered by LLM APIs
- Context-aware responses using retrieved information
- Persistent conversations and workspaces
- Authentication and session-based access control

### 📚 Retrieval-Augmented Generation

Aether implements a complete RAG workflow for grounding LLM responses in user-provided knowledge.

The pipeline includes:

- Document ingestion
- Text processing and chunking
- Embedding generation
- Vector-based retrieval
- Context construction
- LLM response generation

This allows the system to retrieve relevant information before generating a response rather than relying solely on the model's parametric knowledge.

### 🧪 RAG Evaluation

Aether includes a dedicated evaluation system for measuring the quality of RAG-based responses.

The evaluation interface allows experiments to be run against controlled test cases, making it possible to investigate how changes to the retrieval and generation pipeline affect results.

### 🧬 RAG Experiments

Aether goes beyond static evaluation with an **experiment framework for modifying RAG configurations and comparing their results**.

Different retrieval/generation configurations can be tested systematically, allowing the RAG pipeline to be iteratively tuned rather than treated as a fixed component.

This creates a workflow of:

**Change RAG configuration → Run experiment → Evaluate → Compare → Iterate**

### 📄 Document & Workspace Management

- Upload and process documents
- Organize knowledge into workspaces
- Retrieve information from workspace-specific data
- Manage documents through backend APIs

### 🎙️ AI Transcription

Aether also includes an AI transcription pipeline for converting speech/audio into text and making the resulting information available to the application.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React / Vite     │
                    │      Frontend         │
                    └──────────┬───────────┘
                               │
                         HTTPS / REST
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Node.js / Express  │
                    │       Backend         │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌────────────┐    ┌─────────────┐   ┌─────────────┐
      │  MongoDB   │    │  RAG / LLM  │   │   Auth /    │
      │   Atlas    │    │   Pipeline  │   │   Sessions  │
      └────────────┘    └─────────────┘   └─────────────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ RAG Evaluation │
                      │ & Experiments  │
                      └────────────────┘
