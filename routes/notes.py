from flask import jsonify, request
from . import api
from models import db, Note

@api.route('/files/<int:file_id>/notes', methods=['GET'])
def get_notes(file_id):
    """获取指定文件下的所有笔记

    根据文件ID获取该文件下的所有笔记，按照笔记的排序字段升序排列。
    返回笔记的完整信息，包括ID、内容、创建时间、更新时间和排序值。
    """
    notes = Note.query.filter_by(file_id=file_id).order_by(Note.order).all()
    return jsonify([
        {
            'id': note.id,
            'content': note.content,
            'format': note.format,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat(),
            'order': note.order
        } for note in notes
    ])

@api.route('/files/<int:file_id>/notes', methods=['POST'])
def create_note(file_id):
    """创建新笔记

    在指定文件下创建新的笔记。新笔记的排序值会被设置为当前最大排序值加1，
    确保新笔记总是添加到列表末尾。
    """
    data = request.get_json()
    # 获取当前文件中最大的order值
    max_order = db.session.query(db.func.max(Note.order)).filter(Note.file_id == file_id).scalar() or 0
    new_note = Note(
        content=data['content'],
        format=data.get('format', 'text'),  # 设置格式，默认为text
        order=max_order + 1,
        file_id=file_id
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({'message': 'Note created successfully', 'id': new_note.id}), 201

@api.route('/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    """获取单个笔记

    根据笔记ID获取特定笔记的详细信息。
    如果笔记不存在，返回404错误。
    """
    note = Note.query.get_or_404(note_id)
    return jsonify({
        'id': note.id,
        'content': note.content,
        'format': note.format,
        'created_at': note.created_at.isoformat(),
        'updated_at': note.updated_at.isoformat()
    })

@api.route('/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """更新笔记内容

    根据笔记ID更新笔记的内容和排序值（如果提供）。
    如果笔记不存在，返回404错误。
    如果请求数据无效，返回400错误。
    """
    note = Note.query.get_or_404(note_id)
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'No data provided'
        }), 400
    
    if 'content' not in data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'Content field is required'
        }), 400
    
    if 'format' in data and not isinstance(data['format'], str):
        return jsonify({
            'error': 'Invalid request',
            'message': 'Format field must be a string'
        }), 400
    
    if 'order' in data and not isinstance(data['order'], (int, float)):
        return jsonify({
            'error': 'Invalid request',
            'message': 'Order field must be a number'
        }), 400
        
    note.content = data['content']
    if 'format' in data:
        note.format = data['format']
    if 'order' in data:
        note.order = data['order']
    db.session.commit()
    return jsonify({'message': 'Note updated successfully'})

@api.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """删除笔记

    根据笔记ID删除特定笔记。
    如果笔记不存在，返回404错误。
    """
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted successfully'})

@api.route('/notes/reorder', methods=['PUT'])
def reorder_notes():
    """重新排序笔记

    根据提供的笔记ID列表重新设置笔记的显示顺序。
    列表中的位置即为笔记的新顺序值。
    如果发生错误，会进行回滚并返回相应的错误信息。
    """
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
            api.logger.error(f'Database commit error: {str(commit_error)}')
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to save note order changes'
            }), 500
            
        return jsonify({
            'message': 'Notes reordered successfully',
            'status': 'success'
        })
        
    except Exception as e:
        api.logger.error(f'Reorder notes error: {str(e)}')
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while reordering notes'
        }), 500