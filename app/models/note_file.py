#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
笔记文件模型模块

该模块定义了笔记文件（NoteFile）的数据模型，用于组织和管理笔记。
每个笔记文件可以包含多个笔记（Note）条目。

@author Jolly
@date 2025-04-01
@description 笔记文件模型
@version 1.1.0
@license GPL-3.0
"""

from datetime import datetime
from app.extensions import db  # 更新导入路径

class NoteFile(db.Model):
    """笔记文件模型，用于存储笔记文件信息"""
    __tablename__ = 'note_files'

    id = db.Column(db.Integer, primary_key=True)  # 笔记文件的唯一标识符
    name = db.Column(db.String(200), nullable=False)  # 笔记文件名称
    order = db.Column(db.Integer, default=0)  # 文件的显示顺序
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    notes = db.relationship('Note', backref='note_file', lazy=True, cascade='all, delete-orphan')  # 与笔记的一对多关系，设置级联删除

    # 添加文件夹引用
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'folder_id': self.folder_id
        }