#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: config.py
模块: 应用配置
描述: Flask应用程序配置模块，包含开发、测试、生产环境配置
功能:
    - 基础配置类定义
    - 环境特定配置
    - 数据库连接配置
    - 安全密钥和会话配置

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - os: 操作系统接口
    - datetime: 时间处理

许可证: Apache-2.0
"""

import os
from datetime import timedelta

# 获取项目根目录的绝对路径
basedir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

class Config:
    """基本配置类"""
    # 密钥配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'notes.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 应用配置
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    
class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
class ProductionConfig(Config):
    """生产环境配置"""
    pass

# 配置映射表
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}