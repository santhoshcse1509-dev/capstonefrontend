from pathlib import Path
from Pipeline.Ingestion_Pipeline import ingestion_pipeline
from Pipeline.chains import BuildChain

## ---------------------------------------------------------------------------
## This module wires the RAG chatbot to ONE fixed, hardcoded dataset
## (data/sample_document.txt) instead of a per-user uploaded file.
## No upload API, no conversation_id, no DB lookup needed to chat.
## ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# the fixed dataset file -> put/replace your .txt here
FIXED_DATASET_PATH = BASE_DIR / "data" / "sample_document.txt"

# fixed doc_id -> also the fixed folder name inside vector_store/faiss_db/
FIXED_DOC_ID = "sample_document"

# chain is built once and cached in memory (module-level singleton)
_fixed_chain = None


async def init_fixed_dataset():
    """
    Call this once at app startup.
    - Embeds data/sample_document.txt into vector_store/faiss_db/sample_document
      (skipped automatically if that folder already exists).
    - Builds and caches the retrieval chain so every request reuses it.
    """
    global _fixed_chain

    if not FIXED_DATASET_PATH.exists():
        raise FileNotFoundError(f"Fixed dataset not found at {FIXED_DATASET_PATH}")

    await ingestion_pipeline(str(FIXED_DATASET_PATH), FIXED_DOC_ID)
    _fixed_chain = BuildChain(FIXED_DOC_ID)


def get_fixed_chain():
    if _fixed_chain is None:
        raise RuntimeError(
            "Fixed dataset chain not initialized. Make sure init_fixed_dataset() "
            "runs on app startup (see app.py)."
        )
    return _fixed_chain
