"""issuer unification + blockchain fields

Revision ID: c3f5a7b9d2e4
Revises: b2e4f6a8c0d1
Create Date: 2026-04-06 12:00:00.000000

Renames universities → issuers, adds issuer_type enum,
renames all university_id FK columns to issuer_id,
adds blockchain anchoring fields to diplomas,
makes accreditation_number nullable for non-university issuers.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f5a7b9d2e4"
down_revision: Union[str, Sequence[str], None] = "b2e4f6a8c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ISSUER_TYPE_ENUM = "issuertype"
_ISSUER_TYPE_VALUES = ("university", "training_center", "corporate", "certification_body")


def upgrade() -> None:
    # 1. Create issuer_type enum
    issuer_type_enum = sa.Enum(*_ISSUER_TYPE_VALUES, name=_ISSUER_TYPE_ENUM)
    issuer_type_enum.create(op.get_bind(), checkfirst=True)

    # 2. Rename table universities → issuers
    op.rename_table("universities", "issuers")

    # 3. Add issuer_type column with default 'university' (all existing rows are universities)
    op.add_column(
        "issuers",
        sa.Column(
            "issuer_type",
            sa.Enum(*_ISSUER_TYPE_VALUES, name=_ISSUER_TYPE_ENUM),
            nullable=False,
            server_default="university",
        ),
    )

    # 4. Make accreditation_number nullable (training_center/corporate don't have it)
    op.alter_column("issuers", "accreditation_number", nullable=True)

    # 5. Rename university_id → issuer_id in diplomas
    op.alter_column("diplomas", "university_id", new_column_name="issuer_id")

    # 6. Rename university_id → issuer_id in users
    op.alter_column("users", "university_id", new_column_name="issuer_id")

    # 7. Rename FK constraint on diplomas (PostgreSQL keeps old name otherwise)
    op.drop_constraint("diplomas_university_id_fkey", "diplomas", type_="foreignkey")
    op.create_foreign_key(
        "diplomas_issuer_id_fkey", "diplomas", "issuers", ["issuer_id"], ["id"]
    )

    # 8. Rename FK constraint on users
    op.drop_constraint("users_university_id_fkey", "users", type_="foreignkey")
    op.create_foreign_key(
        "users_issuer_id_fkey", "users", "issuers", ["issuer_id"], ["id"],
        ondelete="SET NULL",
    )

    # 9. Add blockchain fields to diplomas
    op.add_column("diplomas", sa.Column("blockchain_tx_hash", sa.String(length=66), nullable=True))
    op.add_column("diplomas", sa.Column("blockchain_anchored_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("diplomas", sa.Column("blockchain_network", sa.String(length=32), nullable=False, server_default="sepolia"))


def downgrade() -> None:
    # Remove blockchain fields
    op.drop_column("diplomas", "blockchain_network")
    op.drop_column("diplomas", "blockchain_anchored_at")
    op.drop_column("diplomas", "blockchain_tx_hash")

    # Restore FK on users
    op.drop_constraint("users_issuer_id_fkey", "users", type_="foreignkey")
    op.create_foreign_key(
        "users_university_id_fkey", "users", "issuers", ["issuer_id"], ["id"],
        ondelete="SET NULL",
    )
    op.alter_column("users", "issuer_id", new_column_name="university_id")

    # Restore FK on diplomas
    op.drop_constraint("diplomas_issuer_id_fkey", "diplomas", type_="foreignkey")
    op.create_foreign_key(
        "diplomas_university_id_fkey", "diplomas", "issuers", ["issuer_id"], ["id"]
    )
    op.alter_column("diplomas", "issuer_id", new_column_name="university_id")

    # Remove issuer_type
    op.alter_column("issuers", "accreditation_number", nullable=False)
    op.drop_column("issuers", "issuer_type")

    # Rename table back
    op.rename_table("issuers", "universities")

    # Drop enum
    sa.Enum(name=_ISSUER_TYPE_ENUM).drop(op.get_bind(), checkfirst=True)
