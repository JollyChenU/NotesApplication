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
                    'content_change': True                }            }
            
        except Exception as e:
            return {'success': False, 'error': f'预览失败: {str(e)}'}
    
    def _parse_optimized_content(self, content):
        """
        精细化解析：每个标题和段落都是独立的block
        
        规则：
        1. 每个标题（#, ##, ###, ####等）是一个独立的block
        2. 每个段落（由空行分隔）是一个独立的block
        3. 列表项保持在一起作为一个block（除非被空行分隔）
        4. 代码块保持完整
        5. 分隔符（---）单独作为一个block
        """
        if not content:
            return []
        
        content = self._remove_metadata_header(content)
        
        # 按行分割，然后重新组合成block
        lines = content.split('\n')
        blocks = []
        current_block = []
        in_code_block = False
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped_line = line.strip()
            
            # 检查代码块开始/结束
            if stripped_line.startswith('```'):
                if in_code_block:
                    # 代码块结束
                    current_block.append(line)
                    blocks.append('\n'.join(current_block))
                    current_block = []
                    in_code_block = False
                else:
                    # 代码块开始
                    if current_block:
                        blocks.append('\n'.join(current_block))
                        current_block = []
                    current_block.append(line)
                    in_code_block = True
                i += 1
                continue
            
            # 如果在代码块内，直接添加
            if in_code_block:
                current_block.append(line)
                i += 1
                continue
            
            # 检查标题
            if stripped_line.startswith('#') and ' ' in stripped_line:
                # 先保存当前block
                if current_block:
                    blocks.append('\n'.join(current_block))
                    current_block = []
                
                # 标题单独作为一个block
                blocks.append(line.strip())
                i += 1
                continue
            
            # 检查分隔符
            if stripped_line == '---':
                # 先保存当前block
                if current_block:
                    blocks.append('\n'.join(current_block))
                    current_block = []
                
                # 分隔符单独作为一个block
                blocks.append(stripped_line)
                i += 1
                continue
            
            # 检查空行
            if not stripped_line:
                # 如果当前block有内容，保存它
                if current_block:
                    blocks.append('\n'.join(current_block))
                    current_block = []
                # 跳过连续的空行
                while i < len(lines) and not lines[i].strip():
                    i += 1
                continue
            
            # 普通行，添加到当前block
            current_block.append(line)
            i += 1
        
        # 保存最后的block
        if current_block:
            blocks.append('\n'.join(current_block))
        
        # 清理空块和仅包含空白的块
        cleaned_blocks = []
        for block in blocks:
            cleaned_block = block.strip()
            if cleaned_block:
                cleaned_blocks.append(cleaned_block)
        
        # 添加调试信息
        print(f"DEBUG: 精细化解析后得到 {len(cleaned_blocks)} 个笔记块")
        for i, block in enumerate(cleaned_blocks):
            preview = block[:50].replace('\n', '\\n')
            block_type = "段落"
            if block.startswith('#'):
                level = len(block) - len(block.lstrip('#'))
                block_type = f"H{level}标题"
            elif block == '---':
                block_type = "分隔符"
            elif block.startswith('- ') or block.startswith('* '):
                block_type = "列表"
            print(f"DEBUG: Block {i+1} ({block_type}): {preview}...")
        
        return cleaned_blocks
    
    def _remove_metadata_header(self, content):
        """
        移除文件头部的元数据
        """
        lines = content.split('\n')
        content_start = 0
        
        # 只有当 "---" 出现在文件开头的前几行时才认为是元数据分隔符
        # 而不是markdown中间的分隔符
        for i, line in enumerate(lines):
            if i > 5:  # 如果前5行都没有找到，就不是元数据
                break
            if line.strip() == '---' and i > 0:  # 必须不是第一行，且在前几行中
                # 检查前面是否有类似元数据的内容（包含冒号的行）
                has_metadata = False
                for j in range(i):
                    if ':' in lines[j] and not lines[j].strip().startswith('#'):
                        has_metadata = True
                        break
                if has_metadata:
                    content_start = i + 1
                    break
        
        # 添加调试信息
        if content_start > 0:
            print(f"DEBUG: 检测到真正的元数据分隔符，跳过前 {content_start} 行")
        else:
            print("DEBUG: 未检测到元数据分隔符，保留全部内容")
        
        result = '\n'.join(lines[content_start:]).strip()
        print(f"DEBUG: 移除元数据后内容长度: {len(result)}")
        print(f"DEBUG: 移除元数据后内容开头: {result[:200]}...")
        
        return result
    
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
