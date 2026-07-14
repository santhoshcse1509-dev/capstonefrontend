from langchain_text_splitters import RecursiveCharacterTextSplitter
## splitter

def get_chunks(document):
    try:
        # splitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        ## creating the chunk by passing the document in list
        chunks = splitter.create_documents([document])

        return chunks

    except Exception as e:
        raise e


if __name__ == "__main__":
    docs = """ You could be a bride in white.
        - Like Queen Victoria.How could you look like Queen Victoria?You'll look like... Malika Dilfareb!Sweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedSweet, Miss Kiss! I applied maskaraLet's keep our love aliveI will never changeThat's for sure!Sweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedSweet, Miss Kiss! I applied maskaraLet's keep our love aliveMy love, I say yesI will never leave your sideMy love, I say yesI will never leave your sideSweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedSweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedI keep writing your nameIt's a habit nowBecause I'm madly in love with youMy love, I say yesI will never leave your sideMy love, I say yesI will never leave your side Sweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedSweet, Miss Kiss! I applied maskaraLet's keep our eyes lockedWhere did you learn
        Your delightful ways?You are all grace,
        grace is all youUsing false excuses,
        You shower love on meYou will never learnWhere did you learn
        Your delightful ways?I complain to you,
        Yet I shower prayers tooWhat choice do I have?
        Love has overwhelmed meAll reason has left meAll reason has left me"""
    print(get_chunks(docs))
