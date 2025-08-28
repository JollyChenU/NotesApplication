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
    """更新文件信息"""
    try:
        data = request.get_json()
        if not data:
            logger.warning(f"更新文件 {file_id} 失败: 请求数据为空")
            return jsonify({'error': '请求数据为空'}), 400
        
        logger.info(f"开始更新文件 {file_id}, 请求数据: {data}")
        
        # 查找文件
        file = NoteFile.query.get(file_id)
        if not file:
            logger.warning(f"更新文件失败: 文件 {file_id} 不存在")
            return jsonify({'error': '文件不存在'}), 404
        
        # 记录更新前的状态
        old_folder_id = file.folder_id
        old_name = file.name
        old_content = getattr(file, 'content', '')
        old_order = file.order
        
        logger.debug(f"文件 {file_id} 更新前状态: 名称={old_name}, 文件夹={old_folder_id}, 顺序={old_order}")
        
        # 更新文件信息
        if 'name' in data:
            file.name = data['name']
            logger.debug(f"文件 {file_id} 名称更新: {old_name} -> {file.name}")
        if 'content' in data:
            file.content = data['content']
            logger.debug(f"文件 {file_id} 内容已更新 (长度: {len(old_content)} -> {len(file.content)})")
        if 'order' in data:
            file.order = data['order']
            logger.debug(f"文件 {file_id} 顺序更新: {old_order} -> {file.order}")
        
        # 处理文件夹移动 - 支持两种字段名
        if 'folder_id' in data or 'folderId' in data:
            new_folder_id = data.get('folder_id') or data.get('folderId')
            logger.debug(f"文件 {file_id} 收到文件夹移动请求: {new_folder_id} (类型: {type(new_folder_id)})")
            
            # 如果是字符串 'null' 或空字符串，转换为 None
            if new_folder_id in ['null', '', '0']:
                logger.debug(f"文件 {file_id} 文件夹ID '{new_folder_id}' 转换为 None (根目录)")
                new_folder_id = None
            elif new_folder_id is not None:
                try:
                    new_folder_id = int(new_folder_id)
                    logger.debug(f"文件 {file_id} 文件夹ID转换为整数: {new_folder_id}")
                except (ValueError, TypeError) as e:
                    logger.error(f"文件 {file_id} 无效的文件夹ID '{new_folder_id}': {str(e)}")
                    return jsonify({'error': '无效的文件夹ID'}), 400
            
            # 验证目标文件夹是否存在（如果不是移动到根目录）
            if new_folder_id is not None:
                from app.models.folder import Folder
                target_folder = Folder.query.get(new_folder_id)
                if not target_folder:
                    logger.error(f"文件 {file_id} 移动失败: 目标文件夹 {new_folder_id} 不存在")
                    return jsonify({'error': '目标文件夹不存在'}), 404
                logger.debug(f"文件 {file_id} 目标文件夹 {new_folder_id} ({target_folder.name}) 验证通过")
            
            # 记录文件夹移动操作
            if old_folder_id != new_folder_id:
                old_location = f"文件夹 {old_folder_id}" if old_folder_id else "根目录"
                new_location = f"文件夹 {new_folder_id}" if new_folder_id else "根目录"
                logger.info(f"文件 {file_id} ({file.name}) 开始移动: {old_location} -> {new_location}")
                
                file.folder_id = new_folder_id
                logger.info(f"文件 {file_id} 文件夹ID已更新: {old_folder_id} -> {new_folder_id}")
            else:
                logger.debug(f"文件 {file_id} 文件夹未变化，保持在: {old_folder_id}")
        
        # 提交更改
        db.session.commit()
        logger.info(f"文件 {file_id} 数据库更改已提交")
        
        # 记录更新操作
        changes = []
        if old_name != file.name:
            changes.append(f"名称: {old_name} -> {file.name}")
        if hasattr(file, 'content') and old_content != file.content:
            changes.append(f"内容已更新 (长度: {len(old_content)} -> {len(file.content)})")
        if old_order != file.order:
            changes.append(f"顺序: {old_order} -> {file.order}")
        if old_folder_id != file.folder_id:
            old_loc = f"文件夹 {old_folder_id}" if old_folder_id else "根目录"
            new_loc = f"文件夹 {file.folder_id}" if file.folder_id else "根目录"
            changes.append(f"位置: {old_loc} -> {new_loc}")
        
        if changes:
            logger.info(f"文件 {file_id} 更新成功: {', '.join(changes)}")
        else:
            logger.debug(f"文件 {file_id} 无实际更改")
        
        response_data = file.to_dict()
        
        logger.debug(f"文件 {file_id} 更新响应: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"更新文件 {file_id} 失败: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': '更新文件失败'}), 500

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