#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: temp_file_manager.py
模块: 临时文件管理服务
描述: 负责临时文件的统一管理，包括创建、清理和生命周期管理
功能:
    - 临时文件的创建和命名管理
    - 自动清理过期文件
    - 文件数量限制和存储管理
    - 提供文件列表和状态查询

作者: Jolly
创建时间: 2025-04-01
最后修改: 2025-06-04
修改人: Jolly
版本: 1.1.0

依赖:
    - os, datetime: 系统文件和时间处理

许可证: Apache-2.0
"""

import os
import datetime

class TempFileManager:
    """临时文件管理器，负责临时文件的创建、清理和管理"""
    
    def __init__(self, temp_dir):
        self.temp_dir = temp_dir
        self.config = {
            'max_files_per_note': 2,
            'max_age_days': 7,
            'auto_cleanup': True
        }
        
        # 确保临时目录存在
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir)
    
    def list_temp_files(self, file_id=None):
        """
        获取临时文件列表
        
        Args:
            file_id: 可选的文件ID，如果提供则只返回该文件的临时文件
            
        Returns:
            dict: 包含文件列表的字典
        """
        try:
            temp_files = []
            
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                
                # 如果指定了file_id，只返回该文件的临时文件
                if file_id and f"_{file_id}_" not in filename:
                    continue
                
                try:
                    file_stat = os.stat(filepath)
                    file_info = {
                        'filename': filename,
                        'size': file_stat.st_size,
                        'created_at': datetime.datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                        'modified_at': datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                        'url': f'/api/ai/temp-file/{filename}',
                        'type': self._determine_file_type(filename)
                    }
                    
                    # 从文件名解析信息
                    if '_optimized_' in filename:
                        parts = filename.split('_optimized_')
                        if len(parts) == 2:
                            file_info['optimization_type'] = parts[1].replace('.txt', '')
                    
                    temp_files.append(file_info)
                    
                except OSError:
                    continue
            
            # 按修改时间排序
            temp_files.sort(key=lambda x: x['modified_at'], reverse=True)
            
            return {
                'success': True,
                'files': temp_files,
                'total_count': len(temp_files)
            }
            
        except Exception as e:
            return {'success': False, 'error': f'获取临时文件列表失败: {str(e)}'}
    
    def cleanup_temp_files(self, file_id=None, days_old=7):
        """
        清理临时文件
        
        Args:
            file_id: 可选的文件ID，如果提供则只清理该文件的临时文件
            days_old: 清理多少天前的文件，默认7天
            
        Returns:
            dict: 包含清理结果的字典
        """
        try:
            cleaned_count = 0
            
            if file_id:
                # 清理指定文件的临时文件
                cleaned_count = self._cleanup_temp_files_by_file_id(file_id)
            else:
                # 清理所有旧临时文件
                cleaned_count = self._cleanup_old_temp_files_by_age(days_old)
            
            return {
                'success': True,
                'cleaned_count': cleaned_count,
                'message': f'成功清理了 {cleaned_count} 个临时文件'
            }
            
        except Exception as e:
            return {'success': False, 'error': f'清理临时文件失败: {str(e)}'}
    
    def _determine_file_type(self, filename):
        """
        根据文件名确定文件类型
        """
        if 'optimized' in filename:
            return 'optimized'
        elif 'collected' in filename:
            return 'collected'
        else:
            return 'unknown'
    
    def _cleanup_temp_files_by_file_id(self, file_id):
        """
        清理指定文件ID的所有临时文件
        """
        cleaned_count = 0
        try:
            for filename in os.listdir(self.temp_dir):
                if f"_{file_id}_" in filename:
                    filepath = os.path.join(self.temp_dir, filename)
                    try:
                        os.remove(filepath)
                        cleaned_count += 1
                    except OSError:
                        pass
        except Exception:
            pass
        
        return cleaned_count
    
    def _cleanup_old_temp_files_by_age(self, days_old):
        """
        清理指定天数前的临时文件
        """
        cleaned_count = 0
        cutoff_time = datetime.datetime.now() - datetime.timedelta(days=days_old)
        
        try:
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                try:
                    file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(filepath))
                    if file_mtime < cutoff_time:
                        os.remove(filepath)
                        cleaned_count += 1
                except OSError:
                    pass
        except Exception:
            pass
        
        return cleaned_count
    
    def get_temp_file_info(self, filename):
        """
        获取临时文件信息
        """
        try:
            filepath = os.path.join(self.temp_dir, filename)
            
            if not os.path.exists(filepath):
                return {'success': False, 'error': '临时文件不存在'}
            
            file_stat = os.stat(filepath)
            
            return {
                'success': True,
                'filename': filename,
                'size': file_stat.st_size,
                'created_at': datetime.datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'modified_at': datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                'type': self._determine_file_type(filename)
            }
            
        except Exception as e:
            return {'success': False, 'error': f'获取文件信息失败: {str(e)}'}
    
    def auto_cleanup(self):
        """
        自动清理过期的临时文件
        """
        if not self.config['auto_cleanup']:
            return
        
        try:
            # 清理超过配置天数的文件
            result = self.cleanup_temp_files(days_old=self.config['max_age_days'])
            return result
        except Exception as e:
            return {'success': False, 'error': f'自动清理失败: {str(e)}'}
    
    def get_storage_info(self):
        """
        获取存储信息
        """
        try:
            total_size = 0
            file_count = 0
            
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                try:
                    file_stat = os.stat(filepath)
                    total_size += file_stat.st_size
                    file_count += 1
                except OSError:
                    continue
            
            return {
                'success': True,
                'temp_dir': self.temp_dir,
                'file_count': file_count,
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'config': self.config
            }
            
        except Exception as e:
            return {'success': False, 'error': f'获取存储信息失败: {str(e)}'}
