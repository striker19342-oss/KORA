"""public auction metadata
Revision ID: 0001
"""
from alembic import op
import sqlalchemy as sa
revision='0001'; down_revision=None; branch_labels=None; depends_on=None
def upgrade(): op.create_table('public_receipts',sa.Column('id',sa.Integer,primary_key=True),sa.Column('transaction_id',sa.String(160),nullable=False,unique=True),sa.Column('outcome',sa.Boolean,nullable=False),sa.Column('disclosure_scope',sa.String(64),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),server_default=sa.text('CURRENT_TIMESTAMP'),nullable=False))
def downgrade(): op.drop_table('public_receipts')
