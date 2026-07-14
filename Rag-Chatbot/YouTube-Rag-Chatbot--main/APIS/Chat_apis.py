## imports

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from Pipeline.Ingestion_Pipeline import ingestion_pipeline
from Pipeline.chains import BuildChain
from Pipeline.fixed_dataset import get_fixed_chain
from Indexing.loader import generate_doc_id, BASE_DIR
from Database.database import SessionLocal
from Database.model import Conversation
from Schema.schema import generation, FixedQuestion
from pathlib import Path
import shutil
import uuid


## important functions
chat_router = APIRouter()

## folder where uploaded .txt datasets are stored on disk
UPLOAD_DIR = BASE_DIR / "uploaded_datasets"
UPLOAD_DIR.mkdir(exist_ok=True)


## home api to show the chat APIs are live
@chat_router.get("/chat_home")
async def chat_home():
    return {"message": "Chat API's are live.."}


## post method to receive a .txt dataset file and create a vector store for it
@chat_router.post("/ingestion")
async def ingestion_api(user_id: str = Form(...), file: UploadFile = File(...)):
    db = SessionLocal()

    if not file.filename.lower().endswith(".txt"):
        return JSONResponse(status_code=400, content={"status": False, "message": "Only .txt files are supported."})

    try:
        doc_id = generate_doc_id(file.filename)   # unique id for this dataset / vector store
        saved_path = UPLOAD_DIR / f"{doc_id}.txt"

        # persist the uploaded file to disk so the ingestion pipeline can read it
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        await ingestion_pipeline(str(saved_path), doc_id)

        conversation_id = str(uuid.uuid4())
        conversation_data = Conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            document_id=doc_id,
        )

        db.add(conversation_data)
        db.commit()

        return {
            "status": True,
            "message": "Dataset Loaded Successfully",
            "conversation_id": conversation_id,
            "filename": file.filename,
        }

    except Exception as e:
        db.rollback()
        print("ingestion error:", e)
        return JSONResponse(status_code=500, content={"status": False, "message": "Unable to process this file right now."})

    finally:
        db.close()


## chatbot API for the FIXED dataset (data/sample_document.txt)
## no file upload, no conversation_id -> just ask a question
@chat_router.post("/bot/fixed")
async def fixed_chatbot_api(quiry: FixedQuestion):
    try:
        chain = get_fixed_chain()
        response = chain.invoke(quiry.question)
        return {"status": True, "BOT": response}

    except Exception as e:
        print("fixed bot error:", e)
        return JSONResponse(status_code=500, content={"status": False, "message": "Unable to generate a response right now."})


## chatbot API
@chat_router.post("/bot")
async def chatbot_api(quiry: generation):
    db = SessionLocal()

    try:
        conversation = db.query(Conversation).filter(Conversation.conversation_id == quiry.conversation_id).first()
        if not conversation:
            return JSONResponse(status_code=404, content={"status": False, "message": "Conversation not found. Please upload a dataset first."})

        chain = BuildChain(conversation.document_id)
        response = chain.invoke(quiry.question)

        return {"status": True, "BOT": response}

    except Exception as e:
        print("bot error:", e)
        return JSONResponse(status_code=500, content={"status": False, "message": "Unable to generate a response right now."})

    finally:
        db.close()
