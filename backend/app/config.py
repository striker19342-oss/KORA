from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

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
        value = value.replace('postgresql://', 'postgresql+asyncpg://', 1).replace('postgres://', 'postgresql+asyncpg://', 1)
        url = make_url(value)
        query = dict(url.query)
        sslmode = query.pop('sslmode', None)
        if sslmode is not None:
            query.setdefault('ssl', sslmode)
            url = url.set(query=query)
        return url.render_as_string(hide_password=False)

    @property
    def allowed_origins(self) -> list[str]: return [origin.strip().rstrip('/') for origin in self.cors_origins.split(',') if origin.strip()]
@lru_cache
def settings() -> Settings: return Settings()
