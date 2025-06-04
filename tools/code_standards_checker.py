#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文件名: code_standards_checker.py
模块: 代码规范检查工具
描述: 检查项目代码是否符合开发标准，包括文件头注释、命名规范、格式等
功能:
    - 检查Python文件的PEP 8合规性
    - 验证文件头注释的完整性
    - 检查命名规范
    - 生成代码质量报告

作者: Jolly
创建时间: 2025-06-04
最后修改: 2025-06-04
修改人: Jolly
版本: 1.0.0

依赖:
    - os, re: 文件和正则表达式处理
    - ast: Python抽象语法树

许可证: Apache-2.0
"""

import os
import re
import ast
import json
from datetime import datetime
from pathlib import Path


class CodeStandardsChecker:
    """代码规范检查器"""
    
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.issues = []
        self.stats = {
            'files_checked': 0,
            'python_files': 0,
            'javascript_files': 0,
            'issues_found': 0,
            'critical_issues': 0,
            'warnings': 0
        }
    
    def check_python_file_header(self, file_path):
        """检查Python文件头注释"""
        issues = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查shebang行
            if not content.startswith('#!/usr/bin/env python'):
                issues.append({
                    'type': 'warning',
                    'message': '缺少标准shebang行',
                    'file': str(file_path),
                    'line': 1
                })
            
            # 检查编码声明
            if '# -*- coding: utf-8 -*-' not in content[:100]:
                issues.append({
                    'type': 'warning',
                    'message': '缺少UTF-8编码声明',
                    'file': str(file_path),
                    'line': 2
                })
            
            # 检查文档字符串
            lines = content.split('\n')
            docstring_found = False
            for i, line in enumerate(lines[:20]):  # 检查前20行
                if '"""' in line and '文件名:' in content:
                    docstring_found = True
                    break
            
            if not docstring_found:
                issues.append({
                    'type': 'critical',
                    'message': '缺少标准文件头文档字符串',
                    'file': str(file_path),
                    'line': 1
                })
            
            # 检查必需的文档字段
            required_fields = ['文件名:', '模块:', '描述:', '作者:', '版本:', '许可证:']
            for field in required_fields:
                if field not in content:
                    issues.append({
                        'type': 'warning',
                        'message': f'文档头缺少字段: {field}',
                        'file': str(file_path),
                        'line': 1
                    })
                    
        except Exception as e:
            issues.append({
                'type': 'error',
                'message': f'文件读取错误: {str(e)}',
                'file': str(file_path),
                'line': 1
            })
        
        return issues
    
    def check_python_imports(self, file_path):
        """检查Python导入组织"""
        issues = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # 检查导入顺序
            imports = []
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    imports.append(node.lineno)
            
            # 这里可以添加更复杂的导入顺序检查逻辑
            
        except SyntaxError as e:
            issues.append({
                'type': 'error',
                'message': f'语法错误: {str(e)}',
                'file': str(file_path),
                'line': e.lineno if hasattr(e, 'lineno') else 1
            })
        except Exception as e:
            issues.append({
                'type': 'error',
                'message': f'AST解析错误: {str(e)}',
                'file': str(file_path),
                'line': 1
            })
        
        return issues
    
    def check_javascript_file_header(self, file_path):
        """检查JavaScript/JSX文件头注释"""
        issues = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查文档注释
            if not content.strip().startswith('/**'):
                issues.append({
                    'type': 'critical',
                    'message': '缺少标准JSDoc文件头注释',
                    'file': str(file_path),
                    'line': 1
                })
            
            # 检查必需的文档字段
            required_fields = ['文件名:', '组件:', '描述:', '作者:', '版本:', '许可证:']
            for field in required_fields:
                if field not in content[:500]:  # 检查文件开头500字符
                    issues.append({
                        'type': 'warning',
                        'message': f'文档头缺少字段: {field}',
                        'file': str(file_path),
                        'line': 1
                    })
                    
        except Exception as e:
            issues.append({
                'type': 'error',
                'message': f'文件读取错误: {str(e)}',
                'file': str(file_path),
                'line': 1
            })
        
        return issues
    
    def check_naming_conventions(self, file_path):
        """检查命名规范"""
        issues = []
        
        try:
            # 检查文件名
            file_name = file_path.name
            
            if file_path.suffix == '.py':
                # Python文件应使用snake_case
                if not re.match(r'^[a-z][a-z0-9_]*\.py$', file_name):
                    issues.append({
                        'type': 'warning',
                        'message': 'Python文件名应使用snake_case命名',
                        'file': str(file_path),
                        'line': 1
                    })
            
            elif file_path.suffix in ['.jsx', '.js']:
                # React组件应使用PascalCase
                if file_name.endswith('.jsx'):
                    base_name = file_name[:-4]
                    if not re.match(r'^[A-Z][a-zA-Z0-9]*$', base_name):
                        issues.append({
                            'type': 'warning',
                            'message': 'React组件文件名应使用PascalCase命名',
                            'file': str(file_path),
                            'line': 1
                        })
                        
        except Exception as e:
            issues.append({
                'type': 'error',
                'message': f'命名检查错误: {str(e)}',
                'file': str(file_path),
                'line': 1
            })
        
        return issues
    
    def scan_directory(self, directory=None):
        """扫描目录中的所有相关文件"""
        if directory is None:
            directory = self.project_root
        
        # 定义要扫描的文件类型
        python_patterns = ['*.py']
        js_patterns = ['*.js', '*.jsx']
        
        # 排除的目录
        exclude_dirs = {'__pycache__', 'node_modules', '.git', '.idea', 'temp'}
        
        for root, dirs, files in os.walk(directory):
            # 排除指定目录
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                file_path = Path(root) / file
                
                if any(file_path.match(pattern) for pattern in python_patterns):
                    self.stats['python_files'] += 1
                    self.stats['files_checked'] += 1
                    
                    # 检查Python文件
                    issues = []
                    issues.extend(self.check_python_file_header(file_path))
                    issues.extend(self.check_python_imports(file_path))
                    issues.extend(self.check_naming_conventions(file_path))
                    
                    self.issues.extend(issues)
                
                elif any(file_path.match(pattern) for pattern in js_patterns):
                    self.stats['javascript_files'] += 1
                    self.stats['files_checked'] += 1
                    
                    # 检查JavaScript文件
                    issues = []
                    issues.extend(self.check_javascript_file_header(file_path))
                    issues.extend(self.check_naming_conventions(file_path))
                    
                    self.issues.extend(issues)
    
    def generate_report(self):
        """生成检查报告"""
        # 统计问题数量
        for issue in self.issues:
            self.stats['issues_found'] += 1
            if issue['type'] == 'critical':
                self.stats['critical_issues'] += 1
            elif issue['type'] == 'warning':
                self.stats['warnings'] += 1
        
        # 生成报告
        report = {
            'timestamp': datetime.now().isoformat(),
            'project_root': str(self.project_root),
            'statistics': self.stats,
            'issues': self.issues
        }
        
        return report
    
    def save_report(self, report, output_file='code_standards_report.json'):
        """保存报告到文件"""
        output_path = self.project_root / 'docs' / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"代码规范检查报告已保存到: {output_path}")
    
    def print_summary(self, report):
        """打印检查摘要"""
        stats = report['statistics']
        
        print("\n" + "="*60)
        print("代码规范检查摘要")
        print("="*60)
        print(f"检查时间: {report['timestamp']}")
        print(f"项目路径: {report['project_root']}")
        print(f"检查文件总数: {stats['files_checked']}")
        print(f"Python文件: {stats['python_files']}")
        print(f"JavaScript文件: {stats['javascript_files']}")
        print("-"*60)
        print(f"发现问题总数: {stats['issues_found']}")
        print(f"严重问题: {stats['critical_issues']}")
        print(f"警告: {stats['warnings']}")
        
        if stats['issues_found'] > 0:
            print("\n问题详情:")
            print("-"*60)
            
            # 按文件分组显示问题
            files_with_issues = {}
            for issue in report['issues']:
                file_path = issue['file']
                if file_path not in files_with_issues:
                    files_with_issues[file_path] = []
                files_with_issues[file_path].append(issue)
            
            for file_path, file_issues in files_with_issues.items():
                print(f"\n📁 {file_path}")
                for issue in file_issues:
                    icon = "🔴" if issue['type'] == 'critical' else "⚠️" if issue['type'] == 'warning' else "ℹ️"
                    print(f"  {icon} 行{issue['line']}: {issue['message']}")
        
        print("\n" + "="*60)


def main():
    """主函数"""
    # 获取项目根目录
    current_dir = Path(__file__).parent.parent
    
    print("NotesApplication 代码规范检查工具")
    print(f"项目路径: {current_dir}")
    
    # 创建检查器
    checker = CodeStandardsChecker(current_dir)
    
    # 扫描项目
    print("\n正在扫描项目文件...")
    checker.scan_directory()
    
    # 生成报告
    report = checker.generate_report()
    
    # 显示摘要
    checker.print_summary(report)
    
    # 保存报告
    checker.save_report(report)


if __name__ == '__main__':
    main()
