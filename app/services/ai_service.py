"""
AI服务 - 使用LangChain和Qwen模型进行笔记优化
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

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QwenLLM(LLM):
    """
    自定义Qwen LLM类，继承自LangChain的LLM基类
    """
    model_name: str = "qwen-turbo"
    temperature: float = 0.7
    max_tokens: int = 2000
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
    AI优化服务类
    """
    
    def __init__(self):
        self.llm = QwenLLM()
        self._setup_chains()
    
    def _setup_chains(self):
        """设置LangChain chains"""
        
        # 内容优化提示模板
        self.content_optimization_template = PromptTemplate(
            input_variables=["content", "optimization_type"],
            template="""
你是一个专业的文档编辑助手。请根据以下要求优化用户的笔记内容：

优化类型：{optimization_type}

原始内容：
{content}

请按照以下要求进行优化：

1. 如果优化类型是"grammar"（语法优化）：
   - 修正语法错误和拼写错误
   - 改善句子结构和表达
   - 保持原始意思不变

2. 如果优化类型是"structure"（结构优化）：
   - 重新组织内容结构
   - 添加适当的标题和分段
   - 改善逻辑流畅性

3. 如果优化类型是"clarity"（清晰度优化）：
   - 简化复杂句子
   - 去除冗余内容
   - 增强表达清晰度

4. 如果优化类型是"markdown"（格式优化）：
   - 规范markdown语法
   - 统一格式风格
   - 优化排版效果

5. 如果优化类型是"general"（综合优化）：
   - 综合应用以上所有优化策略

重要要求：
- 保持原始内容的核心信息和意思
- 保持markdown格式语法正确
- 输出结果应该是纯markdown格式
- 不要添加额外的解释说明，直接输出优化后的内容

优化后的内容：
"""
        )
        
        # 内容摘要提示模板
        self.content_summary_template = PromptTemplate(
            input_variables=["content"],
            template="""
请为以下笔记内容生成一个简洁的摘要，突出关键点：

内容：
{content}

请生成：
1. 主要主题（1-2句话）
2. 关键要点（3-5个要点）
3. 建议的改进方向（可选）

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
            
            # 预处理内容
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
