"""add share_recipient to diplomas

Revision ID: a1f3c2d4e5b6
Revises: 52eb710cb897
Create Date: 2026-04-05 12:00:00.000000

Adds a nullable share_recipient column to diplomas.
Stores an optional human-readable label the student enters when creating
a share link ("для кого?"), e.g. "Сбербанк HR" or "Яндекс".
Displayed on the public verification page and in the student activity feed.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1f3c2d4e5b6"
down_revision: Union[str, Sequence[str], None] = "52eb710cb897"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "diplomas",
        sa.Column("share_recipient", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("diplomas", "share_recipient")
