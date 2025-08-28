#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: ai_service.py
模块: AI优化服务
描述: 使用LangChain和Qwen模型进行笔记内容的智能优化处理
功能:
    - 提供多种类型的内容优化（语法、结构、清晰度、格式、综合）
    - 集成通义千问API进行AI内容处理
    - 生成优化报告和统计信息
    - 内容预处理和后处理

作者: 开发团队
创建时间: 2024-11-15
最后修改: 2025-01-04
修改人: 系统维护
版本: 1.2.1

依赖:
    - langchain: AI链式处理框架
    - dashscope: 通义千问API SDK
    - typing: 类型注解支持

注意事项:
    - 需要配置QWEN_API_KEY环境变量
    - AI服务调用有频率限制
    - 内容长度不应超过100000字符
    - 使用前需确保网络连接正常

许可证: Apache-2.0

修改历史:
    v1.2.1 (2025-01-04): 优化错误处理和日志记录
    v1.2.0 (2024-12-15): 添加内容后处理功能
    v1.1.0 (2024-12-01): 新增多种优化类型支持
    v1.0.0 (2024-11-15): 初始版本，基础AI优化功能
"""
import os
import re
from typing import Optional, Dict, Any
from langchain.llms.base import LLM
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import dashscope
from dashscope import Generation
import json
import logging

# 禁用LangSmith以提高性能
os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGCHAIN_API_KEY"] = ""

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QwenLLM(LLM):
    """
    自定义Qwen LLM类，继承自LangChain的LLM基类
    优化版本：使用更快的模型和参数
    """
    model_name: str = "qwen-turbo"  # 使用turbo版本更快
    temperature: float = 0.3  # 降低温度，减少随机性，提高一致性和速度
    max_tokens: int = 1500  # 减少最大token数，加快响应速度
    api_key: str = ""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.api_key = os.getenv('QWEN_API_KEY', '')
        if not self.api_key:
            raise ValueError("QWEN_API_KEY environment variable is required")
        dashscope.api_key = self.api_key
    
    @property
    def _llm_type(self) -> str:
        return "qwen"
    
    def _call(self, prompt: str, stop: Optional[list] = None) -> str:
        try:
            response = Generation.call(
                model=self.model_name,
                prompt=prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stop_words=stop or []
            )
            
            if response.status_code == 200:
                return response.output.text.strip()
            else:
                logger.error(f"Qwen API error: {response.code} - {response.message}")
                return f"API调用失败: {response.message}"
                
        except Exception as e:
            logger.error(f"Error calling Qwen API: {str(e)}")
            return f"调用AI服务时出错: {str(e)}"

class AIOptimizationService:
    """
    AI优化服务类 - 单例模式，提高性能
    """
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIOptimizationService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # 避免重复初始化
        if self._initialized:
            return
        self.llm = QwenLLM()
        self._setup_chains()
        self._initialized = True
    
    def _setup_chains(self):
        """设置LangChain chains"""
        
        # 优化的内容优化提示模板 - 简化版本
        self.content_optimization_template = PromptTemplate(
            input_variables=["content", "optimization_type"],
            template="""请优化以下内容（类型：{optimization_type}）：

{content}

要求：保持原意，输出优化后的markdown格式内容，无需解释。
"""
        )
        
        # 优化的内容摘要提示模板 - 简化版本
        self.content_summary_template = PromptTemplate(
            input_variables=["content"],
            template="""请为以下内容生成简洁摘要：

{content}

摘要：
"""
        )
        
        # 创建chains
        self.optimization_chain = LLMChain(
            llm=self.llm,
            prompt=self.content_optimization_template
        )
        
        self.summary_chain = LLMChain(
            llm=self.llm,
            prompt=self.content_summary_template
        )
    
    def optimize_content(self, content: str, optimization_type: str = "general") -> Dict[str, Any]:
        """
        优化笔记内容
        
        Args:
            content: 原始内容
            optimization_type: 优化类型 (grammar, structure, clarity, markdown, general)
            
        Returns:
            包含优化结果的字典
        """
        try:
            if not content or not content.strip():
                return {
                    'success': False,
                    'error': '内容为空',
                    'original_content': content,
                    'optimized_content': content
                }
            
            # 内容长度优化 - 避免处理过长内容
            if len(content) > 3000:
                # 截取前3000字符
                processed_content = content[:3000] + "..."
                logger.warning(f"内容过长，截取前3000字符进行优化")
            else:
                processed_content = self._preprocess_content(content)
            
            # 调用优化chain
            result = self.optimization_chain.run(
                content=processed_content,
                optimization_type=optimization_type
            )
            
            # 后处理结果
            optimized_content = self._postprocess_content(result)
            
            # 生成优化报告
            report = self._generate_optimization_report(
                processed_content, 
                optimized_content, 
                optimization_type
            )
            
            return {
                'success': True,
                'original_content': content,
                'optimized_content': optimized_content,
                'optimization_type': optimization_type,
                'report': report
            }
            
        except Exception as e:
            logger.error(f"Content optimization failed: {str(e)}")
            return {
                'success': False,
                'error': f'优化失败: {str(e)}',
                'original_content': content,
                'optimized_content': content
            }
    
    def generate_summary(self, content: str) -> Dict[str, Any]:
        """
        生成内容摘要
        
        Args:
            content: 原始内容
            
        Returns:
            包含摘要结果的字典
        """
        try:
            if not content or not content.strip():
                return {
                    'success': False,
                    'error': '内容为空'
                }
            
            # 预处理内容
            processed_content = self._preprocess_content(content)
            
            # 调用摘要chain
            summary = self.summary_chain.run(content=processed_content)
            
            return {
                'success': True,
                'content': content,
                'summary': summary.strip()
            }
            
        except Exception as e:
            logger.error(f"Summary generation failed: {str(e)}")
            return {
                'success': False,
                'error': f'生成摘要失败: {str(e)}'
            }
    
    def _preprocess_content(self, content: str) -> str:
        """预处理内容"""
        if not content:
            return ""
        
        # 清理多余的空行
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        # 清理多余的空格
        content = re.sub(r'[ \t]+', ' ', content)
        
        # 去掉首尾空白
        content = content.strip()
        
        return content
    
    def _postprocess_content(self, content: str) -> str:
        """后处理优化结果"""
        if not content:
            return ""
        
        # 清理AI可能添加的多余说明
        lines = content.split('\n')
        filtered_lines = []
        
        for line in lines:
            line = line.strip()
            # 跳过AI添加的说明性文字
            if line.startswith('优化后的内容：') or line.startswith('以下是优化后的内容：'):
                continue
            if line.startswith('根据您的要求') or line.startswith('这是优化后的版本'):
                continue
            filtered_lines.append(line)
        
        # 重新组合内容
        result = '\n'.join(filtered_lines).strip()
        
        # 清理多余的空行
        result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
        
        return result
    
    def _generate_optimization_report(self, original: str, optimized: str, optimization_type: str) -> Dict[str, Any]:
        """生成优化报告"""
        original_length = len(original)
        optimized_length = len(optimized)
        
        # 简单的变化检测
        changes_detected = original != optimized
        
        # 计算大概的改动数量 - 基于字符差异的简单估算
        import difflib
        diff = list(difflib.unified_diff(
            original.splitlines(keepends=True),
            optimized.splitlines(keepends=True),
            n=0
        ))
        # 过滤掉标题行，计算实际变更行数
        changes_count = len([line for line in diff if line.startswith('+') or line.startswith('-')]) // 2
        if changes_count == 0 and changes_detected:
            changes_count = 1  # 至少有一处改动
        
        # 计算大概的改动数量
        original_words = len(original.split())
        optimized_words = len(optimized.split())        
        return {
            'optimization_type': optimization_type,
            'original_length': original_length,
            'optimized_length': optimized_length,
            'length_change': optimized_length - original_length,
            'original_words': original_words,
            'optimized_words': optimized_words,
            'word_change': optimized_words - original_words,
            'changes_detected': changes_detected,
            'changes_count': changes_count,  # 添加前端需要的字段
            'improvements': self._get_improvement_areas(optimization_type)
        }
    
    def _get_improvement_areas(self, optimization_type: str) -> list:
        """获取改进领域说明"""
        improvement_map = {
            'grammar': ['语法修正', '拼写检查', '句式优化'],
            'structure': ['内容重组', '逻辑优化', '段落调整'],
            'clarity': ['表达简化', '冗余删除', '清晰度提升'],
            'markdown': ['格式规范', '语法标准化', '排版优化'],
            'general': ['综合优化', '全面提升', '整体改进']
        }
        
        return improvement_map.get(optimization_type, ['内容优化'])

# 创建全局服务实例
ai_service = AIOptimizationService()
