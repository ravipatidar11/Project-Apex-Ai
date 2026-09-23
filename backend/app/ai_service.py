import os
import json
import logging
from typing import List, AsyncGenerator
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    DEFAULT_MODEL = "gemini-3.5-flash-lite"
    FALLBACK_MODELS = [
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-3.8-flash",
    ]

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.default_model = self._normalize_model_name(settings.GEMINI_MODEL)

    def _normalize_model_name(self, model_name: str | None) -> str:
        if not model_name:
            return self.DEFAULT_MODEL

        cleaned = str(model_name).strip()
        if not cleaned:
            return self.DEFAULT_MODEL

        for prefix in ("publishers/google/models/", "models/", "google/"):
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
                break

        cleaned = cleaned.strip("/?& ")
        return cleaned or self.DEFAULT_MODEL

    def _get_api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    def _format_contents(self, conversation_history: List[dict]) -> List[dict]:
        contents = []
        for msg in conversation_history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
        return contents

    def _quota_error_message(self, last_model: str) -> str:
        return (
            "⚠️ **Gemini API Quota Exceeded (429)**\n\n"
            f"The free-tier quota for `{last_model}` has been exhausted.\n\n"
            "**How to resolve:**\n"
            "1. Switch to **Gemini 3.5 Flash-Lite** or another model from the dropdown above.\n"
            "2. Or obtain a fresh free API key from [Google AI Studio](https://aistudio.google.com/) and update `GEMINI_API_KEY` in `backend/.env`.\n"
            "3. If using the free tier daily quota (20 requests/day for some models), it will reset automatically."
        )

    async def generate_response(self, conversation_history: List[dict], model_name: str = None) -> str:
        """Generates a complete response from Google Gemini AI API with automatic multi-model fallback."""
        api_key = self._get_api_key()
        requested_model = self._normalize_model_name(model_name or self.default_model)

        if not api_key or api_key == "your_gemini_api_key_here":
            return (
                "⚠️ **API Key Missing**: `GEMINI_API_KEY` is not set on the server.\n\n"
                "To enable live AI responses:\n"
                "1. Get a free API Key from [Google AI Studio](https://aistudio.google.com/).\n"
                "2. Add `GEMINI_API_KEY=your_key` to your backend `.env` file.\n"
                "3. Restart the backend server."
            )

        # 1. Try SDK call first for the requested model
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            contents = self._format_contents(conversation_history)
            response = client.models.generate_content(
                model=requested_model,
                contents=contents,
            )
            if response and response.text:
                return response.text
        except Exception as sdk_err:
            logger.warning("SDK call failed for %s (%s). Proceeding to REST endpoint...", requested_model, sdk_err)

        # 2. REST endpoint with fallback models
        models_to_try = [requested_model]
        for fb in self.FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        contents = self._format_contents(conversation_history)
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }

        last_status = 500
        last_error = ""

        async with httpx.AsyncClient(timeout=30.0) as client:
            for current_model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={api_key}"
                try:
                    res = await client.post(url, json=payload)
                    last_status = res.status_code
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
                    
                    error_data = res.json() if res.headers.get("content-type") == "application/json" else res.text
                    last_error = str(error_data)
                    logger.warning("Model %s failed with status %s: %s", current_model, res.status_code, error_data)
                    
                    # If quota exceeded (429) or high demand (503) or discontinued (404), try next model
                    if res.status_code in (429, 503, 404, 500):
                        continue
                except Exception as req_err:
                    logger.warning("Request to model %s error: %s", current_model, req_err)
                    continue

        if last_status == 429:
            return self._quota_error_message(requested_model)

        return f"❌ **AI Service Error ({last_status})**: Failed to retrieve response from Gemini API. {last_error[:120]}"

    async def generate_response_stream(self, conversation_history: List[dict], model_name: str = None) -> AsyncGenerator[str, None]:
        """Streams real-time tokens from Google Gemini API with seamless multi-model fallback."""
        api_key = self._get_api_key()
        requested_model = self._normalize_model_name(model_name or self.default_model)

        if not api_key or api_key == "your_gemini_api_key_here":
            yield (
                "⚠️ **API Key Missing**: `GEMINI_API_KEY` is not configured on the server.\n\n"
                "Please add a free key from [Google AI Studio](https://aistudio.google.com/) to `.env`."
            )
            return

        models_to_try = [requested_model]
        for fb in self.FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        contents = self._format_contents(conversation_history)
        payload = {
            "contents": contents,
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
        }

        streamed_any = False
        last_status = 500

        async with httpx.AsyncClient(timeout=45.0) as client:
            for current_model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:streamGenerateContent?alt=sse&key={api_key}"
                try:
                    async with client.stream("POST", url, json=payload) as response:
                        last_status = response.status_code
                        if response.status_code != 200:
                            logger.warning(
                                "Model %s stream failed with %s; attempting fallback candidate...",
                                current_model,
                                response.status_code,
                            )
                            continue

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    parsed = json.loads(data_str)
                                    candidates = parsed.get("candidates", [])
                                    if candidates and "content" in candidates[0]:
                                        parts = candidates[0]["content"].get("parts", [])
                                        for part in parts:
                                            if "text" in part:
                                                streamed_any = True
                                                yield part["text"]
                                except Exception:
                                    continue

                        if streamed_any:
                            return
                except Exception as e:
                    logger.warning("Stream error for model %s: %s", current_model, e)
                    continue

        if not streamed_any:
            # If streaming wasn't successful on any candidate, use generate_response
            fallback_response = await self.generate_response(
                conversation_history=conversation_history,
                model_name=requested_model,
            )
            yield fallback_response

ai_service = AIService()
