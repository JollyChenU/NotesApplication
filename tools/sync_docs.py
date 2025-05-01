#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright 2025 Jolly Chen
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
文档同步工具 (Document Synchronization Tool)

这个脚本用于自动同步中英文文档。它监控指定目录下的README和CHANGELOG文件的变更，
并自动同步更新对应的中文、英文和双语版本。

主要功能：
- 监控README.md、README_CN.md、README_EN.md等文件的变更
- 自动提取和同步中英文内容
- 支持双语文档的分离与合并
- 支持CHANGELOG的同步更新

使用方法：
1. 确保已安装所需依赖：watchdog
2. 运行脚本：python sync_docs.py
3. 脚本会自动监控当前目录下的文档变更并进行同步

注意事项：
- 双语文档中，中英文内容应该逐行对应
- 程序通过检测中文字符来区分中英文内容
- 支持的文件类型：README.md、CHANGELOG.md及其对应的中英文版本

作者: Jolly
版本: 1.0.1
日期: 2025-03-01
许可证: Apache-2.0
"""

import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ReadmeSyncHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_modified = 0
        self.readme_files = {
            'README.md': {'type': 'bilingual'},
            'README_CN.md': {'type': 'chinese'},
            'README_EN.md': {'type': 'english'},
            'CHANGELOG.md': {'type': 'bilingual'},
            'CHANGELOG_CN.md': {'type': 'chinese'},
            'CHANGELOG_EN.md': {'type': 'english'}
        }

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(tuple(self.readme_files.keys())):
            current_time = time.time()
            if current_time - self.last_modified > 1:  # 防抖
                self.last_modified = current_time
                print(f"\n检测到文件变化: {event.src_path}\nFile change detected: {event.src_path}")
                self.sync_readme_files(event.src_path)

    def sync_readme_files(self, modified_file):
        try:
            print(f"开始同步文件...\nStarting file synchronization...")
            # 读取修改的文件
            with open(modified_file, 'r', encoding='utf-8') as f:
                content = f.read()

            base_name = os.path.basename(modified_file)
            file_type = self.readme_files[base_name]['type']
            print(f"处理文件类型: {file_type}\nProcessing file type: {file_type}")

            # 根据文件类型处理内容
            if file_type == 'bilingual':
                print("提取双语文件的中英文内容...\nExtracting English and Chinese content from bilingual file...")
                en_content = self.extract_english_content(content)
                cn_content = self.extract_chinese_content(content)
            elif file_type == 'chinese':
                print("使用中文内容并读取英文文件...\nUsing Chinese content and reading English file...")
                cn_content = content
                with open(os.path.join(os.path.dirname(modified_file), 'README_EN.md'), 'r', encoding='utf-8') as f:
                    en_content = f.read()
            else:  # english
                print("使用英文内容并读取中文文件...\nUsing English content and reading Chinese file...")
                en_content = content
                with open(os.path.join(os.path.dirname(modified_file), 'README_CN.md'), 'r', encoding='utf-8') as f:
                    cn_content = f.read()

            # 更新所有文件
            print("开始更新所有相关文件...\nStarting to update all related files...")
            self.update_files(modified_file, en_content, cn_content)
            print("文件同步完成！\nFile synchronization completed!")

        except Exception as e:
            print(f"同步文件时发生错误: {str(e)}\nError syncing files: {str(e)}")

    def extract_english_content(self, content):
        # 提取英文内容（移除中文部分）
        lines = content.split('\n')
        en_lines = []
        skip_next = False

        for line in lines:
            if skip_next:
                skip_next = False
                continue
            if any('\u4e00' <= char <= '\u9fff' for char in line):
                skip_next = True
                continue
            en_lines.append(line)

        return '\n'.join(en_lines)

    def extract_chinese_content(self, content):
        # 提取中文内容
        lines = content.split('\n')
        cn_lines = []
        include_next = False

        for line in lines:
            if any('\u4e00' <= char <= '\u9fff' for char in line):
                cn_lines.append(line)
                include_next = True
            elif include_next:
                cn_lines.append(line)
                include_next = False

        return '\n'.join(cn_lines)

    def update_files(self, modified_file, en_content, cn_content):
        base_dir = os.path.dirname(modified_file)

        # 更新英文版本
        if not modified_file.endswith('README_EN.md'):
            print("更新英文版本...\nUpdating English version...")
            with open(os.path.join(base_dir, 'README_EN.md'), 'w', encoding='utf-8') as f:
                f.write(en_content)

        # 更新中文版本
        if not modified_file.endswith('README_CN.md'):
            print("更新中文版本...\nUpdating Chinese version...")
            with open(os.path.join(base_dir, 'README_CN.md'), 'w', encoding='utf-8') as f:
                f.write(cn_content)

        # 更新双语版本
        if not modified_file.endswith('README.md'):
            print("更新双语版本...\nUpdating bilingual version...")
            combined_content = []
            en_lines = en_content.split('\n')
            cn_lines = cn_content.split('\n')
            
            i = 0
            while i < len(en_lines):
                combined_content.append(en_lines[i])
                if i < len(cn_lines):
                    combined_content.append(cn_lines[i])
                i += 1

            with open(os.path.join(base_dir, 'README.md'), 'w', encoding='utf-8') as f:
                f.write('\n'.join(combined_content))

def main():
    path = os.path.dirname(os.path.abspath(__file__))
    event_handler = ReadmeSyncHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    observer.start()

    try:
        print(f"开始监控README文件变化...\nMonitoring README files for changes...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n停止监控\nMonitoring stopped")
    
    observer.join()

if __name__ == "__main__":
    main()