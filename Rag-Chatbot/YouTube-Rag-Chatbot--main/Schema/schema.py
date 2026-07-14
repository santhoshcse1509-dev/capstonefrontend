from pydantic import BaseModel  , Field 



## user data 
class User_data(BaseModel) : 
    name  : str = Field(... , description = "Enter the name or user name ")
    email : str = Field(... , description = "Enter the email id of user ")
    password : str = Field(... , description = "Enter the password ") 

# login data 
class LoginData (BaseModel) : 
    email   : str = Field(... , description = "Enter the email id ")
    password : str = Field(... , description = "Enter the email id ")

## question schema for the FIXED dataset chatbot (no conversation_id / upload needed)
class FixedQuestion(BaseModel):
    question: str = Field(..., description="Ask a question about the fixed document")


## generation pipeline 
class generation(BaseModel) : 
    conversation_id :str = Field(... , description = "this id is stored in the frontend after user uploads the .txt dataset (response from the ingestion pipeline) ") 
    question : str = Field(... , description = "Ask Question related to the provided document ")