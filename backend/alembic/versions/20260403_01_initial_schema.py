"""initial schema via SQLAlchemy metadata

Revision ID: 20260403_01
Revises:
Create Date: 2026-04-03
"""

revision = "20260403_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    from sqlalchemy import create_engine

    from app.db.models import Base
    from app.db.postgres import postgres_url

    engine = create_engine(
        postgres_url(),
        connect_args={"client_encoding": "utf8"},
    )
    Base.metadata.create_all(bind=engine)


def downgrade() -> None:
    pass
