## local imports
from Pipeline.Retrievel import load_retriver, format_doc
from Models.models import chat_model
from Prompts.prompt_file import prompt
from vector_store.VectorStore import load_store
from Indexing.loader import build_path

## imports
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser


## build chain function takes the doc_id of an ingested .txt dataset and returns a chain
def BuildChain(doc_id: str):

    if not doc_id:
        raise ValueError("Invalid document id")

    # building path to get the vector db collection associated with this doc_id
    path = build_path(doc_id)

    # store
    store = load_store(path)

    # parser
    parser = StrOutputParser()

    ## retriver
    Retriver = load_retriver(k=3, store=store)

    ## Retriver chain
    retriver_chain = Retriver | RunnableLambda(format_doc)

    ## augmentation chain
    augmentation_chain = RunnableParallel({
        'context': retriver_chain,
        'question': RunnablePassthrough(),
    })

    ## Generation Chain
    chain = augmentation_chain | prompt | chat_model | parser

    return chain


if __name__ == "__main__":
    ## doc_id for input demo test (returned by the ingestion pipeline)
    doc_id = "sample_dataset"
    chain = BuildChain(doc_id)
    quiry = "what is the topic of this document "
    print(chain.invoke(quiry))
