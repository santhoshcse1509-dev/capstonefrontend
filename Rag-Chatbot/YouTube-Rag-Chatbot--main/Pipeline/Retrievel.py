from vector_store.VectorStore import load_store 





## function to merget all top k context data 
def format_doc(retrieved_doc) : 
    context_text = "\n\n".join(doc.page_content for doc in retrieved_doc)
    return context_text 


## takes the vector store as input with k 
def load_retriver(k : int , store ) : 
    Retriver = store.as_retriever( 
            search_type = "similarity" ,
            search_kwargs = {"k" : k } ) 

    return Retriver 
