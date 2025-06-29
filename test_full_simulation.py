#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
完整模拟AI优化流程的测试
"""

import re
import datetime

def _remove_metadata_header(content):
    """
    移除文件头部的元数据 - 模拟后端逻辑
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
                print(f"DEBUG: 检测到真正的元数据分隔符，跳过前 {content_start} 行")
                break
    
    if content_start == 0:
        print("DEBUG: 未检测到元数据分隔符，保留全部内容")
    
    result = '\n'.join(lines[content_start:]).strip()
    return result

def _parse_optimized_content(content):
    """
    精细化解析：每个标题和段落都是独立的block - 模拟后端逻辑
    """
    if not content:
        return []
    
    print(f"DEBUG: 开始解析，输入内容长度: {len(content)}")
    print(f"DEBUG: 内容开头: {repr(content[:100])}")
    
    content = _remove_metadata_header(content)
    
    print(f"DEBUG: 移除元数据后，内容长度: {len(content)}")
    print(f"DEBUG: 移除元数据后内容开头: {repr(content[:100])}")
    
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
    
    print(f"DEBUG: 精细化解析后得到 {len(cleaned_blocks)} 个笔记块")
    
    return cleaned_blocks

def simulate_apply_optimization(optimized_content):
    """
    模拟完整的apply_optimization流程
    """
    print("=" * 80)
    print("模拟AI优化应用流程")
    print("=" * 80)
    
    print("\n1. 原始优化内容:")
    print(f"长度: {len(optimized_content)}")
    print(f"开头: {optimized_content[:200]}...")
    
    print("\n2. 开始解析...")
    parsed_blocks = _parse_optimized_content(optimized_content)
    
    print(f"\n3. 解析结果:")
    print(f"总共得到 {len(parsed_blocks)} 个笔记块")
    
    # 模拟创建Note对象的过程
    notes = []
    for i, block_content in enumerate(parsed_blocks):
        if block_content.strip():  # 只创建非空笔记
            note = {
                'content': block_content,
                'order': i,
                'format': 'text',
                'created_at': datetime.datetime.utcnow(),
                'updated_at': datetime.datetime.utcnow()
            }
            notes.append(note)
    
    print(f"\n4. 创建的笔记:")
    for i, note in enumerate(notes):
        print(f"\n--- 笔记 {i+1} (order: {note['order']}) ---")
        print(f"内容长度: {len(note['content'])}")
        preview = note['content'][:100].replace('\n', '\\n')
        if len(note['content']) > 100:
            preview += "..."
        print(f"内容预览: {preview}")
        
        # 检查第一节标题
        if "CoT（Chain of Thought，思维链）概述" in note['content']:
            print("✅ 包含第一节标题")
    
    print(f"\n5. 检查第一节是否丢失:")
    first_section_found = any("CoT（Chain of Thought，思维链）概述" in note['content'] for note in notes)
    if first_section_found:
        print("✅ 第一节内容已保留")
    else:
        print("❌ 第一节内容丢失！")
        
        # 详细分析第一个笔记
        if notes:
            print(f"\n第一个笔记的完整内容:")
            print(f"'{notes[0]['content']}'")
    
    # 模拟最终返回给前端的内容
    final_content = []
    for note in notes:
        final_content.append(note['content'])
    
    return final_content

def test_with_your_content():
    """使用你提供的具体内容进行测试"""
    
    # 你提供的"优化预览内容"
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

    result = simulate_apply_optimization(optimized_content)
    
    print(f"\n6. 最终模拟结果:")
    print(f"应该显示给用户的内容块数: {len(result)}")
    
    # 模拟用户看到的最终内容
    final_display = '\n\n'.join(result)
    print(f"\n7. 用户最终看到的内容:")
    print(f"长度: {len(final_display)}")
    print(f"开头: {final_display[:200]}...")
    
    # 最终检查
    if "CoT（Chain of Thought，思维链）概述" in final_display:
        print("\n✅ 最终检查：第一节在用户界面中可见")
    else:
        print("\n❌ 最终检查：第一节在用户界面中丢失！")

if __name__ == "__main__":
    test_with_your_content()
