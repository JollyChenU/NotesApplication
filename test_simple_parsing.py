#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
简化版内容解析测试
"""

import re

def _remove_metadata_header(content):
    """
    移除文本开头的元数据头部（如果存在）
    
    Args:
        content (str): 原始内容
        
    Returns:
        str: 移除元数据头部后的内容
    """
    print(f"Debug: _remove_metadata_header 输入内容长度: {len(content)}")
    print(f"Debug: 内容开头: {repr(content[:100])}")
    
    lines = content.strip().split('\n')
    
    # 检查是否存在YAML风格的元数据头
    # 只有在文件开头（前5行内）出现 --- 且前面有包含冒号的行时才认为是元数据
    has_yaml_metadata = False
    yaml_end_line = -1
    
    # 检查前5行是否有包含冒号的行（YAML键值对的特征）
    yaml_like_lines = 0
    for i, line in enumerate(lines[:5]):
        if ':' in line and not line.strip().startswith('#'):
            yaml_like_lines += 1
    
    # 如果前5行中有YAML风格的行，再检查是否有 --- 分隔符
    if yaml_like_lines > 0:
        for i, line in enumerate(lines[:10]):  # 检查前10行
            if line.strip() == '---' and i > 0:  # 不是第一行的 ---
                has_yaml_metadata = True
                yaml_end_line = i
                print(f"Debug: 发现YAML元数据分隔符在第{i+1}行")
                break
    
    if has_yaml_metadata and yaml_end_line > 0:
        # 移除元数据头部（包括结束的 --- 行）
        remaining_lines = lines[yaml_end_line + 1:]
        result = '\n'.join(remaining_lines)
        print(f"Debug: 移除了元数据头部，剩余内容长度: {len(result)}")
        return result
    else:
        print("Debug: 未发现YAML元数据头部，返回原内容")
        return content

def _parse_optimized_content(content):
    """
    解析优化后的内容为笔记块
    
    Args:
        content (str): 优化后的内容
        
    Returns:
        list: 笔记块列表
    """
    print(f"Debug: _parse_optimized_content 输入内容长度: {len(content)}")
    
    # 首先移除可能的元数据头部
    cleaned_content = _remove_metadata_header(content)
    print(f"Debug: 清理后内容长度: {len(cleaned_content)}")
    
    if not cleaned_content.strip():
        print("Debug: 清理后内容为空")
        return []
    
    # 使用更安全的分割方式：按照两个或多个连续换行分割
    # 这样可以保持段落结构，同时避免误分割
    notes = re.split(r'\n\s*\n+', cleaned_content.strip())
    
    # 过滤空白笔记
    notes = [note.strip() for note in notes if note.strip()]
    
    print(f"Debug: 解析出 {len(notes)} 个笔记块")
    for i, note in enumerate(notes):
        print(f"Debug: 笔记块 {i+1} 长度: {len(note)}, 开头: {repr(note[:50])}")
    
    return notes

def test_content_parsing():
    """测试内容解析功能"""
    
    # 你提供的AI优化预览内容
    optimized_content = """## CoT（Chain of Thought，思维链）概述

CoT（Chain of Thought，思维链）是一种用于增强大型语言模型（LLM）推理能力的技术，通过生成中间逻辑步骤来模拟人类解决复杂问题的思维过程。其核心在于将复杂任务分解为一系列连贯的子步骤，最终推导出答案，从而提升模型在数学、逻辑推理等任务中的表现。

### 核心特点

- **逻辑分解**：要求模型输出从问题到答案的完整推理链条，而非直接给出结果。例如，在数学题中分步展示计算过程。
- **多场景应用**：广泛应用于自然语言处理（NLP）、关系推理等领域，尤其在需要多步推导的任务中效果显著。
- **技术优势**：相比传统提示方法，CoT能更清晰地暴露模型的推理缺陷，便于调试优化，同时提升答案的可解释性。

此外，CoT在数学中也指代余切函数（cotangent），但在人工智能领域更常用其作为"思维链"的缩写。

---

## CoT在LLM中的实现方式

### 1. 提示设计（Prompting）

- **显式要求中间步骤**：在提示中明确要求模型输出从问题到答案的完整推理链条，而非直接给出结果。例如，在数学题中分步展示计算过程，或在逻辑推理中逐步分析条件。
- **示例引导**：通过提供带有详细推理步骤的示例（如Few-shot Learning），引导模型学习如何分解复杂任务。例如，给模型展示"问题→分步推理→答案"的样例，使其模仿生成类似的思维链。

### 2. 训练策略

- **监督微调（SFT）**：使用包含推理步骤的数据集对模型进行微调。例如，通过人工标注或自动生成的"问题-中间步骤-答案"三元组，训练模型生成连贯的推理路径。
- **强化学习**：结合奖励模型评估推理步骤的逻辑性和正确性，优化生成策略。例如，对生成的思维链质量（如步骤合理性、最终答案准确性）进行打分，并反馈至模型训练。

### 3. 模型架构扩展

- **多步解码**：将模型输出分为"推理阶段"和"答案阶段"，先生成中间步骤，再基于步骤推导结论。例如，先生成"假设A→验证B→排除C"的逻辑链，再输出最终答案。
- **思维树（ToT）与思维图（GoT）**：改进CoT的单一链式结构，引入分支决策（ToT）或循环依赖（GoT），支持更复杂的多路径推理。例如，在代码生成任务中，通过多分支尝试不同算法方案并选择最优解。

### 4. 优化与验证

- **自我一致性（Self-consistency）**：生成多个独立推理链，通过投票或交叉验证选择最一致的答案。例如，对同一问题生成3条不同的解法，选取多数相同的结论。
- **长链推理技术（Long CoT）**：针对需要深度推理的任务（如复杂数学证明），优化模型记忆和注意力机制，支持更长的推理步骤（如数百步）。

---

## 实现效果与挑战

### 优势

- CoT显著提升LLM在算术、逻辑、代码生成等任务上的准确性，并增强结果的可解释性。

### 局限性

- 对简单任务可能引入冗余计算，且依赖高质量的推理链数据。

---

## 总结

通过上述方法，CoT使LLM能够模拟人类解决复杂问题的思维过程，从而提升其推理能力和应用范围。"""

    print("=" * 80)
    print("测试AI优化内容解析")
    print("=" * 80)
    
    print("\n测试 _parse_optimized_content 方法:")
    parsed_notes = _parse_optimized_content(optimized_content)
    
    print(f"\n解析结果:")
    print(f"总共解析出 {len(parsed_notes)} 个笔记块")
    
    for i, note in enumerate(parsed_notes):
        print(f"\n--- 笔记块 {i+1} (长度: {len(note)}) ---")
        # 显示前100个字符
        preview = note[:100].replace('\n', '\\n')
        if len(note) > 100:
            preview += "..."
        print(f"内容预览: {preview}")
        
        # 检查是否包含第一节的标题
        if "CoT（Chain of Thought，思维链）概述" in note:
            print("✅ 包含第一节标题")
        else:
            print("❌ 不包含第一节标题")
    
    print("\n检查第一节是否丢失:")
    first_section_found = any("CoT（Chain of Thought，思维链）概述" in note for note in parsed_notes)
    if first_section_found:
        print("✅ 第一节内容已保留")
    else:
        print("❌ 第一节内容丢失！")
        
        # 如果第一节丢失，让我们检查第一个笔记块的内容
        if parsed_notes:
            print(f"\n第一个笔记块的完整内容:")
            print(f"'{parsed_notes[0]}'")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_content_parsing()
