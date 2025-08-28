// 简单的模块导入测试
import React from 'react';

// 测试各个模块的导入
async function testModuleImports() {
  try {
    console.log('🔍 开始测试模块导入...');
    
    // 测试日志模块
    const loggerModule = await import('./src/utils/dnd/dnd-logger.js');
    console.log('✅ Logger模块导入成功:', Object.keys(loggerModule));
    
    // 测试辅助函数模块
    const helpersModule = await import('./src/utils/dnd/dnd-helpers.js');
    console.log('✅ Helpers模块导入成功:', Object.keys(helpersModule));
    
    // 测试可排序项模块
    const sortableModule = await import('./src/utils/dnd/dnd-sortable.jsx');
    console.log('✅ Sortable模块导入成功:', Object.keys(sortableModule));
    
    // 测试笔记拖拽模块
    const noteContextModule = await import('./src/utils/dnd/dnd-note-context.jsx');
    console.log('✅ NoteContext模块导入成功:', Object.keys(noteContextModule));
    
    // 测试文件拖拽模块
    const fileContextModule = await import('./src/utils/dnd/dnd-file-context.jsx');
    console.log('✅ FileContext模块导入成功:', Object.keys(fileContextModule));
    
    // 测试主入口模块
    const indexModule = await import('./src/utils/dnd/index.js');
    console.log('✅ Index模块导入成功:', Object.keys(indexModule));
    
    // 测试向后兼容模块
    const backCompatModule = await import('./src/utils/dnd-utils.jsx');
    console.log('✅ 向后兼容模块导入成功:', Object.keys(backCompatModule));
    
    console.log('🎉 所有模块导入测试完成!');
    
  } catch (error) {
    console.error('❌ 模块导入测试失败:', error);
  }
}

// 创建一个简单的测试组件
function ModuleTestComponent() {
  React.useEffect(() => {
    testModuleImports();
  }, []);
  
  return React.createElement('div', { 
    style: { padding: '20px', fontFamily: 'monospace' }
  }, [
    React.createElement('h1', { key: 'title' }, '🧪 DnD 模块导入测试'),
    React.createElement('p', { key: 'desc' }, '请查看浏览器控制台输出'),
    React.createElement('div', { 
      key: 'status',
      style: { 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd' 
      }
    }, '测试正在运行，请查看控制台...')
  ]);
}

export default ModuleTestComponent;
