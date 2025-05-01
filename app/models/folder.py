"""
@author Jolly
@date 2025-04-01
@description 文件夹数据模型
@version 1.0.0
@license Apache-2.0
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