from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置SQLite数据库
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'notes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 定义Note模型
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    order = db.Column(db.Integer, default=0)

# 创建数据库表
with app.app_context():
    db.create_all()

# 路由：创建笔记
@app.route('/api/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    new_note = Note(
        title=data['title'],
        content=data['content']
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({'message': 'Note created successfully', 'id': new_note.id}), 201

# 路由：获取所有笔记
@app.route('/api/notes', methods=['GET'])
def get_notes():
    notes = Note.query.order_by(Note.order).all()
    return jsonify([
        {
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat(),
            'order': note.order
        } for note in notes
    ])

# 路由：获取单个笔记
@app.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    note = Note.query.get_or_404(note_id)
    return jsonify({
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'created_at': note.created_at.isoformat(),
        'updated_at': note.updated_at.isoformat()
    })

# 路由：更新笔记
@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    note = Note.query.get_or_404(note_id)
    data = request.get_json()
    note.title = data['title']
    note.content = data['content']
    if 'order' in data:
        note.order = data['order']
    db.session.commit()
    return jsonify({'message': 'Note updated successfully'})

# 路由：删除笔记
@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True)