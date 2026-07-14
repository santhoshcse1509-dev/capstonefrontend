from Indexing.loader import read_text_file, build_path
from Indexing.chunking import get_chunks
from vector_store.VectorStore import CreateStore
from pathlib import Path


## ingestion pipeline now takes the path of a local .txt dataset file
## and the doc_id (unique id) that will be used as the vector store folder name
async def ingestion_pipeline(file_path: str, doc_id: str):
    try:
        document = read_text_file(file_path)          # read the txt dataset
        db_path = build_path(doc_id)                    # folder for this dataset's vector store

        if not Path(db_path).exists():                  # skip re-embedding if already ingested
            chunks = get_chunks(document)                # get chunks
            CreateStore(chunks, db_path=db_path)         # store creating

    except Exception as e:
        raise e


if __name__ == "__main__":
    import asyncio

    sample_file = "sample_dataset.txt"
    sample_doc_id = "sample_dataset"
    asyncio.run(ingestion_pipeline(sample_file, sample_doc_id))
