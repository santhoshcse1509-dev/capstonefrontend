# This is the Auth apis consiste apis to create accound , login details from frontend to db 

from fastapi import APIRouter  
from Database.model import User 
from Database.database import SessionLocal 
from Schema.schema import User_data  , LoginData

auth_router = APIRouter() 
db = SessionLocal() 

@auth_router.get("/Auth_home" ) 
def home_router() : 
    return {"message" : "this is the router api testing route feature of fast api "}


# ----------------------- Create Accound API ----------------------------------- 
@auth_router.post("/create_account" , status_code = 201 ) 
async def create_account( user_data : User_data  ) :        # no need to use the async but if the datbase became big may bee needed 
        
        ## checking existnig email 
        existing_email = db.query(User).filter( 
            User.email == user_data.email 
        ).first() 

        # checking if email not exist then create 
        print(existing_email)
        if existing_email == None  : 
            user = User( 
                name = user_data.name , 
                email = user_data.email , 
                password = user_data.password 
            )
            db.add(user) 
            db.commit() 
            db.close() 
        
            return {"message" : "accout created"  }
        return {'message' : "user email already exist !" } 



# ------------------------------------- Login API ------------------------------------------- 
@auth_router.post("/login" , status_code = 201 )
async def user_login(login_data : LoginData) : 
    # search for the user by using email 
    user =  db.query(User).filter(
            User.email == login_data.email 
                ).first() 

    # if user exist it return something 
    if user  != None :    # if user details exist then move forward 
        if user.password == login_data.password and user.email == login_data.email    : 
            return { 
                "status" : True , 
                "user_id": user.id , 
                "message" : "Login Successful"
            }
            
    return {
        "status" : False , 
        "message" : "Invalid email or password"
        }