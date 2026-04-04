"""add banner_url to universities

Revision ID: 20260404_02
Revises: 20260403_01
Create Date: 2026-04-04
"""
import sqlalchemy as sa
from alembic import op

revision = "20260404_02"
down_revision = "20260403_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "universities",
        sa.Column("banner_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("universities", "banner_url")
