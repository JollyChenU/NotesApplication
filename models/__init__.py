from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .note import Note
from .note_file import NoteFile