from Database.database import Base , engine 
import Database.model 

Base.metadata.create_all(bind=engine)

print("Database created successfully!")