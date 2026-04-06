"""nullable qualification and gpa for non-diploma document types

Revision ID: d4e6b8c0f1a2
Revises: c3f5a7b9d2e4
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e6b8c0f1a2'
down_revision = 'c3f5a7b9d2e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new enum values for qualification (certificate / professional_license)
    op.execute("ALTER TYPE qualificationtype ADD VALUE IF NOT EXISTS 'certificate'")
    op.execute("ALTER TYPE qualificationtype ADD VALUE IF NOT EXISTS 'professional_license'")

    # Make qualification nullable (certificates don't have a qualification level)
    op.alter_column('diplomas', 'qualification', nullable=True)

    # Make gpa nullable (certificates don't have a GPA)
    op.alter_column('diplomas', 'gpa',
        existing_type=sa.Numeric(3, 2),
        nullable=True,
    )


def downgrade() -> None:
    # Fill NULLs before reverting nullable=False
    op.execute("UPDATE diplomas SET gpa = 0 WHERE gpa IS NULL")
    op.execute("UPDATE diplomas SET qualification = 'bachelor' WHERE qualification IS NULL")

    op.alter_column('diplomas', 'gpa',
        existing_type=sa.Numeric(3, 2),
        nullable=False,
    )
    op.alter_column('diplomas', 'qualification', nullable=False)
    # Note: PostgreSQL doesn't support removing enum values easily — leave them
