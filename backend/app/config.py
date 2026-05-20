from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Learner Engagement App"
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    OPENEDX_BASE_URL: str = ""
    OPENEDX_CLIENT_ID: str = ""
    OPENEDX_CLIENT_SECRET: str = ""
    OPENEDX_API_VERSION: str = "v1"

    LMS_URL: str = "https://iimbx.site"
    LMS_ADMIN_EMAIL: str = "admin@iimbx.iimb.ac.in"
    LMS_ADMIN_PASSWORD: str = "Drc@1234"

    GEMINI_API_KEY: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
