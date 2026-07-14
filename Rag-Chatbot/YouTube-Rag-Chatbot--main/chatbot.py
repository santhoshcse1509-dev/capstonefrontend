from Pipeline.chains import BuildChain
from langchain.messages import SystemMessage, HumanMessage, AIMessage
from Pipeline.Ingestion_Pipeline import ingestion_pipeline
from Indexing.loader import generate_doc_id
import asyncio

memory = [SystemMessage("you are a helpfull chatbot.")]

# build chain function takes a doc_id as input

def ChatBot(doc_id):
    chain = BuildChain(doc_id)
    while True:
        User_input = input("Ask : ")
        if User_input == "exit":
            break
        response = chain.invoke(User_input)
        memory.append(HumanMessage(User_input))
        memory.append(AIMessage(response))

        print("AI :", response)


if __name__ == "__main__":
    file_path = input("Enter the path to your .txt dataset file : ")
    doc_id = generate_doc_id(file_path)
    print(" file --> Chunking ---> vector store ")
    asyncio.run(ingestion_pipeline(file_path, doc_id))
    print("Injestion is Done ! ")
    print("-" * 20)
    print("Start Communication ")
    ChatBot(doc_id)
