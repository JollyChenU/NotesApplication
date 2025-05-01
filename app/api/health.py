"""
@author Jolly
@date 2025-04-01
@description API健康检查路由
@version 1.0.0
@license Apache-2.0
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