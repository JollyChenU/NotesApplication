"""
测试脚本，用于验证新的项目结构是否正常工作
"""
import sys
import os
import unittest
from app import create_app
from app.extensions import db

class AppTestCase(unittest.TestCase):
    """应用程序测试用例"""
    
    def setUp(self):
        """测试前准备工作"""
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.client = self.app.test_client()
    
    def tearDown(self):
        """测试后清理工作"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_app_exists(self):
        """测试应用程序是否存在"""
        self.assertIsNotNone(self.app)
    
    def test_app_is_testing(self):
        """测试应用程序是否处于测试模式"""
        self.assertTrue(self.app.config['TESTING'])
    
    def test_home_page(self):
        """测试主页是否可以访问"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Welcome to Notes API', response.get_data(as_text=True))
    
    def test_health_check(self):
        """测试健康检查接口是否正常工作"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertIn('connected', response.get_data(as_text=True))

if __name__ == '__main__':
    unittest.main()