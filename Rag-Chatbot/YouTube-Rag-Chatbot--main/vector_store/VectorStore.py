from langchain_community.vectorstores import FAISS 
from Models.models import embeddings 
from pathlib import Path 


def load_store(db_path) :
    try :  
        vector_store = FAISS.load_local(
            db_path,
            embeddings,
            allow_dangerous_deserialization=True
            ) 
        return vector_store
    except Exception as e : 
        raise e 


def CreateStore(chunks , db_path ) : 
    try : 
        vector_store = FAISS.from_documents(
            documents=chunks,
            embedding=embeddings
        )
        vector_store.save_local(db_path)

    except Exception as e : 
        raise e 
        
