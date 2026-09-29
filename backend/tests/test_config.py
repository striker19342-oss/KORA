from sqlalchemy.engine import make_url

from app.config import Settings


def test_libpq_ssl_and_channel_binding_options_are_preserved():
    database_url = Settings.async_database_driver(
        'postgresql://user:secret@db.example.test/kora?sslmode=require&channel_binding=require'
    )

    parsed = make_url(database_url)
    assert parsed.drivername == 'postgresql+psycopg'
    assert parsed.query == {'sslmode': 'require', 'channel_binding': 'require'}


def test_existing_asyncpg_url_is_migrated_to_psycopg():
    database_url = Settings.async_database_driver(
        'postgresql+asyncpg://user:secret@db.example.test/kora?sslmode=require'
    )

    parsed = make_url(database_url)
    assert parsed.drivername == 'postgresql+psycopg'
    assert parsed.query == {'sslmode': 'require'}


def test_sqlite_database_url_is_unchanged():
    database_url = 'sqlite+aiosqlite:///./kora.db'

    assert Settings.async_database_driver(database_url) == database_url
