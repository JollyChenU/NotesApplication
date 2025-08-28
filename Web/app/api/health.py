#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: health.py
模块: API路由 - 健康检查
描述: API健康检查端点，用于监控应用程序和数据库状态
功能:
    - GET /api/health - 返回应用健康状态
    - 数据库连接状态检查
    - 系统状态监控

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - flask: Web框架
    - app.extensions: 应用扩展

许可证: Apache-2.0
"""

from flask import Blueprint, jsonify
from app.extensions import db  # 更新导入路径

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """API健康检查端点"""
    status = "ok"
    try:
        # 验证数据库连接
        db.session.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        status = "error"
        db_status = str(e)
    
    return jsonify({
        "status": status,
        "database": db_status,
        "version": "1.1.0"
    })