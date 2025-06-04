#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: ai.py
模块: AI API路由
描述: 提供AI相关的API接口，包含数据整理、AI优化、数据返回三个主要功能
功能:
    - 数据收集和整理API
    - AI内容优化API
    - 结果应用和备份管理API
    - 临时文件管理API

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.2.0

依赖:
    - Flask: Web框架
    - app.services: 业务服务模块

API端点:
    - POST /api/ai/collect-content: 收集内容
    - POST /api/ai/optimize-content: 优化内容
    - POST /api/ai/apply-optimization: 应用优化结果
    - GET /api/ai/temp-files: 获取临时文件列表

许可证: Apache-2.0
"""

import os
from flask import Blueprint, request, jsonify, send_file
from app.services.data_processor import DataProcessor
from app.services.ai_optimizer import AIOptimizer
from app.services.data_applier import DataApplier
from app.services.temp_file_manager import TempFileManager
import logging

logger = logging.getLogger(__name__)

# 创建AI蓝图
ai_bp = Blueprint('ai', __name__)

# 初始化服务
TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'temp')
data_processor = DataProcessor(TEMP_DIR)
ai_optimizer = AIOptimizer(TEMP_DIR)
data_applier = DataApplier()
temp_file_manager = TempFileManager(TEMP_DIR)


# ==================== 数据整理相关API ====================

@ai_bp.route('/ai/collect-content', methods=['POST'])
def collect_content():
    """
    收集指定文件的所有笔记内容，整理成txt格式
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
        
        # 调用数据处理器收集内容
        result = data_processor.collect_file_content(file_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"收集内容失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'收集内容时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/collected-content/<int:file_id>', methods=['GET'])
def get_collected_content(file_id):
    """
    获取已收集的内容
    """
    try:
        result = data_processor.get_collected_content(file_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"获取收集内容失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取收集内容时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/check-collected/<int:file_id>', methods=['GET'])
def check_collected_content(file_id):
    """
    检查收集的内容是否存在
    """
    try:
        result = data_processor.check_collected_content_exists(file_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"检查收集内容失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'检查收集内容时发生错误: {str(e)}',
            'exists': False,
            'temp_files': []
        }), 500


# ==================== AI优化相关API ====================

@ai_bp.route('/ai/optimize-content', methods=['POST'])
def optimize_content():
    """
    使用AI优化内容
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        content = data.get('content')
        optimization_type = data.get('type', 'general')
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
            
        if not content:
            return jsonify({
                'success': False,
                'error': '缺少内容参数'
            }), 400
        
        # 获取文件名（用于临时文件命名）
        from app.models.note_file import NoteFile
        note_file = NoteFile.query.get(file_id)
        file_name = note_file.name if note_file else f"file_{file_id}"
        
        # 调用AI优化器
        result = ai_optimizer.optimize_content(file_id, file_name, content, optimization_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"AI优化失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'AI优化时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/optimized-content/<int:file_id>', methods=['GET'])
def get_optimized_content(file_id):
    """
    获取已优化的内容
    """
    try:
        optimization_type = request.args.get('type', 'general')
        result = ai_optimizer.get_optimized_content(file_id, optimization_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"获取优化内容失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取优化内容时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/check-optimized/<int:file_id>', methods=['GET'])
def check_optimized_content(file_id):
    """
    检查优化的内容是否存在
    """
    try:
        result = ai_optimizer.check_optimized_content_exists(file_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"检查优化内容失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'检查优化内容时发生错误: {str(e)}',
            'exists': False,
            'optimization_types': [],
            'temp_files': []
        }), 500


@ai_bp.route('/ai/generate-summary', methods=['POST'])
def generate_summary():
    """
    生成内容摘要
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        content = data.get('content')
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
            
        if not content:
            return jsonify({
                'success': False,
                'error': '缺少内容参数'
            }), 400
        
        # 获取文件名
        from app.models.note_file import NoteFile
        note_file = NoteFile.query.get(file_id)
        file_name = note_file.name if note_file else f"file_{file_id}"
        
        # 调用AI优化器生成摘要
        result = ai_optimizer.generate_summary(file_id, file_name, content)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"生成摘要失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'生成摘要时发生错误: {str(e)}'
        }), 500


# ==================== 数据返回相关API ====================

@ai_bp.route('/ai/apply-optimization', methods=['POST'])
def apply_optimization():
    """
    将优化后的内容应用到笔记系统
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        optimized_content = data.get('optimized_content')
        backup_original = data.get('backup_original', True)
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
            
        if not optimized_content:
            return jsonify({
                'success': False,
                'error': '缺少优化内容参数'
            }), 400
        
        # 调用数据应用器
        result = data_applier.apply_optimization(file_id, optimized_content, backup_original)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"应用优化失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'应用优化时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/restore-backup', methods=['POST'])
def restore_backup():
    """
    恢复备份内容
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        backup_id = data.get('backup_id')
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
            
        if not backup_id:
            return jsonify({
                'success': False,
                'error': '缺少备份ID参数'
            }), 400
        
        # 调用数据应用器恢复备份
        result = data_applier.restore_backup(file_id, backup_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"恢复备份失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'恢复备份时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/list-backups/<int:file_id>', methods=['GET'])
def list_backups(file_id):
    """
    获取文件的备份列表
    """
    try:
        result = data_applier.list_backups(file_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"获取备份列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取备份列表时发生错误: {str(e)}'
        }), 500


# ==================== 临时文件管理API ====================

@ai_bp.route('/ai/temp-files', methods=['GET'])
def get_temp_files():
    """
    获取临时文件列表
    """
    try:
        file_id = request.args.get('file_id', type=int)
        result = temp_file_manager.list_temp_files(file_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"获取临时文件列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取临时文件列表时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/temp-file/<filename>', methods=['GET'])
def get_temp_file(filename):
    """
    获取临时文件内容或下载临时文件
    """
    try:
        # 检查是否请求下载
        download = request.args.get('download', 'false').lower() == 'true'
        
        if download:
            # 返回文件下载
            temp_filepath = os.path.join(TEMP_DIR, filename)
            if not os.path.exists(temp_filepath):
                return jsonify({
                    'success': False,
                    'error': '临时文件不存在'
                }), 404
            
            return send_file(temp_filepath, as_attachment=True, download_name=filename)
        else:
            # 返回文件内容
            result = data_processor.get_temp_file_content(filename)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
    except Exception as e:
        logger.error(f"获取临时文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取临时文件时发生错误: {str(e)}'
        }), 500


@ai_bp.route('/ai/cleanup-temp-files', methods=['POST'])
def cleanup_temp_files():
    """
    清理临时文件
    """
    try:
        data = request.get_json() or {}
        file_id = data.get('file_id')
        days_old = data.get('days_old', 7)
        
        result = temp_file_manager.cleanup_temp_files(file_id, days_old)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"清理临时文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'清理临时文件时发生错误: {str(e)}'
        }), 500


# ==================== 健康检查和状态API ====================

@ai_bp.route('/ai/health', methods=['GET'])
def check_health():
    """
    检查AI服务健康状态
    """
    try:
        # 检查数据处理器状态
        data_processor_status = data_processor.get_health_status()
        
        # 检查AI优化器状态
        ai_status = ai_optimizer.get_ai_health_status()
        
        # 检查临时文件管理器状态
        temp_manager_status = temp_file_manager.get_health_status()
        
        # 整合状态
        overall_status = (
            data_processor_status.get('success', False) and
            ai_status.get('status') == 'available' and
            temp_manager_status.get('success', False)
        )
        
        return jsonify({
            'success': True,
            'status': 'healthy' if overall_status else 'degraded',
            'components': {
                'data_processor': data_processor_status,
                'ai_optimizer': ai_status,
                'temp_file_manager': temp_manager_status
            }
        }), 200
        
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'error',
            'error': f'健康检查时发生错误: {str(e)}'
        }), 500


# ==================== 完整流程API ====================

@ai_bp.route('/ai/full-optimization', methods=['POST'])
def full_optimization():
    """
    完整的AI优化流程：收集 -> 优化 -> 应用
    """
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        optimization_type = data.get('optimization_type', 'general')
        backup_original = data.get('backup_original', True)
        
        if not file_id:
            return jsonify({
                'success': False,
                'error': '缺少文件ID参数'
            }), 400
        
        # 步骤1: 收集内容
        logger.info(f"开始完整AI优化流程 - 文件ID: {file_id}")
        collect_result = data_processor.collect_file_content(file_id)
        
        if not collect_result['success']:
            return jsonify({
                'success': False,
                'error': f'收集内容失败: {collect_result["error"]}',
                'step': 'collect'
            }), 400
        
        # 步骤2: AI优化
        optimize_result = ai_optimizer.optimize_content(
            file_id, 
            collect_result['file_name'], 
            collect_result['collected_content'], 
            optimization_type
        )
        
        if not optimize_result['success']:
            return jsonify({
                'success': False,
                'error': f'AI优化失败: {optimize_result["error"]}',
                'step': 'optimize'
            }), 400
        
        # 步骤3: 应用优化（可选）
        apply_result = None
        if data.get('auto_apply', False):
            apply_result = data_applier.apply_optimization(
                file_id, 
                optimize_result['optimized_content'], 
                backup_original
            )
            
            if not apply_result['success']:
                return jsonify({
                    'success': False,
                    'error': f'应用优化失败: {apply_result["error"]}',
                    'step': 'apply',
                    'optimization_result': optimize_result
                }), 400
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'steps_completed': ['collect', 'optimize'] + (['apply'] if apply_result else []),
            'collect_result': collect_result,
            'optimize_result': optimize_result,
            'apply_result': apply_result
        }), 200
        
    except Exception as e:
        logger.error(f"完整AI优化流程失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'完整AI优化流程时发生错误: {str(e)}',
            'step': 'unknown'
        }), 500
