#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
笔记模型模块

该模块定义了笔记（Note）的数据模型，用于存储笔记的内容、创建时间、更新时间等信息。
每个笔记都属于一个笔记文件（NoteFile）。

作者: Jolly
创建时间: 2024-01-01
"""

from datetime import datetime
from app.extensions import db  # 更新导入路径

class Note(db.Model):
    """笔记内容模型，表示单个笔记条目的内容和格式"""
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)  # 笔记的唯一标识符
    content = db.Column(db.Text)  # 笔记内容
    format = db.Column(db.String(20), default='text')  # 笔记格式，如text、h1、h2等
    order = db.Column(db.Integer, default=0)  # 笔记在文件中的顺序
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    file_id = db.Column(db.Integer, db.ForeignKey('note_files.id', ondelete='CASCADE'))  # 所属文件ID

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'content': self.content,
            'format': self.format,
            'order': self.order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'file_id': self.file_id
        }