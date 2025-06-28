# models.py

from sqlalchemy.dialects.sqlite import JSON
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    profile_image = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Back‐reference so you can do: some_user.import_batches
    import_batches = db.relationship(
        'ImportBatch',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    # Back‐reference so you can do: some_user.journal_entries
    journal_entries = db.relationship(
        'JournalEntry',
        back_populates='user',
        cascade='all, delete-orphan'
    )


class ImportBatch(db.Model):
    __tablename__ = 'import_batch'

    id = db.Column(db.Integer, primary_key=True)

    # This must match what your routes expect (they do batch = ImportBatch(user_id=…, filename=…, imported_at=…, filepath=…))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    imported_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    filepath = db.Column(db.String(512), nullable=False)

    # When you delete a batch, cascade so that its JournalEntry rows go away too
    trades = db.relationship(
        'JournalEntry',
        back_populates='import_batch',
        cascade='all, delete-orphan'
    )

    # Back‐reference so you can do: some_batch.user
    user = db.relationship('User', back_populates='import_batches')


class JournalEntry(db.Model):
    __tablename__ = 'journal_entry'
    id = db.Column(db.Integer, primary_key=True)

    # Every JournalEntry belongs to a user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    symbol = db.Column(db.String(20), nullable=False)
    direction = db.Column(db.String(10), nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float, nullable=False)
    stop_loss = db.Column(db.Float, nullable=True)
    take_profit = db.Column(db.Float, nullable=True)
    variables = db.Column(JSON, default={})


    quantity = db.Column(db.Float, nullable=False, default=1.0)
    contract_size = db.Column(db.Float, nullable=True, default=None)
    instrument_type = db.Column(db.String(20), nullable=False, default='crypto')
    risk_amount = db.Column(db.Float, nullable=False, default=1.0)

    pnl = db.Column(db.Float, nullable=False, default=0.0)
    strategy = db.Column(db.String(64), nullable=True)
    setup = db.Column(db.String(64), nullable=True)
    rr = db.Column(db.Float, nullable=False, default=0.0)
    notes = db.Column(db.Text, nullable=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # If this entry was imported via Excel, store the batch_id
    import_batch_id = db.Column(db.Integer, db.ForeignKey('import_batch.id'), nullable=True)
    import_batch = db.relationship('ImportBatch', back_populates='trades')

    extra_data = db.Column(JSON, default={})

    # Back‐reference so you can do: some_entry.user
    user = db.relationship('User', back_populates='journal_entries')
