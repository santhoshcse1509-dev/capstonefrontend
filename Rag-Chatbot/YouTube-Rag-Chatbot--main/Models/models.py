from langchain_huggingface import HuggingFaceEmbeddings , HuggingFaceEndpoint , ChatHuggingFace 
import os 
from dotenv import load_dotenv 

## tokens 
load_dotenv() 
hf_tokens = os.getenv("HF_TOKEN") 

# embedding models from huggingface 
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

# chat models 
## using meta llm Llama-3.1.-8b parametersss == 8b 

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    task="text-generation",
    max_new_tokens=512,
    temperature=0.3,
    provider="auto",
)

chat_model = ChatHuggingFace(llm=llm)



if __name__ == "__main__" : 
    
    from langchain_core.output_parsers import StrOutputParser 
    print("Chat bot")
    parser = StrOutputParser( )
    chain = chat_model | parser 
    memo = [ ]
    while True  : 
        user = input('you : ')
        if user == "exit" : 
            break 
        memo.append(user)
        response = chain.invoke(memo) 
        print(response)

        
        