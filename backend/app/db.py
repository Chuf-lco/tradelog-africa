import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic_settings import BaseSettings
from typing import Generator


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENV: str = "development"
    GROQ_API_KEY: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), "../../.env"),
        "extra": "ignore"
    }


settings = Settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.ENV == "development",
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()