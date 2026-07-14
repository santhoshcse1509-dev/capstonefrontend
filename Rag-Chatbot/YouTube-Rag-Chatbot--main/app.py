from fastapi import FastAPI 
from fastapi.responses import JSONResponse
from APIS.Auth_apis import auth_router 
from APIS.Chat_apis import chat_router 
from fastapi.middleware.cors import CORSMiddleware
from Pipeline.fixed_dataset import init_fixed_dataset



app  = FastAPI()


## on startup: embed data/sample_document.txt (skipped if already embedded)
## and build the cached retrieval chain used by POST /bot/fixed
@app.on_event("startup")
async def startup_event():
    await init_fixed_dataset()


@app.get("/") 
def home() : 
    return JSONResponse("Text Dataset RAG bot API is live ")



origins = [

    "http://127.0.0.1:5500",

    "http://localhost:5500",

    "http://localhost:3000",

    "http://127.0.0.1:3000"

]

app.add_middleware(

    CORSMiddleware,

    allow_origins=origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

# ------------------- including different routess in app  ---------------------------------------------- 

app.include_router(auth_router)
app.include_router(chat_router)