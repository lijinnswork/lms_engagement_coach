import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from .base_watcher import WatcherResult
from app.db.models import User, CoachMessage, Goal, CoachConversation
from app.db.models.coach_studio import CoachPromptVersion, CoachConfig, PredefinedResponse

DEFAULT_SYSTEM_PROMPT = """
You are the user's supportive learning coach. You are warm,
casual, and empathetic — like a thoughtful friend who is good
at helping people stay connected to their learning goals.

YOU MUST:
- Use the student's first name
- Keep responses SHORT: 2-4 sentences, rarely more
- Be specific: reference actual data from their learning
- Offer and suggest, never command or demand
- Respect the student's agency
- Be curious about them, not just their numbers

YOU MUST NOT:
- Explain course content or teach concepts
- Give medical or mental health advice
- Shame, guilt, or create urgency
- Use generic praise without specifics
- Use excessive exclamation marks
- Send messages longer than 4 sentences

IF the observation involves potential crisis:
- Acknowledge warmly
- Suggest professional support and crisis resources
- Do NOT try to counsel
"""

class MessageBuilder:
    def __init__(self, gemini_client):
        self.gemini = gemini_client

    async def _get_active_prompt(self, db: Session):
        version = db.query(CoachPromptVersion).filter(
            CoachPromptVersion.is_active == True,
            CoachPromptVersion.is_draft == False
        ).first()
        if version:
            return version.prompt_text
        return DEFAULT_SYSTEM_PROMPT

    def _get_config_val(self, db: Session, key: str, default: any = None):
        conf = db.query(CoachConfig).filter(CoachConfig.config_key == key).first()
        if conf:
            try:
                return json.loads(conf.config_value)
            except json.JSONDecodeError:
                return conf.config_value
        return default

    async def build(self, user_id: str, chosen_result: WatcherResult, db: Session) -> str:
        # Check Predefined Responses
        # Note: For proactive watcher messages, the "trigger" might be based on the observation. 
        # But per the instructions, we check predefined responses. Since watcher messages don't have a "User Message", 
        # we check the reasoning/suggested action if we really needed to, but the instructions implied predefined 
        # responses are mostly for chat. We'll still check if any apply just in case the observation matches a keyword.
        msg_to_check = (chosen_result.reasoning + " " + chosen_result.suggested_action).lower()
        
        responses = db.query(PredefinedResponse).filter(PredefinedResponse.is_enabled == True).order_by(PredefinedResponse.display_order).all()
        matched_response = None
        preferred_contexts = []
        
        for r in responses:
            matched = False
            if r.match_mode == "any":
                matched = any(kw.lower() in msg_to_check for kw in r.trigger_keywords)
            elif r.match_mode == "all":
                matched = all(kw.lower() in msg_to_check for kw in r.trigger_keywords)
            elif r.match_mode == "exact":
                matched = msg_to_check.strip() in [kw.lower() for kw in r.trigger_keywords]
                
            if matched:
                if r.priority == "strict":
                    matched_response = r.response_text
                    break
                else:
                    preferred_contexts.append(r.response_text)
                    
        if matched_response:
            return matched_response

        # Build dynamic prompt
        system_prompt = await self._get_active_prompt(db)
        context = await self._gather_context(user_id, db)
        
        # Apply behavior settings
        max_sentences = self._get_config_val(db, "behavior.max_sentences", 4)
        use_first_name = self._get_config_val(db, "behavior.use_first_name", True)
        
        if not use_first_name:
            context['first_name'] = "Student"
            
        prompt = self._build_prompt(context, chosen_result, max_sentences)

        if preferred_contexts:
            prompt += f"\n\nPREFERRED RESPONSE GUIDANCE:\n{preferred_contexts[0]}"

        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        raw_response = self.gemini.generate_coach_message(full_prompt)
        
        from .message_validator import MessageValidator
        validator = MessageValidator()
        validation = validator.validate(raw_response, chosen_result.agent_name)
        
        if validation["valid"]:
            return validation["message"]
        return validation.get("fallback", "I noticed something interesting about your learning this week. Want to chat about it?")

    async def _gather_context(self, user_id, db) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        
        # Respect Data Source settings
        # Respect Data Source settings
        use_goals = self._get_config_val(db, "data.goals.enabled", True)
        use_history = self._get_config_val(db, "data.history.enabled", True)
        context_window = self._get_config_val(db, "data.context_window", 5)
        

        if use_goals:
            goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "active").all()
        else:
            goals = []
            
        courses = [{"name": "Mock Course", "progress": 50}]
        
        if use_history:
            recent_msgs = db.query(CoachMessage).join(CoachConversation).filter(
                CoachConversation.user_id == user_id
            ).order_by(desc(CoachMessage.created_at)).limit(context_window).all()
        else:
            recent_msgs = []

        first_name = "there"
        if user and hasattr(user, "full_name") and getattr(user, "full_name"):
            first_name = user.full_name.split()[0]
        elif user and hasattr(user, "email") and getattr(user, "email"):
            first_name = user.email.split("@")[0]

        faqs = self._get_config_val(db, "knowledge.faqs", [])
        active_faqs = [faq for faq in faqs if faq.get("is_active", True)]
        kb_text = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in active_faqs]) if active_faqs else "None"

        return {
            "first_name": first_name,
            "time_of_day": self._get_time_of_day(),
            "active_goals": ", ".join([g.title for g in goals]) if goals else "None",
            "courses": json.dumps(courses),
            "recent_messages": "\n".join([f"{m.sender.value}: {m.content}" for m in reversed(recent_msgs)]),
            "knowledge_base": kb_text
        }

    def _build_prompt(self, context, result: WatcherResult, max_sentences: int) -> str:
        return f"""
Student: {context['first_name']}
Time of day: {context['time_of_day']}

Active goals: {context['active_goals']}
Courses and progress: {context['courses']}
Last coach messages: {context['recent_messages']}

KNOWLEDGE BASE / FAQs (Use this info to answer questions or provide guidance):
{context['knowledge_base']}

---

OBSERVATION from {result.agent_name}:
{result.reasoning}

Suggested action: {result.suggested_action}
Additional context: {json.dumps(result.context_for_message)}

---

Write a proactive message from the coach to {context['first_name']}.
Be warm, specific, and brief (maximum {max_sentences} sentences).
Reference the specific observation above — do not be generic.
"""

    def _get_time_of_day(self) -> str:
        hour = datetime.now().hour
        if hour < 12: return "morning"
        elif hour < 17: return "afternoon"
        elif hour < 21: return "evening"
        else: return "night"
