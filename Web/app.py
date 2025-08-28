#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: app.py
模块: 应用程序入口
描述: NotesApplication项目的主入口文件，负责创建和启动Flask应用
功能:
    - 创建Flask应用实例
    - 配置开发环境
    - 启动应用服务器

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-13
修改人: Jolly
版本: 1.2.1

依赖:
    - app: 应用工厂函数
    - dotenv: 环境变量加载

许可证: Apache-2.0
"""

import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from app import create_app

app = create_app('development')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)