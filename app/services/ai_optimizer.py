"""
AI优化服务 - 负责将txt内容喂给AI进行优化
"""
import os
import datetime
import re
from app.services.ai_service import ai_service

class AIOptimizer:
    """AI优化器，负责调用AI服务对内容进行优化"""
    
    def __init__(self, temp_dir):
        self.temp_dir = temp_dir
    
    def optimize_content(self, file_id, file_name, content, optimization_type='general'):
        """
        使用AI优化内容
        
        Args:
            file_id: 文件ID
            file_name: 文件名
            content: 待优化的内容
            optimization_type: 优化类型
            
        Returns:
            dict: 包含优化结果的字典
        """
        try:
            if not content or not content.strip():
                return {
                    'success': False,
                    'error': '内容为空'
                }
            
            # 使用AI服务进行优化
            ai_result = ai_service.optimize_content(content, optimization_type)
            
            if not ai_result['success']:
                return {
                    'success': False,
                    'error': ai_result['error']
                }
            
            # 保存优化结果到临时文件
            optimized_temp_file = self._save_optimized_to_temp_file(
                ai_result['optimized_content'], 
                file_name, 
                file_id, 
                optimization_type
            )
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': file_name,
                'original_content': ai_result['original_content'],
                'optimized_content': ai_result['optimized_content'],
                'optimization_type': optimization_type,
                'report': ai_result['report'],
                'optimized_temp_file': optimized_temp_file
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'AI优化失败: {str(e)}'
            }
    
    def generate_summary(self, file_id, file_name, content):
        """
        使用AI生成内容摘要
        
        Args:
            file_id: 文件ID
            file_name: 文件名
            content: 待摘要的内容
            
        Returns:
            dict: 包含摘要结果的字典
        """
        try:
            if not content or not content.strip():
                return {
                    'success': False,
                    'error': '内容为空'
                }
            
            # 使用AI服务生成摘要
            ai_result = ai_service.generate_summary(content)
            
            if not ai_result['success']:
                return {
                    'success': False,
                    'error': ai_result['error']
                }
            
            return {
                'success': True,
                'file_id': file_id,
                'file_name': file_name,
                'content': ai_result['content'],
                'summary': ai_result['summary']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'生成摘要失败: {str(e)}'
            }
    
    def _save_optimized_to_temp_file(self, content, file_name, file_id, optimization_type):
        """
        将优化后的内容保存到临时文件
        """
        try:
            # 清理该文件ID的旧优化文件
            self._cleanup_old_optimized_files(file_id, file_name)
            
            # 生成临时文件名
            safe_file_name = re.sub(r'[^\w\-_\.]', '_', file_name)
            temp_filename = f"{safe_file_name}_{file_id}_optimized_{optimization_type}.txt"
            temp_filepath = os.path.join(self.temp_dir, temp_filename)
            
            # 准备文件内容，添加元数据头部
            file_content = f"""# AI优化结果 - {file_name}
生成时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
文件ID: {file_id}
原始文件名: {file_name}
优化类型: {optimization_type}

---

{content}
"""
            
            # 写入文件
            with open(temp_filepath, 'w', encoding='utf-8') as f:
                f.write(file_content)
            
            return {
                'filename': temp_filename,
                'filepath': temp_filepath,
                'size': len(file_content),
                'created_at': datetime.datetime.now().isoformat(),
                'url': f'/api/ai/temp-file/{temp_filename}',
                'optimization_type': optimization_type
            }
            
        except Exception as e:
            raise Exception(f"保存优化结果失败: {str(e)}")
    
    def _cleanup_old_optimized_files(self, file_id, file_name):
        """
        清理指定文件ID的旧优化文件
        """
        try:
            safe_file_name = re.sub(r'[^\w\-_\.]', '_', file_name)
            
            # 遍历临时目录，查找匹配的旧优化文件
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                
                # 检查是否是该文件的优化文件
                if (filename.startswith(safe_file_name) and 
                    str(file_id) in filename and 
                    'optimized' in filename):
                    try:
                        os.remove(filepath)
                    except OSError:
                        pass  # 忽略删除失败的情况
        except Exception:
            pass  # 忽略清理过程中的错误
    
    def get_ai_health_status(self):
        """
        获取AI服务健康状态
        """
        try:
            ai_status = "available"
            ai_error = None
            
            try:
                # 尝试简单的AI调用测试
                test_result = ai_service.optimize_content("测试内容", "general")
                if not test_result['success']:
                    ai_status = "error"
                    ai_error = test_result.get('error', 'Unknown error')
            except Exception as e:
                ai_status = "error"
                ai_error = str(e)
            
            return {
                'status': ai_status,
                'error': ai_error,
                'model': 'qwen-turbo'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'model': 'unknown'
            }
    
    def get_optimized_content(self, file_id, optimization_type='general'):
        """
        获取已优化的内容
        """
        try:
            # 查找优化的临时文件
            for filename in os.listdir(self.temp_dir):
                if (f"_{file_id}_optimized_{optimization_type}.txt" in filename):
                    temp_filepath = os.path.join(self.temp_dir, filename)
                    
                    if not os.path.exists(temp_filepath):
                        continue
                    
                    # 读取文件内容
                    with open(temp_filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 获取文件信息
                    file_stat = os.stat(temp_filepath)
                    
                    return {
                        'success': True,
                        'file_id': file_id,
                        'optimization_type': optimization_type,
                        'optimized_content': content,
                        'temp_file': {
                            'filename': filename,
                            'size': file_stat.st_size,
                            'created_at': datetime.datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                            'modified_at': datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                            'url': f'/api/ai/temp-file/{filename}'
                        }
                    }
            
            return {'success': False, 'error': '未找到优化的内容'}
            
        except Exception as e:
            return {'success': False, 'error': f'获取优化内容失败: {str(e)}'}
    
    def check_optimized_content_exists(self, file_id):
        """
        检查优化的内容是否存在
        """
        try:
            optimization_types = []
            temp_files = []
            exists = False
            
            for filename in os.listdir(self.temp_dir):
                if f"_{file_id}_optimized_" in filename:
                    exists = True
                    
                    # 提取优化类型
                    match = re.search(rf"_{file_id}_optimized_(.+)\.txt", filename)
                    if match:
                        opt_type = match.group(1)
                        if opt_type not in optimization_types:
                            optimization_types.append(opt_type)
                    
                    temp_files.append({
                        'filename': filename,
                        'type': 'optimized',
                        'url': f'/api/ai/temp-file/{filename}'
                    })
            
            return {
                'success': True,
                'exists': exists,
                'optimization_types': optimization_types,
                'temp_files': temp_files
            }
            
        except Exception as e:
            return {
                'success': False, 
                'error': str(e), 
                'exists': False, 
                'optimization_types': [], 
                'temp_files': []
            }
