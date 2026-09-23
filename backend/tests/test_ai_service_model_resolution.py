from app.ai_service import AIService


def test_model_names_are_normalized_to_supported_gemini_models():
    service = AIService()

    assert service._normalize_model_name("gemini-3.6-flash") == "gemini-2.5-flash"
    assert service._normalize_model_name("gemini-2.5-flash") == "gemini-2.5-flash"
    assert service._normalize_model_name("models/gemini-3.6-flash") == "gemini-2.5-flash"
    assert service._normalize_model_name("publishers/google/models/gemini-3.1-pro-preview") == "gemini-2.5-flash"
