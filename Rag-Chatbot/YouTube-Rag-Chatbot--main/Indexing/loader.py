from pathlib import Path
import uuid


BASE_DIR = Path(__file__).resolve().parent.parent
VECTOR_STORE_DIR = BASE_DIR / "vector_store" / "faiss_db"


## read the contents of an uploaded/local .txt dataset file
def read_text_file(file_path) -> str:
    path = Path(file_path)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


## build a unique, filesystem-safe id for a dataset file
## (used as the folder name for its FAISS vector store)
def generate_doc_id(filename: str) -> str:
    stem = Path(filename).stem
    safe_stem = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in stem) or "dataset"
    unique_suffix = uuid.uuid4().hex[:8]
    return f"{safe_stem}_{unique_suffix}"


## build path function - now relative/portable (works on any OS, any machine)
def build_path(doc_id: str) -> str:
    return str(VECTOR_STORE_DIR / doc_id)


if __name__ == "__main__":
    sample_path = "sample_dataset.txt"
    text = read_text_file(sample_path)
    print(text)
