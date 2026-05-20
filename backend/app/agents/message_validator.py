class MessageValidator:
    def validate(self, message: str, trigger_agent: str) -> dict:
        if not message or not message.strip():
            return { "valid": False, "reason": "Empty message", "fallback": None }

        if len(message) > 500:
            truncated = self._truncate_at_sentence(message, 500)
            return { "valid": True, "message": truncated }

        if "http://" in message or "https://" in message:
            return { "valid": False, "reason": "Contains URLs", "fallback": "I placed a link to an external resource but realized it's better to discuss directly. How are you doing?" }

        if "```" in message or "def " in message or "class " in message:
            return { "valid": False, "reason": "Contains code",
                     "fallback": "I noticed something interesting about your learning this week. Want to chat?" }

        return { "valid": True, "message": message.strip() }

    def _truncate_at_sentence(self, text: str, max_len: int) -> str:
        truncated = text[:max_len]
        last_period = truncated.rfind('.')
        if last_period > 0:
            return truncated[:last_period + 1]
        return truncated
