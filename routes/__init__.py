#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API路由模块

该模块定义了应用的API路由蓝图，用于组织和管理所有API端点。
包含了文件管理和笔记管理相关的路由。

作者: [作者名]
创建时间: 2024-01-01
"""

from flask import Blueprint

# 创建API蓝图，设置URL前缀为/api
api = Blueprint('api', __name__, url_prefix='/api')

# 导入各个路由模块
from . import files  # 文件管理相关的路由
from . import notes  # 笔记管理相关的路由