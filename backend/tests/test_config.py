from sqlalchemy.engine import make_url

from app.config import Settings


def test_postgres_sslmode_is_normalized_for_asyncpg():
    database_url = Settings.async_database_driver(
        'postgresql://user:secret@db.example.test/kora?sslmode=require&application_name=kora'
    )

    parsed = make_url(database_url)
    assert parsed.drivername == 'postgresql+asyncpg'
    assert parsed.query == {'ssl': 'require', 'application_name': 'kora'}


def test_explicit_asyncpg_ssl_option_takes_precedence():
    database_url = Settings.async_database_driver(
        'postgresql://user:secret@db.example.test/kora?ssl=verify-full&sslmode=require'
    )

    parsed = make_url(database_url)
    assert parsed.query == {'ssl': 'verify-full'}


def test_sqlite_database_url_is_unchanged():
    database_url = 'sqlite+aiosqlite:///./kora.db'

    assert Settings.async_database_driver(database_url) == database_url
