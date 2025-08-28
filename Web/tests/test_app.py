#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: test_app.py
模块: 应用程序测试
描述: NotesApplication项目的单元测试和集成测试
功能:
    - API端点测试
    - 数据库模型测试
    - 业务逻辑测试
    - 集成测试用例

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - unittest: 单元测试框架
    - app: 应用程序模块

许可证: Apache-2.0
"""

import unittest
import json
from app import create_app
from app.extensions import db
from app.models.note import Note
from app.models.note_file import NoteFile
from app.models.folder import Folder


class NotesApplicationTestCase(unittest.TestCase):
    """NotesApplication测试用例"""

    def setUp(self):
        """测试前准备"""
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()

    def tearDown(self):
        """测试后清理"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_health_check(self):
        """测试健康检查接口"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')

    def test_create_note_file(self):
        """测试创建笔记文件"""
        response = self.client.post('/api/files', 
                                  json={'name': 'Test File'})
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['name'], 'Test File')


if __name__ == '__main__':
    unittest.main()