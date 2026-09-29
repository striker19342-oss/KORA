from alembic import context
from backend.app.models import Base
target_metadata = Base.metadata
def run_migrations_offline():
    context.configure(url=context.config.get_main_option('sqlalchemy.url'), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    from sqlalchemy import create_engine
    engine = create_engine(context.config.get_main_option('sqlalchemy.url'))
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()
if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
