"""
@author Jolly
@date 2025-04-01
@description 文件夹API路由
@version 1.0.0
@license GPL-3.0
"""

from flask import Blueprint, request, jsonify
from models.folder import Folder
from models.note_file import NoteFile
from extensions import db  # 从extensions模块导入db

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
