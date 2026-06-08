# KnowledgeBase AI

A production-quality RAG (Retrieval-Augmented Generation) knowledge assistant that lets you upload documents or ingest web pages, then chat with an AI that answers questions using only your ingested content — with inline source citations for every answer.

Built with **Next.js 14**, **LangChain.js**, **OpenAI**, and **Pinecone**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Sidebar    │  │  Chat Window │  │  Zustand Store        │  │
│  │  UploadZone  │  │  useChat()   │  │  (docs + messages)    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘  │
└─────────┼─────────────────┼─────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                          │
│  POST /api/ingest    POST /api/chat    GET/DELETE /api/docs    │
└─────────┬───────────────────────────────┬─────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────────────┐
│   Ingest Pipeline   │       │       RAG Query Pipeline        │
│  Parse → Chunk →    │       │  Embed query → Pinecone search  │
│  Embed → Store      │       │  → Context → GPT-4o-mini stream │
└─────────┬───────────┘       └───────────────┬─────────────────┘
          │                                     │
          ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Pinecone (cloud)  +  OpenAI API                    │
│         text-embedding-3-small          gpt-4o-mini             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes (Node.js) |
| AI / RAG | LangChain.js, OpenAI API |
| Embeddings | `text-embedding-3-small` |
| Chat model | `gpt-4o-mini` |
| Vector store | Pinecone (cloud) |
| File parsing | pdf-parse, mammoth, cheerio + axios |
| Streaming | Vercel AI SDK (`useChat`) |


---

## Local Setup

### Prerequisites

- Node.js 20+
- OpenAI API key
- Pinecone account and index

### 1. Clone and install

```bash
git clone <your-repo-url> knowledgebase-ai
cd knowledgebase-ai
npm install --legacy-peer-deps
```

### 2. Create a Pinecone index

1. Sign up at [pinecone.io](https://www.pinecone.io/)
2. Create a **serverless** index with:
   - **Name:** `knowledgebase` (or set `PINECONE_INDEX_NAME`)
   - **Dimensions:** `1536` (matches `text-embedding-3-small`)
   - **Metric:** `cosine`
3. Copy your API key from the Pinecone console

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=knowledgebase
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Screenshots

<!-- Add screenshots here after running the app -->

<img width="1280" height="713" alt="Screenshot 2026-06-08 at 2 58 57 PM" src="https://github.com/user-attachments/assets/e7ea1e00-a2e7-4651-9d33-0537b981cf78" />

---

## How It Works

The RAG pipeline has two main flows:

### Ingestion

1. **Upload** — User drops a PDF, TXT, or DOCX file, or pastes a public URL
2. **Parse** — Raw text is extracted using the appropriate parser
3. **Chunk** — Text is split into 800-token chunks with 100-token overlap (LangChain `RecursiveCharacterTextSplitter`)
4. **Embed** — Each chunk is embedded with OpenAI `text-embedding-3-small`
5. **Store** — Vectors + metadata are saved in Pinecone

### Query

1. **Embed** — The user's question is embedded with the same model
2. **Retrieve** — Pinecone returns the top 5 most similar chunks (cosine similarity)
3. **Assemble** — Retrieved chunks are formatted into a context string
4. **Generate** — GPT-4o-mini streams an answer constrained to the context, with source citations
5. **Display** — The UI shows the streamed answer with expandable source cards

---


## License

MIT
