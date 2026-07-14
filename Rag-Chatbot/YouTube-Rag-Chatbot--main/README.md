🎥 YouTube Transcript RAG Chatbot

Overview

The YouTube Transcript RAG Chatbot is a full-stack AI application that enables users to interact with the content of any YouTube video using natural language. Instead of relying on the Large Language Model's general knowledge, the system retrieves relevant information directly from the selected video's transcript using Retrieval-Augmented Generation (RAG).

When a user submits a YouTube URL, the application extracts the transcript, splits it into semantic chunks, generates embeddings using Hugging Face Embeddings, and stores them in a dedicated FAISS vector database identified by the video's unique YouTube Video ID.

A separate vector index is created for every processed YouTube video. This architecture ensures that the chatbot retrieves context only from the selected video's transcript, preventing unrelated information from other videos from being provided to the LLM. It also avoids redundant embedding generation by reusing existing vector databases whenever the same video is processed again.

---

✨ Features

- User Registration & Login
- YouTube Transcript Extraction
- Recursive Character Text Chunking
- Hugging Face Embeddings
- Video-wise FAISS Vector Databases
- Semantic Search
- Retrieval-Augmented Generation (RAG)
- Ollama Integration (Llama 3.1 8B)
- Conversation Management
- SQLite Database
- SQLAlchemy ORM
- FastAPI REST APIs
- HTML, CSS & JavaScript Frontend
- Multi-user Support
- Dynamic Vector Store Loading
- Video-specific Context Retrieval

---

🏗 Project Architecture

                         User
                           │
                           ▼
              HTML / CSS / JavaScript
                           │
                       Fetch API
                           │
                           ▼
                     FastAPI Backend
                ┌─────────────────────┐
                │ Authentication APIs │
                │ Conversation APIs   │
                └─────────────────────┘
                           │
                     SQLite Database
                           │
             User / Video Metadata
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
 Ingestion Pipeline                   Generation Pipeline

YouTube URL                           User Question
      │                                     │
      ▼                                     ▼
Transcript Extraction               Load FAISS Vector Store
      │                                     │
      ▼                                     ▼
Recursive Text Chunking             Semantic Retrieval
      │                                     │
      ▼                                     ▼
Hugging Face Embeddings            Prompt Construction
      │                                     │
      ▼                                     ▼
Video-wise FAISS Index             Ollama (Llama 3.1 8B)
      │                                     │
      └──────────────► Context-Aware Response ◄──────────────┘

---

📂 Project Structure

app/
│
├── Authentication/
├── Database/
├── Indexing/
├── Models/
├── Pipeline/
│   ├── Ingestion_Pipeline.py
│   ├── Retrieval.py
│   └── chains.py
│
├── Prompts/
├── vector_store/
├── chatbot.py
└── main.py

---

🔄 Workflow

1. Ingestion Pipeline

When a user submits a YouTube URL:

1. Extract the YouTube Video ID.
2. Check whether a FAISS vector database already exists for that video.
3. If the vector database exists:
   - Load the existing vector store.
   - Skip transcript processing and embedding generation.
4. If the vector database does not exist:
   - Download the YouTube transcript.
   - Split the transcript into semantic chunks using a Recursive Character Text Splitter.
   - Generate embeddings using Hugging Face Embeddings.
   - Create a dedicated FAISS vector database for the video.
   - Save the vector database using the YouTube Video ID.
5. Store the video metadata in SQLite.

---

2. Generation Pipeline

When a user asks a question:

1. Identify the selected YouTube video.
2. Load the corresponding FAISS vector database.
3. Retrieve the most semantically relevant transcript chunks.
4. Inject the retrieved context into the prompt.
5. Send the prompt to Ollama (Llama 3.1 8B).
6. Generate a context-aware response.
7. Return the response to the frontend.

---

🧠 Vector Store Design

A major design decision in this project was to maintain one independent FAISS vector database for each YouTube video.

Example:

vector_store/
│
├── geQqpO_AFMo/
│   ├── index.faiss
│   └── index.pkl
│
├── iaRj5xGHCuE/
│   ├── index.faiss
│   └── index.pkl
│
└── xxxxxxxxxxx/
    ├── index.faiss
    └── index.pkl

Each vector store is named using the video's unique YouTube Video ID.

Why use a separate vector database for every video?

- Prevents retrieval of chunks from unrelated videos.
- Ensures the LLM receives context only from the selected video.
- Reduces hallucinations caused by irrelevant retrieved documents.
- Eliminates duplicate embedding generation.
- Improves retrieval accuracy and scalability.
- Enables independent processing of multiple YouTube videos.

This design makes the retrieval process deterministic and keeps the generated answers grounded in the selected video's transcript.

---

💻 Technologies Used

Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite

AI / Machine Learning

- LangChain
- Ollama
- Llama 3.1 8B
- Hugging Face Embeddings
- FAISS
- Retrieval-Augmented Generation (RAG)

Frontend

- HTML5
- CSS3
- JavaScript

---

⚙ Key Engineering Decisions

- Modular architecture separating ingestion and generation pipelines.
- One FAISS vector database per YouTube video.
- Dynamic loading of existing vector stores to avoid redundant processing.
- Video ID used as the unique identifier for vector databases.
- Semantic retrieval using LangChain retrievers.
- Conversation management using unique conversation identifiers.
- SQLite used for storing users, videos, and conversation metadata.
- FastAPI REST APIs for communication between frontend and backend.
- Local inference using Ollama (Llama 3.1 8B).

---

🚀 Future Improvements

- JWT Authentication
- Password Hashing (bcrypt)
- Persistent Chat History
- Multiple Video Library
- PostgreSQL
- Redis Caching
- Docker Deployment
- Streaming Responses
- PDF & DOCX Support
- OCR Integration
- Voice Interaction
- Cloud Deployment (AWS/GCP/Azure)

---

📚 Learning Outcomes

This project provided practical experience with:

- Retrieval-Augmented Generation (RAG)
- Large Language Models (LLMs)
- Semantic Search
- Vector Databases (FAISS)
- LangChain Pipelines
- Hugging Face Embeddings
- Ollama Local LLM Deployment
- FastAPI REST API Development
- SQLAlchemy ORM
- SQLite Database Design
- Multi-user Backend Architecture
- Full-Stack AI Application Development
- Modular Software Design
- Context-Aware Question Answering

---

🎯 Real-World Applications

- AI-powered YouTube Assistant
- Podcast Question Answering
- Educational Video Chatbot
- Lecture Assistant
- Corporate Training Assistant
- Research Assistant
- Knowledge Base Chatbot
- Internal Documentation Search
- Content Understanding Platform
- E-learning Systems
