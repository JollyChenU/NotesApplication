#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: files.py
模块: 文件管理API路由
描述: 处理笔记文件相关的HTTP请求，包括文件的CRUD操作和排序管理
功能:
    - 文件的创建、读取、更新、删除操作
    - 文件排序和重新排列
    - 文件夹关联管理
    - 错误处理和日志记录

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.2.0

依赖:
    - Flask: Web框架
    - SQLAlchemy: ORM数据库操作
    - app.models: 数据模型

API端点:
    - GET /api/files: 获取文件列表
    - POST /api/files: 创建新文件
    - PUT /api/files/<id>: 更新文件信息
    - DELETE /api/files/<id>: 删除文件
    - PUT /api/files/reorder: 重新排序文件

许可证: Apache-2.0
"""

# 标准库导入
import logging
import time
import traceback

# 第三方库导入
from flask import Blueprint, request, jsonify

# 本地应用导入
from app.extensions import db
from app.models.note_file import NoteFile

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('files_routes')

# 创建蓝图
files_bp = Blueprint('files_bp', __name__)

@files_bp.route('/files/reorder', methods=['PUT'])
def reorder_files():
    """重新排序文件"""
    data = request.get_json()
    file_ids = data.get('fileIds', [])
    
    logger.info(f"🔄 接收到文件重新排序请求: {file_ids}")
    
    if not file_ids:
        logger.warning("❌ 没有提供文件ID进行排序")
        return jsonify({
            'error': 'No file IDs provided',
            'message': 'fileIds array is empty'
        }), 400
    
    try:
        # 批量更新文件顺序
        for index, file_id in enumerate(file_ids):
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                logger.error(f"❌ 文件不存在: ID = {file_id}")
                return jsonify({
                    'error': 'File not found',
                    'message': f'File with id {file_id} not found'
                }), 404
            note_file.order = index
        
        # 提交更改
        try:
            start_time = time.time()
            db.session.commit()
            logger.info(f"✅ 文件排序成功保存，处理时间: {time.time() - start_time:.2f}秒")
        except Exception as commit_error:
            db.session.rollback()
            logger.error(f"❌ 保存文件排序失败: {str(commit_error)}")
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to save file order changes'
            }), 500
            
        return jsonify({
            'message': 'Files reordered successfully',
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"❌ 文件排序时发生未预期错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while reordering files'
        }), 500

@files_bp.route('/files', methods=['GET'])
def get_files():
    """获取所有笔记文件列表"""
    logger.info("📂 获取所有文件列表")
    try:
        start_time = time.time()
        files = NoteFile.query.order_by(NoteFile.order).all()
        logger.info(f"✅ 成功获取 {len(files)} 个文件，查询时间: {time.time() - start_time:.2f}秒")
        return jsonify([file.to_dict() for file in files])
    except Exception as e:
        logger.error(f"❌ 获取文件列表时发生错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while fetching files'
        }), 500

@files_bp.route('/files', methods=['POST'])
def create_file():
    """创建新的笔记文件
    
    Returns:
        201: 文件创建成功
        400: 请求参数错误
        409: 文件名冲突
        500: 服务器内部错误
    """
    try:
        # 输入验证
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({
                'error': 'INVALID_INPUT',
                'message': 'File name is required',
                'details': 'Request body must contain a "name" field'
            }), 400
        
        base_name = data['name'].strip()
        if not base_name:
            return jsonify({
                'error': 'INVALID_INPUT',
                'message': 'File name cannot be empty'
            }), 400
        
        logger.info(f"📝 创建新文件请求: {base_name}")
        
        # 处理文件名冲突
        counter = 0
        new_name = base_name
        while NoteFile.query.filter_by(name=new_name).first() is not None:
            counter += 1
            new_name = f"{base_name}_{counter}"
            logger.info(f"⚠️ 文件名已存在，尝试新名称: {new_name}")
        
        # 获取当前最大的order值
        max_order = db.session.query(db.func.max(NoteFile.order)).scalar() or 0
        
        # 创建新文件
        new_file = NoteFile(name=new_name, order=max_order + 1)
        db.session.add(new_file)
        
        start_time = time.time()
        db.session.commit()
        
        processing_time = time.time() - start_time
        logger.info(f"✅ 文件创建成功: ID={new_file.id}, 名称={new_name}, 处理时间={processing_time:.2f}秒")
        
        return jsonify({
            'success': True,
            'message': 'File created successfully',
            'data': {
                'id': new_file.id,
                'name': new_file.name,
                'order': new_file.order,
                'created_at': new_file.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ 文件创建失败: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'Failed to create file',
            'details': 'An unexpected error occurred while processing the request'
        }), 500

@files_bp.route('/files/<int:file_id>', methods=['PUT'])
def update_file(file_id):
    """更新笔记文件信息"""
    start_time = time.time()
    logger.info(f"✏️ 更新文件 ID = {file_id}, 请求数据: {request.get_json()}")
    
    file = NoteFile.query.get_or_404(file_id)
    logger.info(f"📄 原始文件信息: ID = {file_id}, 名称 = {file.name}, 文件夹ID = {file.folder_id}")
    data = request.get_json()
    
    # 保存旧文件夹ID，用于记录变化
    old_folder_id = file.folder_id
    
    if isinstance(data, dict):
        # 记录请求中包含的所有字段
        logger.info(f"📊 更新请求字段: {list(data.keys())}")
        
        if 'name' in data:
            logger.info(f"📝 更新文件名: '{file.name}' -> '{data['name']}'")
            file.name = data['name']
        
        # 同时支持folder_id和folderId两种命名方式
        folder_id_value = None
        folder_id_set = False
        
        if 'folder_id' in data:
            folder_id_value = data['folder_id']
            folder_id_set = True
            logger.info(f"📂 检测到folder_id字段: {folder_id_value}")
        elif 'folderId' in data:
            folder_id_value = data['folderId']
            folder_id_set = True
            logger.info(f"📂 检测到folderId字段: {folder_id_value}")
            
        if folder_id_set:
            # 明确处理移动到根目录的情况
            if folder_id_value == 'null' or folder_id_value is None or folder_id_value == 0 or folder_id_value == '0' or str(folder_id_value).lower() == 'root':
                logger.info(f"📂 将文件 {file_id} 从文件夹 {file.folder_id} 移动到根目录")
                # 明确设置folder_id为None
                file.folder_id = None
                
                # 日志记录SQL更新操作以便调试
                logger.debug(f"SQL更新: file.folder_id = {file.folder_id}")
                
                # 立即执行flush以确保更新已应用到会话
                try:
                    db.session.flush()
                    logger.debug(f"SQL flush后的file.folder_id = {file.folder_id}")
                except Exception as flush_error:
                    logger.error(f"Flush出错: {flush_error}")
            else:
                try:
                    new_folder_id = int(folder_id_value)
                    logger.info(f"📂 将文件 {file_id} 从文件夹 {file.folder_id} 移动到文件夹 {new_folder_id}")
                    file.folder_id = new_folder_id
                except (ValueError, TypeError):
                    error_msg = f"❌ 无效的文件夹ID格式: {folder_id_value}"
                    logger.error(error_msg)
                    return jsonify({
                        'error': 'Invalid folder ID',
                        'message': f'Folder ID must be an integer, received: {folder_id_value}'
                    }), 400
    else:
        logger.info(f"📝 使用兼容模式更新文件名: '{file.name}' -> '{data}'")
        file.name = data  # 兼容旧版API
    
    try:
        # 将更改提交到数据库
        db.session.commit()
        
        # 强制重新从数据库查询以确保获取最新状态
        file = NoteFile.query.get(file_id)
        
        processing_time = time.time() - start_time
        logger.info(f"✅ 文件更新成功: ID = {file_id}, 新文件夹ID = {file.folder_id}, 处理时间: {processing_time:.2f}秒")
        
        # 直接返回更新后的文件对象 
        result = file.to_dict()
        result['old_folder_id'] = old_folder_id
        result['processing_time'] = processing_time
        
        # 特别记录根目录情况
        if file.folder_id is None:
            logger.info(f"📁 文件现在位于根目录 (folder_id = {file.folder_id})")
            # 确保JSON响应中folder_id显式为null
            result['folder_id'] = None
        
        return jsonify(result)
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ 更新文件失败: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Database error',
            'message': 'Failed to update file'
        }), 500

@files_bp.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """删除笔记文件"""
    logger.info(f"🗑️ 删除文件: ID = {file_id}")
    
    try:
        file = NoteFile.query.get_or_404(file_id)
        logger.info(f"📄 找到要删除的文件: ID = {file_id}, 名称 = {file.name}, 文件夹ID = {file.folder_id}")
        
        db.session.delete(file)
        try:
            start_time = time.time()
            db.session.commit()
            logger.info(f"✅ 文件及相关笔记删除成功: ID = {file_id}, 处理时间: {time.time() - start_time:.2f}秒")
            return jsonify({'message': 'File and associated notes deleted successfully'})
        except Exception as commit_error:
            db.session.rollback()
            logger.error(f"❌ 删除文件时数据库提交失败: {str(commit_error)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to delete file and associated notes'
            }), 500
    except Exception as e:
        logger.error(f"❌ 删除文件时发生未预期错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Server error',
            'message': 'An unexpected error occurred while deleting the file'
        }), 500