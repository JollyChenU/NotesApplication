#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试精细化内容解析逻辑 - 每个标题和段落都是独立的block
"""

import re

def _remove_metadata_header(content):
    """
    移除文件头部的元数据
    """
    lines = content.split('\n')
    content_start = 0
    
    # 只有当 "---" 出现在文件开头的前几行时才认为是元数据分隔符
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
    
    result = '\n'.join(lines[content_start:]).strip()
    return result

def _parse_optimized_content_fine_grained(content):
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
    
    content = _remove_metadata_header(content)
    
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
    
    return cleaned_blocks

def test_fine_grained_parsing():
    """测试精细化内容解析功能"""
    
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
    print("测试精细化AI内容解析（每个标题和段落独立）")
    print("=" * 80)
    
    print("\n测试精细化解析方法:")
    parsed_blocks = _parse_optimized_content_fine_grained(optimized_content)
    
    print(f"\n解析结果:")
    print(f"总共解析出 {len(parsed_blocks)} 个笔记块")
    
    for i, block in enumerate(parsed_blocks):
        print(f"\n--- Block {i+1} (长度: {len(block)}) ---")
        
        # 判断block类型
        block_type = "段落"
        if block.startswith('#'):
            level = len(block) - len(block.lstrip('#'))
            block_type = f"H{level}标题"
        elif block == '---':
            block_type = "分隔符"
        elif block.startswith('- ') or block.startswith('* '):
            block_type = "列表"
        elif block.startswith('```'):
            block_type = "代码块"
        
        print(f"类型: {block_type}")
        
        # 显示内容（限制长度）
        if len(block) <= 150:
            print(f"内容: {block}")
        else:
            preview = block[:150] + "..."
            print(f"内容: {preview}")
        
        # 检查是否包含第一节的标题
        if "CoT（Chain of Thought，思维链）概述" in block:
            print("✅ 这是第一节标题")
    
    print("\n检查第一节是否丢失:")
    first_section_found = any("CoT（Chain of Thought，思维链）概述" in block for block in parsed_blocks)
    if first_section_found:
        print("✅ 第一节内容已保留")
    else:
        print("❌ 第一节内容丢失！")
    
    print(f"\n总结:")
    print(f"- 标题块数量: {len([b for b in parsed_blocks if b.startswith('#')])}")
    print(f"- 段落块数量: {len([b for b in parsed_blocks if not b.startswith('#') and b != '---'])}")
    print(f"- 分隔符块数量: {len([b for b in parsed_blocks if b == '---'])}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_fine_grained_parsing()
