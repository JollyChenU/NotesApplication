"""
@author Jolly
@date 2025-04-01
@description 应用扩展模块，包含数据库、迁移等组件
@version 1.0.0
@license GPL-3.0
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# 创建数据库实例
db = SQLAlchemy()
migrate = Migrate()