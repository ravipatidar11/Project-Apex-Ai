import os
import logging
from typing import List, AsyncGenerator
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.default_model = self._normalize_model_name(settings.GEMINI_MODEL)

    def _normalize_model_name(self, model_name: str | None) -> str:
        default_model = "gemini-3.6-flash"
        if not model_name:
            return default_model

        cleaned = str(model_name).strip()
        if not cleaned:
            return default_model

        for prefix in ("publishers/google/models/", "models/", "google/"):
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
                break

        cleaned = cleaned.strip("/?& ")

        if cleaned.startswith("gemini-"):
            supported = {"gemini-3.6-flash", "gemini-3.6-flash-lite", "gemini-3.6-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"}
            if cleaned in supported:
                if cleaned.startswith("gemini-2.5"):
                    return "gemini-3.6-flash"
                return cleaned
            if cleaned.startswith("gemini-2.0") or cleaned.startswith("gemini-2.5") or cleaned.startswith("gemini-3."):
                return "gemini-3.6-flash"
            return default_model

        return default_model

    def _get_api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    async def generate_response(self, conversation_history: List[dict], model_name: str = None) -> str:
        """Generates a complete response from Google Gemini AI API."""
        api_key = self._get_api_key()
        selected_model = self._normalize_model_name(model_name or self.default_model)

        if not api_key or api_key == "your_gemini_api_key_here":
            return (
                "⚠️ **API Key Missing**: `GEMINI_API_KEY` is not set on the server.\n\n"
                "To enable live AI responses:\n"
                "1. Get a free API Key from [Google AI Studio](https://aistudio.google.com/).\n"
                "2. Add `GEMINI_API_KEY=your_key` to your backend `.env` file.\n"
                "3. Restart the backend server."
            )

        # 1. SDK call
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            contents = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})

            response = client.models.generate_content(
                model=selected_model,
                contents=contents,
            )
            if response and response.text:
                return response.text
        except Exception as sdk_err:
            logger.warning(f"Google GenAI SDK call failed: {sdk_err}. Using direct REST endpoint...")

        # 2. Direct HTTP REST fallback
        try:
            gemini_model_id = selected_model if selected_model.startswith("gemini-") else "gemini-2.0-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model_id}:generateContent?key={api_key}"
            
            contents = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                }
            }

            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                
                error_data = res.json() if res.headers.get("content-type") == "application/json" else res.text
                logger.error(f"Gemini API REST error ({res.status_code}): {error_data}")
                return f"❌ **AI Service Error ({res.status_code})**: Failed to retrieve response from Gemini API."

        except Exception as e:
            logger.exception("Failed to communicate with AI Service")
            return f"❌ **Connection Error**: Could not connect to AI service provider: {str(e)}"

    async def generate_response_stream(self, conversation_history: List[dict], model_name: str = None) -> AsyncGenerator[str, None]:
        """Streams real-time tokens from Google Gemini API."""
        api_key = self._get_api_key()
        selected_model = self._normalize_model_name(model_name or self.default_model)

        if not api_key or api_key == "your_gemini_api_key_here":
            yield (
                "⚠️ **API Key Missing**: `GEMINI_API_KEY` is not configured on the server.\n\n"
                "Please add a free key from [Google AI Studio](https://aistudio.google.com/) to `.env`."
            )
            return

        gemini_model_id = selected_model if selected_model.startswith("gemini-") else "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model_id}:streamGenerateContent?alt=sse&key={api_key}"

        contents = []
        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        logger.warning(
                            "Gemini streaming request failed with %s; falling back to non-streaming response.",
                            response.status_code,
                        )
                        fallback_response = await self.generate_response(
                            conversation_history=conversation_history,
                            model_name=selected_model,
                        )
                        yield fallback_response
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                import json
                                parsed = json.loads(data_str)
                                candidates = parsed.get("candidates", [])
                                if candidates and "content" in candidates[0]:
                                    parts = candidates[0]["content"].get("parts", [])
                                    for part in parts:
                                        if "text" in part:
                                            yield part["text"]
                            except Exception:
                                continue
        except Exception as e:
            logger.exception("Error in AI stream generation")
            fallback_response = await self.generate_response(
                conversation_history=conversation_history,
                model_name=selected_model,
            )
            yield fallback_response

ai_service = AIService()
