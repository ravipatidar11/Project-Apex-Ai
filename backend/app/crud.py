from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app import models, schemas

def get_chats(db: Session, skip: int = 0, limit: int = 100) -> List[models.Chat]:
    return (
        db.query(models.Chat)
        .order_by(models.Chat.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_chat(db: Session, title: str = "New Chat") -> models.Chat:
    db_chat = models.Chat(title=title)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

def get_chat(db: Session, chat_id: str) -> Optional[models.Chat]:
    return db.query(models.Chat).filter(models.Chat.id == chat_id).first()

def delete_chat(db: Session, chat_id: str) -> bool:
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not db_chat:
        return False
    db.delete(db_chat)
    db.commit()
    return True

def add_message(db: Session, chat_id: str, role: str, content: str) -> models.Message:
    db_message = models.Message(
        chat_id=chat_id,
        role=role,
        content=content,
        timestamp=datetime.utcnow()
    )
    db.add(db_message)
    
    # Touch updated_at for parent chat
    db_chat = get_chat(db, chat_id)
    if db_chat:
        db_chat.updated_at = datetime.utcnow()
        # Automatically update title if it's the first user message
        if role == "user" and db_chat.title == "New Chat":
            clean_title = content.strip().split("\n")[0][:45]
            if clean_title:
                db_chat.title = clean_title
                
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(db: Session, chat_id: str) -> List[models.Message]:
    return (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )
