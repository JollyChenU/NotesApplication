#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: folders.py
模块: API路由 - 文件夹管理
描述: 文件夹相关的REST API端点，包括创建、查询、更新、删除操作
功能:
    - GET /api/folders - 获取文件夹列表
    - POST /api/folders - 创建新文件夹
    - PUT /api/folders/<id> - 更新文件夹信息
    - DELETE /api/folders/<id> - 删除文件夹

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - flask: Web框架
    - app.models.folder: 文件夹数据模型
    - app.models.note_file: 笔记文件数据模型

许可证: Apache-2.0
"""

from flask import Blueprint, request, jsonify
from app.models.folder import Folder
from app.models.note_file import NoteFile
from app.extensions import db  # 更新导入路径

folders_bp = Blueprint('folders', __name__)

@folders_bp.route('/folders', methods=['GET'])
def get_all_folders():
    """获取所有文件夹"""
    folders = Folder.query.all()
    return jsonify([folder.to_dict() for folder in folders])

@folders_bp.route('/folders', methods=['POST'])
def create_folder():
    """创建新文件夹"""
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    folder = Folder(name=data['name'])
    db.session.add(folder)
    db.session.commit()
    
    return jsonify(folder.to_dict()), 201

@folders_bp.route('/folders/<int:folder_id>', methods=['GET'])
def get_folder(folder_id):
    """获取单个文件夹"""
    folder = Folder.query.get_or_404(folder_id)
    return jsonify(folder.to_dict())

@folders_bp.route('/folders/<int:folder_id>', methods=['PUT'])
def update_folder(folder_id):
    """更新文件夹"""
    folder = Folder.query.get_or_404(folder_id)
    data = request.json
    
    if 'name' in data:
        folder.name = data['name']
    
    db.session.commit()
    return jsonify(folder.to_dict())

@folders_bp.route('/folders/<int:folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    """删除文件夹"""
    folder = Folder.query.get_or_404(folder_id)
    
    # 先将该文件夹内的文件移出文件夹
    files = NoteFile.query.filter_by(folder_id=folder_id).all()
    for file in files:
        file.folder_id = None
    
    db.session.delete(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder deleted successfully'})