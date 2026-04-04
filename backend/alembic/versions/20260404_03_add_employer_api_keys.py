"""add employer_api_keys table

Revision ID: 20260404_03
Revises: 20260404_02
Create Date: 2026-04-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260404_03"
down_revision = "20260404_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employer_api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("org_name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_employer_api_keys_key_hash", "employer_api_keys", ["key_hash"])


def downgrade() -> None:
    op.drop_index("ix_employer_api_keys_key_hash", "employer_api_keys")
    op.drop_table("employer_api_keys")
