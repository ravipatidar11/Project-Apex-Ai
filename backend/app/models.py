import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan", order_by="Message.timestamp")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    chat = relationship("Chat", back_populates="messages")
