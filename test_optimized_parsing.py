#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试优化后的内容解析逻辑
"""

import re

def _remove_metadata_header(content):
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
    return result

def _parse_optimized_content_v2(content):
    """
    优化版本：按照 markdown 结构进行智能分割，保持逻辑完整性。
    """
    if not content:
        return []
    
    content = _remove_metadata_header(content)
    
    # 优化分割策略：
    # 1. 按照 markdown 分隔符（---）分割主要章节
    # 2. 在每个章节内，按照二级标题（##）分割
    # 3. 过滤掉单独的分隔符行
    
    # 首先按 --- 分割大章节
    major_sections = re.split(r'\n\s*---\s*\n', content)
    
    notes = []
    for section in major_sections:
        section = section.strip()
        if not section or section == '---':
            continue
            
        # 在每个大章节内，按二级标题（##）进一步分割
        # 但保持三级标题（###）及以下内容与其父级在一起
        subsections = re.split(r'\n(?=## )', section)
        
        for subsection in subsections:
            subsection = subsection.strip()
            if subsection:
                notes.append(subsection)
    
    # 如果没有找到合适的分割点，回退到原有的按空行分割策略
    if not notes:
        blocks = re.split(r'\n\s*\n+', content)
        notes = [block.strip() for block in blocks if block.strip()]
    
    # 添加调试信息
    print(f"DEBUG: 解析内容分割后得到 {len(notes)} 个笔记块")
    for i, note in enumerate(notes):
        preview = note[:100].replace('\n', '\\n')
        print(f"DEBUG: 笔记块 {i+1}: {preview}...")
    
    return notes

def test_optimized_parsing():
    """测试优化后的内容解析功能"""
    
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
    print("测试优化后的AI内容解析")
    print("=" * 80)
    
    print("\n测试优化版 _parse_optimized_content_v2 方法:")
    parsed_notes = _parse_optimized_content_v2(optimized_content)
    
    print(f"\n解析结果:")
    print(f"总共解析出 {len(parsed_notes)} 个笔记块")
    
    for i, note in enumerate(parsed_notes):
        print(f"\n--- 笔记块 {i+1} (长度: {len(note)}) ---")
        # 显示前200个字符以便更好地查看内容
        preview = note[:200]
        if len(note) > 200:
            preview += "..."
        print(f"内容: {preview}")
        
        # 检查是否包含第一节的标题
        if "CoT（Chain of Thought，思维链）概述" in note:
            print("✅ 包含第一节标题")
    
    print("\n检查第一节是否丢失:")
    first_section_found = any("CoT（Chain of Thought，思维链）概述" in note for note in parsed_notes)
    if first_section_found:
        print("✅ 第一节内容已保留")
    else:
        print("❌ 第一节内容丢失！")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_optimized_parsing()
