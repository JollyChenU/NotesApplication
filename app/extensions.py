#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: extensions.py
模块: 应用扩展
描述: Flask应用扩展模块，包含数据库、迁移等组件
功能:
    - SQLAlchemy数据库ORM
    - Flask-Migrate数据库迁移
    - 扩展实例的全局定义

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - flask_sqlalchemy: SQLAlchemy ORM
    - flask_migrate: 数据库迁移工具

许可证: Apache-2.0
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# 创建数据库实例
db = SQLAlchemy()
migrate = Migrate()