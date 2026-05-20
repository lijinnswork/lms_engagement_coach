import google.generativeai as genai
from app.config import settings

class GeminiClient:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-2.5-flash")
        else:
            self.model = None

    def generate_coach_message(self, prompt: str) -> str:
        if not self.model:
            return "DEVELOPMENT MODE: I would respond here, but Gemini API is not configured."
            
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "I run into a small issue forming a thought right now. Let's try again in a moment."

gemini_client = GeminiClient()
