#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright 2025 Jolly Chen
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
文件名: note_file.py
模块: 数据模型 - 笔记文件
描述: 笔记文件数据模型，用于组织和管理笔记文件集合
功能:
    - 笔记文件数据模型定义
    - 数据库表映射
    - 文件CRUD操作方法
    - 数据验证和业务逻辑
    - 与笔记的关联关系管理

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.1.0

依赖:
    - datetime: 时间处理
    - app.extensions: 数据库扩展

许可证: Apache-2.0
"""

from datetime import datetime
from app.extensions import db  # 更新导入路径

class NoteFile(db.Model):
    """笔记文件模型，用于存储笔记文件信息
    
    Attributes:
        id (int): 主键ID
        name (str): 文件名称，最大长度200字符
        order (int): 文件的显示顺序，默认为0
        created_at (datetime): 创建时间
        updated_at (datetime): 更新时间
        folder_id (int): 所属文件夹ID，可为空
        notes (relationship): 与笔记的一对多关系
    """
    __tablename__ = 'note_files'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, 
                          default=datetime.utcnow, 
                          onupdate=datetime.utcnow, 
                          nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    
    # 关系定义
    notes = db.relationship('Note', 
                           backref='note_file', 
                           lazy=True, 
                           cascade='all, delete-orphan',
                           order_by='Note.order')

    def __repr__(self):
        """字符串表示"""
        return f'<NoteFile {self.name}>'

    def __str__(self):
        """可读字符串表示"""
        return self.name

    def validate_name(self):
        """验证文件名称
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if not self.name or not self.name.strip():
            return False, "文件名不能为空"
        
        if len(self.name.strip()) > 200:
            return False, "文件名长度不能超过200个字符"
        
        # 检查是否包含非法字符
        illegal_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in illegal_chars:
            if char in self.name:
                return False, f"文件名不能包含非法字符: {char}"
        
        return True, ""

    def update_timestamp(self):
        """更新时间戳"""
        self.updated_at = datetime.utcnow()

    def to_dict(self, include_notes=False):
        """转换为字典格式
        
        Args:
            include_notes (bool): 是否包含笔记信息
            
        Returns:
            dict: 字典格式的文件信息
        """
        result = {
            'id': self.id,
            'name': self.name,
            'order': self.order,
            'folder_id': self.folder_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'notes_count': len(self.notes) if self.notes else 0
        }
        
        if include_notes:
            result['notes'] = [note.to_dict() for note in self.notes]
            
        return result

    @classmethod
    def get_max_order(cls):
        """获取当前最大的排序值
        
        Returns:
            int: 最大排序值
        """
        max_order = db.session.query(db.func.max(cls.order)).scalar()
        return max_order if max_order is not None else 0

    @classmethod
    def reorder_files(cls, file_ids):
        """批量重新排序文件
        
        Args:
            file_ids (list): 文件ID列表，按新的顺序排列
            
        Returns:
            bool: 是否成功
        """
        try:
            for index, file_id in enumerate(file_ids):
                file_obj = cls.query.get(file_id)
                if file_obj:
                    file_obj.order = index
            return True
        except Exception:
            return False