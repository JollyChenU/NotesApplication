#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
笔记模型模块

该模块定义了笔记（Note）的数据模型，用于存储笔记的内容、创建时间、更新时间等信息。
每个笔记都属于一个笔记文件（NoteFile）。

作者: [作者名]
创建时间: 2024-01-01
"""

from datetime import datetime
from . import db

class Note(db.Model):
    """笔记模型类

    用于表示单个笔记条目的数据模型。每个笔记都包含具体内容、创建和更新时间、
    显示顺序以及所属的笔记文件ID。
    """

    id = db.Column(db.Integer, primary_key=True)  # 笔记的唯一标识符
    content = db.Column(db.Text, nullable=False)  # 笔记内容
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    order = db.Column(db.Integer, default=0)  # 笔记在文件中的显示顺序
    file_id = db.Column(db.Integer, db.ForeignKey('note_file.id'), nullable=False)  # 所属笔记文件的ID