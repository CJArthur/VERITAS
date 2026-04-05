"""add document_type and issuer_name to diplomas

Revision ID: b2e4f6a8c0d1
Revises: a1f3c2d4e5b6
Create Date: 2026-04-05 13:00:00.000000

Extends the platform from "diploma verifier" to "educational credential verifier".
Now supports:
  - diploma              — high/secondary education (ВУЗ, колледж)
  - certificate          — course completion (Coursera, Skillbox, Яндекс Практикум, etc.)
  - professional_license — professional qualifications (адвокат, врач, аудитор, etc.)

issuer_name stores the human-readable name of the issuing organization when it differs
from a registered university (e.g. "Coursera", "Яндекс Практикум").
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2e4f6a8c0d1"
down_revision: Union[str, Sequence[str], None] = "a1f3c2d4e5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ENUM_NAME = "documenttype"
_ENUM_VALUES = ("diploma", "certificate", "professional_license")


def upgrade() -> None:
    # Create enum type first (PostgreSQL requires explicit enum creation)
    document_type_enum = sa.Enum(*_ENUM_VALUES, name=_ENUM_NAME)
    document_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "diplomas",
        sa.Column(
            "document_type",
            sa.Enum(*_ENUM_VALUES, name=_ENUM_NAME),
            nullable=False,
            server_default="diploma",
        ),
    )
    op.add_column(
        "diplomas",
        sa.Column("issuer_name", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("diplomas", "issuer_name")
    op.drop_column("diplomas", "document_type")
    sa.Enum(name=_ENUM_NAME).drop(op.get_bind(), checkfirst=True)
