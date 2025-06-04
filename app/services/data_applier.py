#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: data_applier.py
模块: 服务层 - 数据应用
描述: 数据应用服务，负责将优化后的文本内容转换为笔记文件
功能:
    - 文本内容解析和处理
    - 笔记数据结构转换
    - 批量笔记创建和更新
    - 数据验证和清理

作者: Jolly
创建时间: 2025-06-04
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - re: 正则表达式处理
    - datetime: 时间处理
    - app.models: 数据模型
    - app.extensions: 数据库扩展

许可证: Apache-2.0
"""
import re
import datetime
from app.models.note import Note
from app.models.note_file import NoteFile
from app.extensions import db

class DataApplier:
    """数据应用器，负责将优化后的内容应用到笔记系统"""
    
    def __init__(self):
        pass
    
    def apply_optimization(self, file_id, optimized_content, backup_original=True):
        """
        将优化后的内容应用到笔记文件
        
        Args:
            file_id: 文件ID
            optimized_content: 优化后的内容
            backup_original: 是否备份原始内容
            
        Returns:
            dict: 包含应用结果的字典
        """
        try:
            # 验证文件是否存在
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                return {'success': False, 'error': '文件不存在'}
            
            # 获取原始笔记
            original_notes = Note.query.filter_by(file_id=file_id).order_by(Note.order.asc()).all()
            
            if backup_original and original_notes:
                # 创建备份
                backup_info = self._create_backup(file_id, original_notes)
            else:
                backup_info = None
            
            # 解析优化后的内容为笔记块
            new_notes = self._parse_optimized_content(optimized_content)
            
            # 删除原有笔记
            for note in original_notes:
                db.session.delete(note)
            
            # 创建新笔记
            created_notes = []
            for i, note_content in enumerate(new_notes):
                if note_content.strip():  # 只创建非空笔记
                    new_note = Note(
                        content=note_content,
                        file_id=file_id,
                        order=i,
                        format='text',  # 默认使用text格式
                        created_at=datetime.datetime.utcnow(),
                        updated_at=datetime.datetime.utcnow()
                    )
                    db.session.add(new_note)
                    created_notes.append(new_note)
            
            # 更新文件的修改时间
            note_file.updated_at = datetime.datetime.utcnow()
            
            # 提交数据库更改
            db.session.commit()
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': note_file.name,
                'original_notes_count': len(original_notes),
                'new_notes_count': len(created_notes),
                'backup_info': backup_info,
                'applied_content': optimized_content
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': f'应用优化失败: {str(e)}'}
    
    def preview_optimization(self, file_id, optimized_content):
        """
        预览优化后的内容如何应用到笔记
        
        Args:
            file_id: 文件ID
            optimized_content: 优化后的内容
            
        Returns:
            dict: 包含预览结果的字典
        """
        try:
            # 验证文件是否存在
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                return {'success': False, 'error': '文件不存在'}
            
            # 获取原始笔记
            original_notes = Note.query.filter_by(file_id=file_id).order_by(Note.order.asc()).all()
            
            # 解析优化后的内容为笔记块
            new_notes = self._parse_optimized_content(optimized_content)
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': note_file.name,
                'original_notes': [
                    {
                        'id': note.id,
                        'content': note.content,
                        'format': note.format,
                        'order': note.order
                    }
                    for note in original_notes
                ],
                'new_notes': [
                    {
                        'content': content,
                        'format': 'text',
                        'order': i
                    }
                    for i, content in enumerate(new_notes) if content.strip()
                ],
                'comparison': {
                    'original_count': len(original_notes),
                    'new_count': len([n for n in new_notes if n.strip()]),
                    'content_change': True
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': f'预览失败: {str(e)}'}
    
    def _parse_optimized_content(self, content):
        """
        解析优化后的内容为笔记块
        
        这个方法需要根据内容的特征智能分割成合理的笔记块
        """
        if not content:
            return []
        
        # 移除文件头部的元数据（如果存在）
        content = self._remove_metadata_header(content)
        
        # 基于标题分割内容
        notes = self._split_by_headers(content)
        
        # 如果没有标题分割，则基于段落分割
        if len(notes) <= 1:
            notes = self._split_by_paragraphs(content)
        
        # 清理并过滤空内容
        cleaned_notes = []
        for note in notes:
            cleaned_note = note.strip()
            if cleaned_note and len(cleaned_note) > 10:  # 至少10个字符
                cleaned_notes.append(cleaned_note)
        
        return cleaned_notes
    
    def _remove_metadata_header(self, content):
        """
        移除文件头部的元数据
        """
        lines = content.split('\n')
        content_start = 0
        
        # 查找"---"分隔符，之后的内容才是正文
        for i, line in enumerate(lines):
            if line.strip() == '---':
                content_start = i + 1
                break
        
        return '\n'.join(lines[content_start:]).strip()
    
    def _split_by_headers(self, content):
        """
        基于markdown标题分割内容
        """
        # 使用正则表达式找到所有标题
        header_pattern = r'^(#{1,6})\s+(.+)$'
        lines = content.split('\n')
        
        notes = []
        current_note = []
        
        for line in lines:
            if re.match(header_pattern, line):
                # 遇到新标题，保存之前的内容
                if current_note:
                    notes.append('\n'.join(current_note))
                    current_note = []
            current_note.append(line)
        
        # 添加最后一个笔记块
        if current_note:
            notes.append('\n'.join(current_note))
        
        return notes
    
    def _split_by_paragraphs(self, content):
        """
        基于段落分割内容
        """
        # 基于双换行符分割段落
        paragraphs = re.split(r'\n\s*\n', content)
        
        notes = []
        current_note = []
        current_length = 0
        max_note_length = 1000  # 每个笔记块最大长度
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # 如果当前笔记块太长，创建新的笔记块
            if current_length + len(paragraph) > max_note_length and current_note:
                notes.append('\n\n'.join(current_note))
                current_note = []
                current_length = 0
            
            current_note.append(paragraph)
            current_length += len(paragraph)
        
        # 添加最后一个笔记块
        if current_note:
            notes.append('\n\n'.join(current_note))
        
        return notes
    
    def _create_backup(self, file_id, notes):
        """
        创建原始笔记的备份
        """
        try:
            # 这里可以实现备份逻辑，比如：
            # 1. 创建一个新的文件作为备份
            # 2. 或者保存到专门的备份表
            # 3. 或者简单地返回备份信息供前端下载
            
            backup_content = []
            for note in notes:
                backup_content.append(f"# 笔记 {note.id} (Order: {note.order})\n{note.content}")
            
            backup_text = '\n\n---\n\n'.join(backup_content)
            
            return {
                'created_at': datetime.datetime.now().isoformat(),
                'notes_count': len(notes),
                'content': backup_text,
                'message': '原始内容已备份'
            }
            
        except Exception as e:
            return {
                'error': f'备份失败: {str(e)}',
                'created_at': datetime.datetime.now().isoformat(),
                'notes_count': len(notes)
            }
    
    def restore_from_backup(self, file_id, backup_content):
        """
        从备份恢复笔记
        
        Args:
            file_id: 文件ID
            backup_content: 备份内容
            
        Returns:
            dict: 包含恢复结果的字典
        """
        try:
            # 验证文件是否存在
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                return {'success': False, 'error': '文件不存在'}
            
            # 解析备份内容
            restored_notes = self._parse_backup_content(backup_content)
            
            # 删除当前笔记
            current_notes = Note.query.filter_by(file_id=file_id).all()
            for note in current_notes:
                db.session.delete(note)
            
            # 创建恢复的笔记
            created_notes = []
            for i, note_data in enumerate(restored_notes):
                new_note = Note(
                    content=note_data['content'],
                    file_id=file_id,
                    order=note_data.get('order', i),
                    format=note_data.get('format', 'text'),
                    created_at=datetime.datetime.utcnow(),
                    updated_at=datetime.datetime.utcnow()
                )
                db.session.add(new_note)
                created_notes.append(new_note)
            
            # 更新文件的修改时间
            note_file.updated_at = datetime.datetime.utcnow()
            
            # 提交数据库更改
            db.session.commit()
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': note_file.name,
                'restored_notes_count': len(created_notes)
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': f'恢复失败: {str(e)}'}
    
    def _parse_backup_content(self, backup_content):
        """
        解析备份内容
        """
        # 简单的备份解析逻辑
        sections = backup_content.split('\n\n---\n\n')
        notes = []
        
        for section in sections:
            if section.strip():
                # 移除备份标题行
                lines = section.split('\n')
                if lines and lines[0].startswith('# 笔记'):
                    content = '\n'.join(lines[1:])
                else:
                    content = section
                
                notes.append({
                    'content': content.strip(),
                    'format': 'text',
                    'order': len(notes)
                })
        
        return notes
    
    def restore_backup(self, file_id, backup_id):
        """
        恢复指定的备份
        
        Args:
            file_id: 文件ID
            backup_id: 备份ID（这里简化为备份时间戳）
            
        Returns:
            dict: 包含恢复结果的字典
        """
        try:
            # 这是一个简化的实现，实际项目中可能需要更复杂的备份管理
            return {
                'success': False,
                'error': '备份恢复功能暂未完全实现，请使用手动恢复'
            }
            
        except Exception as e:
            return {'success': False, 'error': f'恢复备份失败: {str(e)}'}
    
    def list_backups(self, file_id):
        """
        获取文件的备份列表
        
        Args:
            file_id: 文件ID
            
        Returns:
            dict: 包含备份列表的字典
        """
        try:
            # 这是一个简化的实现，实际项目中可能需要专门的备份表
            return {
                'success': True,
                'file_id': file_id,
                'backups': []  # 暂时返回空列表
            }
            
        except Exception as e:
            return {'success': False, 'error': f'获取备份列表失败: {str(e)}'}
