#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: data_processor.py
模块: 数据处理服务
描述: 负责将笔记文件整理成txt格式，进行内容收集、格式化和临时文件管理
功能:
    - 收集指定文件的所有笔记内容
    - 将HTML格式转换为纯文本
    - 生成临时文件用于AI处理
    - 管理笔记内容的格式化输出

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.1.0

依赖:
    - html2text: HTML转文本转换
    - app.models: 数据模型
    - re: 正则表达式处理

许可证: Apache-2.0
"""

import html2text
import re
import os
import datetime
from app.models.note import Note
from app.models.note_file import NoteFile

class DataProcessor:
    """数据处理器，负责笔记内容的收集、格式化和临时文件管理"""
    
    def __init__(self, temp_dir):
        self.temp_dir = temp_dir
        self.temp_file_config = {
            'max_files_per_note': 2,
            'max_age_days': 7,
            'auto_cleanup': True
        }
    
    def collect_file_content(self, file_id):
        """
        收集指定文件的所有笔记内容，整理成连续文本
        
        Args:
            file_id: 文件ID
            
        Returns:
            dict: 包含收集结果的字典
        """
        try:
            # 验证文件是否存在
            note_file = NoteFile.query.get(file_id)
            if not note_file:
                return {'success': False, 'error': '文件不存在'}
            
            # 获取该文件下的所有笔记，按顺序排列
            notes = Note.query.filter_by(file_id=file_id).order_by(Note.order.asc()).all()
            
            if not notes:
                return {'success': False, 'error': '文件中没有笔记内容'}
            
            # 整理笔记内容（保持markdown格式）
            collected_content = self._collect_and_format_notes_markdown(notes)
            
            # 保存内容到临时文件
            temp_file_info = self._save_to_temp_file(
                collected_content, note_file.name, file_id, 'collected'
            )
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': note_file.name,
                'total_notes': len(notes),
                'collected_content': collected_content,
                'temp_file': temp_file_info,
                'original_notes': [
                    {
                        'id': note.id,
                        'content': note.content,
                        'format': note.format,
                        'order': note.order
                    }
                    for note in notes
                ]
            }
            
        except Exception as e:
            return {'success': False, 'error': f'收集内容失败: {str(e)}'}
    
    def _collect_and_format_notes_markdown(self, notes):
        """
        将多个笔记块整理成连续的markdown格式文本
        """
        if not notes:
            return ""
        
        collected_parts = []
        
        for note in notes:
            if not note.content or note.content.strip() == "":
                continue
                
            # 根据笔记格式处理内容，保持markdown格式
            processed_content = self._process_note_content_markdown(note.content, note.format)
            
            if processed_content.strip():
                collected_parts.append(processed_content)
        
        # 用双换行符连接所有内容，保持段落分隔
        return "\n\n".join(collected_parts)
    
    def _process_note_content_markdown(self, content, format_type):
        """
        根据笔记格式处理内容，保持markdown格式
        """
        if not content:
            return ""
        
        # 如果是HTML格式，转换为markdown
        if format_type and format_type != 'text':
            try:
                # 创建html2text转换器，保持markdown格式
                h = html2text.HTML2Text()
                h.ignore_links = False
                h.ignore_images = False
                h.body_width = 0  # 不限制行宽
                h.unicode_snob = True  # 更好的Unicode处理
                h.escape_snob = True  # 保持特殊字符
                
                # 先清理HTML内容
                clean_content = self._clean_html_content(content)
                
                # 转换为markdown格式
                markdown_content = h.handle(clean_content)
                
                # 清理多余的空行，但保持段落结构
                markdown_content = re.sub(r'\n\s*\n\s*\n+', '\n\n', markdown_content)
                
                return markdown_content.strip()
                
            except Exception as e:
                # 如果转换失败，返回清理后的原始内容
                return self._simple_html_to_markdown(content)
        
        return content.strip()
    
    def _clean_html_content(self, html_content):
        """
        清理HTML内容，保留有用的结构
        """
        if not html_content:
            return ""
        
        # 移除空的p标签
        html_content = re.sub(r'<p[^>]*>\s*</p>', '', html_content)
        
        # 移除style属性但保留结构标签
        html_content = re.sub(r'\s*style="[^"]*"', '', html_content)
        
        # 移除class属性但保留结构标签
        html_content = re.sub(r'\s*class="[^"]*"', '', html_content)
        
        # 保留重要的HTML结构标签
        html_content = re.sub(r'<h([1-6])[^>]*>', r'<h\1>', html_content)
        html_content = re.sub(r'<p[^>]*>', '<p>', html_content)
        html_content = re.sub(r'<ul[^>]*>', '<ul>', html_content)
        html_content = re.sub(r'<ol[^>]*>', '<ol>', html_content)
        html_content = re.sub(r'<li[^>]*>', '<li>', html_content)
        html_content = re.sub(r'<strong[^>]*>', '<strong>', html_content)
        html_content = re.sub(r'<em[^>]*>', '<em>', html_content)
        html_content = re.sub(r'<b[^>]*>', '<strong>', html_content)
        html_content = re.sub(r'<i[^>]*>', '<em>', html_content)
        
        return html_content
    
    def _simple_html_to_markdown(self, html_content):
        """
        简单的HTML到markdown转换（备用方法）
        """
        if not html_content:
            return ""
        
        # 基本的HTML标签到markdown转换
        text = html_content
        
        # 标题转换
        text = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1\n', text)
        text = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1\n', text)
        text = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1\n', text)
        text = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1\n', text)
        text = re.sub(r'<h5[^>]*>(.*?)</h5>', r'##### \1\n', text)
        text = re.sub(r'<h6[^>]*>(.*?)</h6>', r'###### \1\n', text)
        
        # 粗体和斜体
        text = re.sub(r'<(strong|b)[^>]*>(.*?)</\1>', r'**\2**', text)
        text = re.sub(r'<(em|i)[^>]*>(.*?)</\1>', r'*\2*', text)
        
        # 删除线
        text = re.sub(r'<(s|del|strike)[^>]*>(.*?)</\1>', r'~~\2~~', text)
        
        # 代码
        text = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', text)
        
        # 列表
        text = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1\n', text)
        text = re.sub(r'<ul[^>]*>', '', text)
        text = re.sub(r'</ul>', '\n', text)
        text = re.sub(r'<ol[^>]*>', '', text)
        text = re.sub(r'</ol>', '\n', text)
        
        # 段落
        text = re.sub(r'<p[^>]*>', '', text)
        text = re.sub(r'</p>', '\n\n', text)
        
        # 换行
        text = re.sub(r'<br[^>]*/?>', '\n', text)
        
        # 移除其他HTML标签
        text = re.sub(r'<[^>]+>', '', text)
        
        # 解码HTML实体
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&amp;', '&')
        text = text.replace('&quot;', '"')
        text = text.replace('&#39;', "'")
        text = text.replace('&nbsp;', ' ')
        
        # 清理多余的空白字符
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
    
    def _save_to_temp_file(self, content, file_name, file_id, file_type='collected'):
        """
        将内容保存到临时文件，每个文件ID只保留一个最新的临时文件
        """
        try:
            # 清理该文件ID的旧临时文件
            self._cleanup_old_temp_files(file_id, file_name, file_type)
            
            # 生成临时文件名
            safe_file_name = re.sub(r'[^\w\-_\.]', '_', file_name)
            if file_type == 'collected':
                temp_filename = f"{safe_file_name}_{file_id}_collected.txt"
            else:
                temp_filename = f"{safe_file_name}_{file_id}_{file_type}.txt"
            
            temp_filepath = os.path.join(self.temp_dir, temp_filename)
            
            # 准备文件内容，添加元数据头部
            if file_type == 'collected':
                file_content = f"""# 笔记内容收集 - {file_name}
生成时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
文件ID: {file_id}
原始文件名: {file_name}

---

{content}
"""
            else:
                file_content = content
            
            # 写入文件
            with open(temp_filepath, 'w', encoding='utf-8') as f:
                f.write(file_content)
            
            return {
                'filename': temp_filename,
                'filepath': temp_filepath,
                'size': len(file_content),
                'created_at': datetime.datetime.now().isoformat(),
                'url': f'/api/ai/temp-file/{temp_filename}'
            }
            
        except Exception as e:
            raise Exception(f"保存临时文件失败: {str(e)}")
    
    def _cleanup_old_temp_files(self, file_id, file_name, file_type='collected'):
        """
        清理指定文件ID的旧临时文件
        """
        try:
            safe_file_name = re.sub(r'[^\w\-_\.]', '_', file_name)
            
            # 遍历临时目录，查找匹配的旧文件
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                
                # 检查是否是该文件的临时文件
                if filename.startswith(safe_file_name) and str(file_id) in filename:
                    if file_type == 'collected' and 'optimized' not in filename:
                        # 删除旧的收集文件
                        try:
                            os.remove(filepath)
                        except OSError:
                            pass  # 忽略删除失败的情况
                    elif file_type != 'collected' and file_type in filename:
                        # 删除旧的特定类型文件
                        try:
                            os.remove(filepath)
                        except OSError:
                            pass  # 忽略删除失败的情况
        except Exception:
            pass  # 忽略清理过程中的错误
    
    def get_temp_file_content(self, filename):
        """
        获取临时文件内容
        """
        try:
            # 验证文件名安全性
            if not re.match(r'^[\w\-_\.]+$', filename):
                return {'success': False, 'error': '无效的文件名'}
            
            temp_filepath = os.path.join(self.temp_dir, filename)
            
            if not os.path.exists(temp_filepath):
                return {'success': False, 'error': '临时文件不存在'}
            
            # 读取文件内容
            with open(temp_filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 获取文件信息
            file_stat = os.stat(temp_filepath)
            
            return {
                'success': True,
                'filename': filename,
                'content': content,
                'size': file_stat.st_size,
                'created_at': datetime.datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'modified_at': datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat()
            }
            
        except Exception as e:
            return {'success': False, 'error': f'读取临时文件失败: {str(e)}'}
    
    def get_collected_content(self, file_id):
        """
        获取已收集的内容
        """
        try:
            # 查找收集的临时文件
            for filename in os.listdir(self.temp_dir):
                if f"_{file_id}_collected.txt" in filename:
                    result = self.get_temp_file_content(filename)
                    if result['success']:
                        return {
                            'success': True,
                            'file_id': file_id,
                            'collected_content': result['content'],
                            'temp_file': {
                                'filename': result['filename'],
                                'size': result['size'],
                                'created_at': result['created_at'],
                                'modified_at': result['modified_at']
                            }
                        }
            
            return {'success': False, 'error': '未找到收集的内容'}
            
        except Exception as e:
            return {'success': False, 'error': f'获取收集内容失败: {str(e)}'}
    
    def check_collected_content_exists(self, file_id):
        """
        检查收集的内容是否存在
        """
        try:
            temp_files = []
            exists = False
            
            for filename in os.listdir(self.temp_dir):
                if f"_{file_id}_collected.txt" in filename:
                    exists = True
                    temp_files.append({
                        'filename': filename,
                        'type': 'collected',
                        'url': f'/api/ai/temp-file/{filename}'
                    })
            
            return {
                'success': True,
                'exists': exists,
                'temp_files': temp_files
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e), 'exists': False, 'temp_files': []}
    
    def get_health_status(self):
        """
        获取数据处理器健康状态
        """
        try:
            # 检查临时目录是否存在和可写
            if not os.path.exists(self.temp_dir):
                return {'success': False, 'error': '临时目录不存在'}
            
            if not os.access(self.temp_dir, os.W_OK):
                return {'success': False, 'error': '临时目录不可写'}
            
            # 检查可用空间（简单检查）
            temp_files_count = len([f for f in os.listdir(self.temp_dir) if f.endswith('.txt')])
            
            return {
                'success': True,
                'status': 'healthy',
                'temp_dir': self.temp_dir,
                'temp_dir_exists': True,
                'temp_dir_writable': True,
                'temp_files_count': temp_files_count,
                'config': self.temp_file_config
            }
            
        except Exception as e:
            return {'success': False, 'error': f'健康检查失败: {str(e)}'}
