import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.ai_service import ai_service

router = APIRouter(prefix="/chats", tags=["Chats"])

@router.get("", response_model=List[schemas.ChatResponse])
def read_chats(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all chat conversations sorted by recent activity."""
    chats = crud.get_chats(db, skip=skip, limit=limit)
    response = []
    for chat in chats:
        response.append(schemas.ChatResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            messages_count=len(chat.messages)
        ))
    return response

@router.post("", response_model=schemas.ChatResponse, status_code=status.HTTP_201_CREATED)
def create_new_chat(payload: schemas.ChatCreate = None, db: Session = Depends(get_db)):
    """Create a new empty chat thread."""
    title = payload.title if payload and payload.title else "New Chat"
    chat = crud.create_chat(db, title=title)
    return schemas.ChatResponse(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages_count=0
    )

@router.delete("", status_code=status.HTTP_200_OK)
def clear_all_chats(db: Session = Depends(get_db)):
    """Clear all chat conversations from database."""
    chats = crud.get_chats(db, limit=1000)
    for chat in chats:
        crud.delete_chat(db, chat.id)
    return {"message": "All chat history cleared successfully"}

@router.get("/{chat_id}", response_model=schemas.ChatDetailResponse)
def read_chat_detail(chat_id: str, db: Session = Depends(get_db)):
    """Retrieve chat details with full message history."""
    chat = crud.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return schemas.ChatDetailResponse(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages_count=len(chat.messages),
        messages=[schemas.MessageResponse.model_validate(m) for m in chat.messages]
    )

@router.delete("/{chat_id}", status_code=status.HTTP_200_OK)
def delete_existing_chat(chat_id: str, db: Session = Depends(get_db)):
    """Delete a chat conversation and all associated messages."""
    success = crud.delete_chat(db, chat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat thread not found")
    return {"message": f"Chat {chat_id} deleted successfully"}

@router.post("/{chat_id}/messages", response_model=schemas.MessageResponse)
async def post_message_and_get_ai_response(
    chat_id: str,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """Send user message & get complete AI response."""
    chat = crud.get_chat(db, chat_id)
    if not chat:
        chat = crud.create_chat(db, title="New Chat")
        chat_id = chat.id

    # 1. Save user message
    crud.add_message(db, chat_id=chat_id, role="user", content=payload.content)

    # 2. Get past history
    past_messages = crud.get_messages(db, chat_id)
    history_formatted = [{"role": m.role, "content": m.content} for m in past_messages]

    # 3. Call AI Service
    ai_response_text = await ai_service.generate_response(
        conversation_history=history_formatted,
        model_name=payload.model
    )

    # 4. Save AI message
    assistant_msg = crud.add_message(
        db,
        chat_id=chat_id,
        role="assistant",
        content=ai_response_text
    )

    return schemas.MessageResponse.model_validate(assistant_msg)

@router.post("/{chat_id}/messages/stream")
async def stream_ai_response(
    chat_id: str,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """Stream AI response tokens in real-time using Server-Sent Events (SSE)."""
    chat = crud.get_chat(db, chat_id)
    if not chat:
        chat = crud.create_chat(db, title="New Chat")
        chat_id = chat.id

    # Save user message
    crud.add_message(db, chat_id=chat_id, role="user", content=payload.content)

    past_messages = crud.get_messages(db, chat_id)
    history_formatted = [{"role": m.role, "content": m.content} for m in past_messages]

    async def event_generator():
        full_text = ""
        async for chunk in ai_service.generate_response_stream(history_formatted, payload.model):
            full_text += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        # Save assistant message on stream complete
        crud.add_message(db, chat_id=chat_id, role="assistant", content=full_text)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
