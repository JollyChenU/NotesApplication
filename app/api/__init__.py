#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: __init__.py
模块: API路由模块
描述: API蓝图注册和路由初始化模块
功能:
    - 注册API蓝图
    - 定义路由命名空间
    - API模块导入管理

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

许可证: Apache-2.0
"""

from flask import Blueprint, jsonify

# 创建主API蓝图
api = Blueprint('api', __name__)

@api.route('/')
def index():
    """API主页"""
    return jsonify({
        'message': 'Welcome to Notes API',
        'version': '1.0.0'
    })

# 不在这里导入子模块，避免循环导入