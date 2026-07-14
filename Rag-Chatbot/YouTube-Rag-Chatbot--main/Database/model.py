from Database.database import Base

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from datetime import datetime


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)


class Dataset(Base):

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    document_id = Column(String, index=True)

    filename = Column(String)

    vector_path = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)

    conversation_id = Column(String, unique=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    document_id = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)