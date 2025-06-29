#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
实际测试AI优化流程，并检查数据库结果
"""

import requests
import json
import sqlite3

# 测试内容 - 你提供的"AI优化预览内容"
test_content = """## CoT（Chain of Thought，思维链）概述

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

def test_ai_optimization_api():
    """测试实际的AI优化API调用"""
    
    print("=" * 80)
    print("测试AI优化API调用和数据库存储")
    print("=" * 80)
    
    # 1. 检查服务器状态
    try:
        health_response = requests.get("http://localhost:5000/api/health")
        print(f"✅ 服务器健康状态: {health_response.status_code}")
    except:
        print("❌ 服务器未启动，请先启动后端服务器")
        return
    
    # 2. 获取文件列表
    try:
        files_response = requests.get("http://localhost:5000/api/files")
        files_data = files_response.json()
        print(f"✅ 获取文件列表成功，共{len(files_data)}个文件")
        
        if not files_data:
            print("❌ 没有可用的文件进行测试")
            return
            
        file_id = files_data[0]['id']
        print(f"📁 使用文件ID: {file_id}")
        
    except Exception as e:
        print(f"❌ 获取文件列表失败: {e}")
        return
    
    # 3. 获取优化前的笔记数量
    try:
        notes_response = requests.get(f"http://localhost:5000/api/files/{file_id}/notes")
        original_notes = notes_response.json()
        print(f"📝 优化前笔记数量: {len(original_notes)}")
        
        # 显示前几个笔记的内容
        for i, note in enumerate(original_notes[:3]):
            print(f"   笔记{i+1} (order={note.get('order', 'N/A')}): {note['content'][:50]}...")
            
    except Exception as e:
        print(f"❌ 获取原始笔记失败: {e}")
        return
    
    # 4. 调用AI优化API
    print(f"\n🤖 开始调用AI优化API...")
    try:
        apply_response = requests.post(
            f"http://localhost:5000/api/ai/apply-optimization",
            headers={'Content-Type': 'application/json'},
            json={
                'file_id': file_id,
                'optimized_content': test_content,
                'backup_original': True
            }
        )
        
        if apply_response.status_code != 200:
            print(f"❌ AI优化API调用失败: {apply_response.status_code}")
            print(f"响应内容: {apply_response.text}")
            return
            
        apply_result = apply_response.json()
        print(f"✅ AI优化API调用成功")
        print(f"   原始笔记数: {apply_result.get('original_notes_count', 'N/A')}")
        print(f"   新笔记数: {apply_result.get('new_notes_count', 'N/A')}")
        
    except Exception as e:
        print(f"❌ AI优化API调用异常: {e}")
        return
    
    # 5. 检查优化后的笔记
    try:
        new_notes_response = requests.get(f"http://localhost:5000/api/files/{file_id}/notes")
        new_notes = new_notes_response.json()
        print(f"\n📝 优化后笔记数量: {len(new_notes)}")
        
        # 检查第一节是否存在
        first_section_found = False
        for i, note in enumerate(new_notes):
            content = note['content']
            order = note.get('order', 'N/A')
            print(f"   笔记{i+1} (order={order}): {content[:50]}...")
            
            if "CoT（Chain of Thought，思维链）概述" in content:
                first_section_found = True
                print(f"   ✅ 找到第一节标题在笔记{i+1}")
        
        if not first_section_found:
            print("   ❌ 第一节标题丢失！")
        
    except Exception as e:
        print(f"❌ 获取优化后笔记失败: {e}")
        return
    
    # 6. 直接查询数据库
    print(f"\n🗄️ 直接查询数据库...")
    try:
        conn = sqlite3.connect('notes.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, substr(content, 1, 100), [order] 
            FROM notes 
            WHERE file_id = ? 
            ORDER BY [order]
        """, (file_id,))
        
        db_notes = cursor.fetchall()
        print(f"数据库中的笔记数量: {len(db_notes)}")
        
        db_first_section_found = False
        for note_id, content, order in db_notes:
            print(f"   ID={note_id}, order={order}: {content}...")
            if "CoT（Chain of Thought，思维链）概述" in content:
                db_first_section_found = True
                print(f"   ✅ 数据库中找到第一节标题 (ID={note_id}, order={order})")
        
        if not db_first_section_found:
            print("   ❌ 数据库中第一节标题丢失！")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 数据库查询失败: {e}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_ai_optimization_api()
