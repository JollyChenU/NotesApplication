#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
@author Jolly
@date 2025-04-01
@description 路由模块初始化文件
@version 1.0.0
@license GPL-3.0
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