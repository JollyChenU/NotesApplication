"""
@author Jolly
@date 2025-04-01
@description 模型包初始化文件
@version 1.0.0
@license GPL-3.0
"""

# 只导入模型，不要在这里导入db对象
from .note_file import NoteFile
from .folder import Folder
from .note import Note  # 确保也导入Note模型