from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    database_url: str = 'sqlite+aiosqlite:///./kora.db'
    database_url_unpooled: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = 'gemini-2.5-flash'
    cors_origins: str = 'http://localhost:5173'

    @field_validator('database_url', 'database_url_unpooled', mode='before')
    @classmethod
    def async_database_driver(cls, value: str | None) -> str | None:
        if not value: return value
        return value.replace('postgresql://', 'postgresql+asyncpg://', 1).replace('postgres://', 'postgresql+asyncpg://', 1)

    @property
    def allowed_origins(self) -> list[str]: return [origin.strip().rstrip('/') for origin in self.cors_origins.split(',') if origin.strip()]
@lru_cache
def settings() -> Settings: return Settings()
