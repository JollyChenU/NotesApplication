#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
@author Jolly
@date 2025-04-01
@description 文件管理相关路由
@version 1.1.0
@license GPL-3.0
"""

from flask import Blueprint, request, jsonify
from extensions import db  # 从extensions导入db
from models.note_file import NoteFile  # 直接从模块导入模型

files_bp = Blueprint('files_bp', __name__)

@files_bp.route('/files/reorder', methods=['PUT'])
def reorder_files():
    """重新排序文件"""
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
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to save file order changes'
            }), 500
            
        return jsonify({
            'message': 'Files reordered successfully',
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while reordering files'
        }), 500

@files_bp.route('/files', methods=['GET'])
def get_files():
    """获取所有笔记文件列表"""
    files = NoteFile.query.order_by(NoteFile.order).all()
    return jsonify([file.to_dict() for file in files])

@files_bp.route('/files', methods=['POST'])
def create_file():
    """创建新的笔记文件"""
    data = request.get_json()
    base_name = data['name']
    
    # 检查文件名是否存在，如果存在则添加数字后缀
    counter = 0
    new_name = base_name
    while NoteFile.query.filter_by(name=new_name).first() is not None:
        counter += 1
        new_name = f"{base_name}_{counter}"
    
    # 获取当前最大的order值
    max_order = db.session.query(db.func.max(NoteFile.order)).scalar() or 0
    
    # 创建新文件，order设置为最大值加1
    new_file = NoteFile(name=new_name, order=max_order + 1)
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify({
        'message': 'File created successfully',
        'id': new_file.id,
        'name': new_file.name
    }), 201

@files_bp.route('/files/<int:file_id>', methods=['PUT'])
def update_file(file_id):
    """更新笔记文件信息"""
    file = NoteFile.query.get_or_404(file_id)
    data = request.get_json()
    
    if isinstance(data, dict):
        if 'name' in data:
            file.name = data['name']
        if 'folderId' in data:
            # 确保folderId正确转换为整数或None
            folder_id_value = data['folderId']
            if folder_id_value == 'null' or folder_id_value is None:
                file.folder_id = None
            else:
                try:
                    file.folder_id = int(folder_id_value)
                except (ValueError, TypeError):
                    return jsonify({
                        'error': 'Invalid folder ID',
                        'message': f'Folder ID must be an integer, received: {folder_id_value}'
                    }), 400
    else:
        file.name = data  # 兼容旧版API
        
    db.session.commit()
    return jsonify({'message': 'File updated successfully'})

@files_bp.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """删除笔记文件"""
    try:
        file = NoteFile.query.get_or_404(file_id)
        db.session.delete(file)
        try:
            db.session.commit()
            return jsonify({'message': 'File and associated notes deleted successfully'})
        except Exception as commit_error:
            db.session.rollback()
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to delete file and associated notes'
            }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while deleting the file'
        }), 500