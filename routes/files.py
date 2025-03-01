#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
笔记文件路由模块

该模块提供了笔记文件管理的API路由，包括文件的创建、查询、更新和删除功能。
所有API端点都以/api/files为基础路径。

作者: [作者名]
创建时间: 2024-01-01
"""

from flask import jsonify, request
from . import api
from models import db, NoteFile

@api.route('/files/reorder', methods=['PUT'])
def reorder_files():
    """重新排序文件

    根据提供的文件ID列表重新设置文件的显示顺序。
    列表中的位置即为文件的新顺序值。
    如果发生错误，会进行回滚并返回相应的错误信息。
    """
    data = request.get_json()
    file_ids = data.get('fileIds', [])
    
    if not file_ids:
        return jsonify({
            'error': 'No file IDs provided',
            'message': 'fileIds array is empty'
        }), 400
    
    try:
        # 批量更新文件顺序
        for index, file_id in enumerate(file_ids):
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                return jsonify({
                    'error': 'File not found',
                    'message': f'File with id {file_id} not found'
                }), 404
            note_file.order = index
        
        # 提交更改
        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            api.logger.error(f'Database commit error: {str(commit_error)}')
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to save file order changes'
            }), 500
            
        return jsonify({
            'message': 'Files reordered successfully',
            'status': 'success'
        })
        
    except Exception as e:
        api.logger.error(f'Reorder files error: {str(e)}')
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while reordering files'
        }), 500

@api.route('/files', methods=['GET'])
def get_files():
    """获取所有笔记文件列表

    返回所有笔记文件的基本信息，包括ID、名称、创建时间和更新时间。
    """
    files = NoteFile.query.all()
    return jsonify([
        {
            'id': file.id,
            'name': file.name,
            'created_at': file.created_at.isoformat(),
            'updated_at': file.updated_at.isoformat()
        } for file in files
    ])

@api.route('/files', methods=['POST'])
def create_file():
    """创建新的笔记文件

    接收文件名称参数，如果文件名已存在，则自动添加数字后缀。
    返回新创建的文件信息。
    """
    data = request.get_json()
    base_name = data['name']
    
    # 检查文件名是否存在，如果存在则添加数字后缀
    counter = 0
    new_name = base_name
    while NoteFile.query.filter_by(name=new_name).first() is not None:
        counter += 1
        new_name = f"{base_name}_{counter}"
    
    new_file = NoteFile(name=new_name)
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify({
        'message': 'File created successfully',
        'id': new_file.id,
        'name': new_file.name
    }), 201

@api.route('/files/<int:file_id>', methods=['PUT'])
def update_file(file_id):
    """更新笔记文件信息

    根据文件ID更新文件名称。
    如果文件不存在，返回404错误。
    """
    file = NoteFile.query.get_or_404(file_id)
    data = request.get_json()
    file.name = data['name']
    db.session.commit()
    return jsonify({'message': 'File updated successfully'})

@api.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """删除笔记文件

    根据文件ID删除对应的笔记文件及其关联的所有笔记。
    如果文件不存在，返回404错误。
    如果删除过程中发生错误，会进行回滚并返回500错误。
    """
    try:
        file = NoteFile.query.get_or_404(file_id)
        # 删除文件及其关联的所有笔记
        db.session.delete(file)
        try:
            db.session.commit()
            return jsonify({'message': 'File and associated notes deleted successfully'})
        except Exception as commit_error:
            db.session.rollback()
            api.logger.error(f'Database commit error: {str(commit_error)}')
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to delete file and associated notes'
            }), 500
    except Exception as e:
        api.logger.error(f'Delete file error: {str(e)}')
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while deleting the file'
        }), 500