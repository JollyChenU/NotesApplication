#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: __init__.py
模块: 数据模型模块
描述: 数据模型模块初始化文件，管理所有数据模型的导入
功能:
    - 数据模型类导入管理
    - 模型关系定义
    - 数据库表初始化

作者: Jolly
创建时间: 2025-06-04
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

许可证: Apache-2.0
"""
# See the License for the specific language governing permissions and
# limitations under the License.

"""
数据库模型模块
包含所有数据库模型定义
"""

# 导入所有模型，以便在其他地方能够直接从app.models导入
from app.models.folder import Folder
from app.models.note_file import NoteFile
from app.models.note import Note