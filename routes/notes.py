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

    在指定文件下创建新的笔记。如果提供了after_note_id参数，新笔记将被插入到该笔记之后；
    否则，新笔记将被添加到列表末尾。
    """
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