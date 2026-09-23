from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# Message Schemas
class MessageBase(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Content of the message")

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, description="User prompt message")
    model: Optional[str] = Field(default="gemini-3.6-flash", description="Optional AI model selection")

class MessageResponse(MessageBase):
    id: int
    chat_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatCreate(BaseModel):
    title: Optional[str] = Field(default="New Chat", description="Title of the chat thread")

class ChatUpdate(BaseModel):
    title: str

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ChatDetailResponse(ChatResponse):
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True
