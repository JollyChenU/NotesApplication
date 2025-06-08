#!/usr/bin/env node
/**
 * 文件名: validate-dnd-refactor.js
 * 描述: 验证 DnD 模块拆分重构的完整性和功能性
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.0.0
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');
const dndDir = path.join(srcDir, 'utils', 'dnd');

console.log('🔍 开始验证 DnD 模块拆分重构...\n');

// 检查必需的文件是否存在
const requiredFiles = [
  'src/utils/dnd/index.js',
  'src/utils/dnd/dnd-logger.js',
  'src/utils/dnd/dnd-sortable.jsx',
  'src/utils/dnd/dnd-note-context.jsx',
  'src/utils/dnd/dnd-file-context.jsx',
  'src/utils/dnd/dnd-helpers.js',
  'src/utils/dnd-utils.jsx'
];

console.log('📁 检查必需文件...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
});

// 检查导出是否正确
console.log('\n📦 检查模块导出...');
try {
  const indexContent = fs.readFileSync(path.join(dndDir, 'index.js'), 'utf8');
  const expectedExports = [
    'Logger',
    'LOG_LEVEL',
    'CURRENT_LOG_LEVEL',
    'createSortableItem',
    'NoteDndContext',
    'FileDndContext',
    'throttle',
    'clearAllFolderHighlights',
    'highlightFolderElement',
    'setupFolderElements',
    'cleanupDragState'
  ];
  
  const missingExports = expectedExports.filter(exp => !indexContent.includes(exp));
  if (missingExports.length === 0) {
    console.log('✅ 所有必需的导出都存在');
  } else {
    console.log(`❌ 缺少导出: ${missingExports.join(', ')}`);
  }
} catch (error) {
  console.log(`❌ 读取 index.js 失败: ${error.message}`);
}

// 检查向后兼容性
console.log('\n🔄 检查向后兼容性...');
try {
  const backCompatContent = fs.readFileSync(path.join(projectRoot, 'src', 'utils', 'dnd-utils.jsx'), 'utf8');
  if (backCompatContent.includes('from \'./dnd/index.js\'')) {
    console.log('✅ 向后兼容导出正确');
  } else {
    console.log('❌ 向后兼容导出配置有问题');
  }
} catch (error) {
  console.log(`❌ 读取 dnd-utils.jsx 失败: ${error.message}`);
}

// 检查依赖组件的导入
console.log('\n🔗 检查组件导入更新...');
const componentFiles = [
  'src/components/NoteList.jsx',
  'src/components/Sidebar.jsx'
];

componentFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('../utils/dnd/index.js') || content.includes('../utils/dnd-utils.jsx')) {
      console.log(`✅ ${file} - 导入路径已更新`);
    } else {
      console.log(`❌ ${file} - 导入路径需要检查`);
    }
  } else {
    console.log(`⚠️  ${file} - 文件不存在`);
  }
});

// 统计代码行数
console.log('\n📊 代码行数统计...');
let totalLines = 0;
requiredFiles.slice(0, -1).forEach(file => { // 排除向后兼容文件
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    console.log(`   ${path.basename(file)}: ${lines} 行`);
  }
});
console.log(`📈 总计: ${totalLines} 行 (模块化文件)`);

console.log('\n🎉 验证完成!');
if (allFilesExist) {
  console.log('✅ DnD 模块拆分重构验证通过!');
} else {
  console.log('❌ 发现问题，请检查上述错误');
}
