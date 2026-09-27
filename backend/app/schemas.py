import base64
import binascii
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class AttachmentInput(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    data: str = Field(..., min_length=1, max_length=21_000_000)

    @field_validator("mime_type")
    @classmethod
    def allow_supported_media(cls, value: str) -> str:
        supported_types = {
            "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf",
            "text/plain", "text/markdown", "text/csv", "audio/mpeg", "audio/mp4",
            "audio/wav", "audio/ogg", "audio/webm",
        }
        if value not in supported_types:
            raise ValueError("Unsupported attachment type")
        return value

    @field_validator("data")
    @classmethod
    def validate_base64(cls, value: str) -> str:
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as error:
            raise ValueError("Attachment data must be valid base64") from error
        if len(decoded) > 15 * 1024 * 1024:
            raise ValueError("Each attachment must be 15 MB or smaller")
        return value


class AttachmentInfo(BaseModel):
    filename: str
    mime_type: str


# Message Schemas
class MessageBase(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Content of the message")
    attachments: List[AttachmentInfo] = Field(default_factory=list)

class MessageCreate(BaseModel):
    content: str = Field(default="", max_length=20_000, description="User prompt message")
    model: Optional[str] = Field(default="gemini-3.6-flash", description="Optional AI model selection")
    attachments: List[AttachmentInput] = Field(default_factory=list, max_length=5)
    memory: Optional[str] = Field(default=None, max_length=2_000)

    @model_validator(mode="after")
    def require_content_or_attachment(self):
        if not self.content.strip() and not self.attachments:
            raise ValueError("A message needs text or at least one attachment")
        encoded_size = sum(len(item.data) * 3 // 4 for item in self.attachments)
        if encoded_size > 15 * 1024 * 1024:
            raise ValueError("Combined attachments must be 15 MB or smaller")
        return self

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
