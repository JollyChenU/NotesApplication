#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: folder.py
模块: 数据模型 - 文件夹
描述: 文件夹数据模型，定义文件夹的结构和数据库操作
功能:
    - 文件夹数据模型定义
    - 数据库表映射
    - 文件夹CRUD操作方法
    - 数据验证和业务逻辑

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - app.extensions: 数据库扩展

许可证: Apache-2.0
"""

from app.extensions import db  # 更新导入路径

class Folder(db.Model):
    """文件夹模型，用于对笔记文件进行分类管理"""
    __tablename__ = 'folders'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), 
                            onupdate=db.func.current_timestamp())
    
    # 关联文件
    files = db.relationship('NoteFile', backref='folder', lazy=True)

    def __repr__(self):
        return f'<Folder {self.name}>'
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }