"""
@author Jolly
@date 2025-04-01
@description 笔记内容相关路由
@version 1.1.0
@license Apache-2.0
"""

from flask import Blueprint, request, jsonify
from app.extensions import db  # 更新导入路径
from app.models.note_file import NoteFile  
from app.models.note import Note  

notes_bp = Blueprint('notes_bp', __name__)

@notes_bp.route('/files/<int:file_id>/notes', methods=['GET'])
def get_notes(file_id):
    """获取指定文件下的所有笔记"""
    notes = Note.query.filter_by(file_id=file_id).order_by(Note.order).all()
    return jsonify([note.to_dict() for note in notes])

@notes_bp.route('/files/<int:file_id>/notes', methods=['POST'])
def create_note(file_id):
    """创建新笔记"""
    data = request.get_json()
    after_note_id = data.get('after_note_id')
    content = data.get('content', '')
    format = data.get('format', 'text')
    
    if after_note_id:
        # 获取目标笔记的order值
        target_note = Note.query.get(after_note_id)
        if target_note and target_note.file_id == file_id:
            # 将目标笔记之后的所有笔记的order值加1
            Note.query.filter(Note.file_id == file_id, Note.order > target_note.order).update(
                {Note.order: Note.order + 1},
                synchronize_session=False
            )
            new_order = target_note.order + 1
        else:
            # 如果目标笔记不存在或不属于当前文件，添加到末尾
            new_order = (db.session.query(db.func.max(Note.order)).filter(Note.file_id == file_id).scalar() or 0) + 1
    else:
        # 没有指定after_note_id时，添加到末尾
        new_order = (db.session.query(db.func.max(Note.order)).filter(Note.file_id == file_id).scalar() or 0) + 1
    
    new_note = Note(
        content=content,
        format=format,
        order=new_order,
        file_id=file_id
    )
    db.session.add(new_note)
    db.session.commit()
    
    # 返回完整的笔记对象
    return jsonify({
        'id': new_note.id,
        'content': new_note.content,
        'format': new_note.format,
        'order': new_note.order,
        'file_id': new_note.file_id,
        'created_at': new_note.created_at.isoformat() if new_note.created_at else None,
        'updated_at': new_note.updated_at.isoformat() if new_note.updated_at else None
    }), 201

@notes_bp.route('/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    """获取单个笔记"""
    note = Note.query.get_or_404(note_id)
    return jsonify(note.to_dict())

@notes_bp.route('/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """更新笔记内容"""
    note = Note.query.get_or_404(note_id)
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'No data provided'
        }), 400
    
    if 'content' in data:
        note.content = data['content']
    if 'format' in data and isinstance(data['format'], str):
        note.format = data['format']
    if 'order' in data and isinstance(data['order'], (int, float)):
        note.order = data['order']
        
    db.session.commit()
    return jsonify({'message': 'Note updated successfully'})

@notes_bp.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """删除笔记"""
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted successfully'})

@notes_bp.route('/notes/reorder', methods=['PUT'])
def reorder_notes():
    """重新排序笔记"""
    data = request.get_json()
    note_ids = data.get('noteIds', [])
    
    if not note_ids:
        return jsonify({
            'error': 'No note IDs provided',
            'message': 'noteIds array is empty'
        }), 400
    
    try:
        # 批量更新笔记顺序
        for index, note_id in enumerate(note_ids):
            note = Note.query.get(note_id)
            if not note:
                return jsonify({
                    'error': 'Note not found',
                    'message': f'Note with id {note_id} not found'
                }), 404
            note.order = index
        
        # 提交更改
        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to save note order changes'
            }), 500
            
        return jsonify({
            'message': 'Notes reordered successfully',
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while reordering notes'
        }), 500