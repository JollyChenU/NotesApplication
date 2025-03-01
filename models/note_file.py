#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
笔记文件模型模块

该模块定义了笔记文件（NoteFile）的数据模型，用于组织和管理笔记。
每个笔记文件可以包含多个笔记（Note）条目。

作者: [作者名]
创建时间: 2024-01-01
"""

from datetime import datetime
from . import db

class NoteFile(db.Model):
    """笔记文件模型类

    用于表示笔记的组织单元。每个笔记文件包含一个名称，创建和更新时间，
    以及与之关联的笔记列表。
    """

    id = db.Column(db.Integer, primary_key=True)  # 笔记文件的唯一标识符
    name = db.Column(db.String(200), nullable=False)  # 笔记文件名称
    order = db.Column(db.Integer, default=0)  # 文件的显示顺序
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    notes = db.relationship('Note', backref='note_file', lazy=True, cascade='all, delete-orphan')  # 与笔记的一对多关系，设置级联删除