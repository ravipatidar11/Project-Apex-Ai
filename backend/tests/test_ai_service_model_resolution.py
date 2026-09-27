from app.ai_service import AIService
from app.schemas import MessageCreate


def test_model_names_are_normalized_to_supported_gemini_models():
    service = AIService()

    assert service._normalize_model_name("gemini-3.6-flash") == "gemini-3.6-flash"
    assert service._normalize_model_name("gemini-2.5-flash") == "gemini-3.6-flash"
    assert service._normalize_model_name("models/gemini-3.6-flash") == "gemini-3.6-flash"
    assert service._normalize_model_name("publishers/google/models/gemini-3.1-pro-preview") == "gemini-3.6-flash"
    assert service._normalize_model_name("gemini-2.0-flash") == "gemini-3.6-flash"


def test_gemini_request_enables_search_and_sandboxed_code_execution():
    service = AIService()

    payload = service._build_payload([], "Prefers concise answers")

    assert payload["tools"] == [{"google_search": {}}, {"code_execution": {}}]
    assert "Prefers concise answers" in payload["systemInstruction"]["parts"][0]["text"]


def test_multimodal_history_is_converted_to_inline_data_parts():
    service = AIService()

    contents = service._format_contents([{
        "role": "user",
        "content": "Describe this image",
        "attachments": [{"mime_type": "image/png", "data": "aW1hZ2U="}],
    }])

    assert contents[0]["parts"][1] == {
        "inline_data": {"mime_type": "image/png", "data": "aW1hZ2U="}
    }


def test_search_grounding_sources_are_appended_as_markdown_links():
    service = AIService()

    response = service._append_sources("Latest update", {
        "candidates": [{
            "groundingMetadata": {
                "groundingChunks": [{"web": {"title": "Example", "uri": "https://example.com"}}]
            }
        }]
    })

    assert "[Example](https://example.com)" in response


def test_message_can_contain_only_a_supported_attachment():
    message = MessageCreate(attachments=[{
        "filename": "note.txt",
        "mime_type": "text/plain",
        "data": "aGVsbG8=",
    }])

    assert message.content == ""
    assert message.attachments[0].filename == "note.txt"
