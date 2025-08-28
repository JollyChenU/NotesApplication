/**
 * 文件名: drag-performance-test.js
 * 组件: 拖拽性能自动化测试
 * 描述: 自动化测试拖拽功能的性能，模拟各种拖拽场景并收集性能数据
 * 功能: 自动拖拽测试、性能数据收集、报告生成
 * 作者: Jolly Chen
 * 时间: 2024-12-25
 * 版本: 1.0.0
 */

class DragPerformanceTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
    this.testScenarios = [
      {
        name: '文件夹间快速拖拽',
        description: '快速在多个文件夹间拖拽文件',
        mouseMoveInterval: 16, // 60 FPS
        testDuration: 5000
      },
      {
        name: '缓慢精确拖拽',
        description: '缓慢且精确的拖拽操作',
        mouseMoveInterval: 50, // 20 FPS
        testDuration: 3000
      },
      {
        name: '根目录拖拽测试',
        description: '从文件夹拖拽到根目录',
        mouseMoveInterval: 25, // 40 FPS
        testDuration: 4000
      },
      {
        name: '高频鼠标移动',
        description: '极高频率的鼠标移动模拟',
        mouseMoveInterval: 8, // 125 FPS
        testDuration: 3000
      }
    ];
  }
  
  async runAllTests() {
    if (this.isRunning) {
      console.warn('测试已在运行中');
      return;
    }
    
    this.isRunning = true;
    this.testResults = [];
    
    console.log('🚀 开始拖拽性能自动化测试...');
    
    // 确保性能监控器启动
    if (window.dragMonitor) {
      window.dragMonitor.show();
      window.dragMonitor.start();
    }
    
    try {
      for (const scenario of this.testScenarios) {
        console.log(`🎯 测试场景: ${scenario.name}`);
        await this.runSingleTest(scenario);
        
        // 测试间隔，让系统恢复
        await this.delay(2000);
      }
      
      this.generateReport();
    } catch (error) {
      console.error('测试运行失败:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  async runSingleTest(scenario) {
    const testResult = {
      scenario: scenario.name,
      startTime: performance.now(),
      fpsData: [],
      domQueries: 0,
      mouseMoves: 0,
      highlightOps: 0,
      errors: []
    };
    
    try {
      // 重置监控器
      if (window.dragMonitor) {
        window.dragMonitor.reset();
      }
      
      // 查找测试目标元素
      const testFile = this.findTestFile();
      const testFolders = this.findTestFolders();
      
      if (!testFile || testFolders.length === 0) {
        testResult.errors.push('无法找到测试目标元素');
        this.testResults.push(testResult);
        return;
      }
      
      // 开始模拟拖拽
      await this.simulateDragOperation(testFile, testFolders, scenario);
      
      // 收集性能数据
      if (window.dragMonitor) {
        testResult.fpsData = [...window.dragMonitor.metrics.fps];
        testResult.domQueries = window.dragMonitor.metrics.domQueryCount;
        testResult.mouseMoves = window.dragMonitor.metrics.mouseMoveCount;
        testResult.highlightOps = window.dragMonitor.metrics.highlightOperations;
      }
      
      testResult.endTime = performance.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      
    } catch (error) {
      testResult.errors.push(error.message);
      console.error(`测试 ${scenario.name} 失败:`, error);
    }
    
    this.testResults.push(testResult);
  }
  
  async simulateDragOperation(sourceElement, targetFolders, scenario) {
    const sourceRect = sourceElement.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    
    // 模拟拖拽开始
    this.fireMouseEvent(sourceElement, 'dragstart', startX, startY);
    
    // 记录开始时间
    const startTime = performance.now();
    let currentX = startX;
    let currentY = startY;
    
    // 模拟鼠标移动路径
    const movePromise = new Promise((resolve) => {
      const moveInterval = setInterval(() => {
        // 随机选择目标文件夹
        const targetFolder = targetFolders[Math.floor(Math.random() * targetFolders.length)];
        const targetRect = targetFolder.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        // 平滑移动到目标
        const deltaX = (targetX - currentX) * 0.1;
        const deltaY = (targetY - currentY) * 0.1;
        
        currentX += deltaX;
        currentY += deltaY;
        
        // 触发鼠标移动事件
        this.fireMouseEvent(document, 'mousemove', currentX, currentY);
        this.fireMouseEvent(targetFolder, 'dragover', currentX, currentY);
        
        // 检查是否超时
        if (performance.now() - startTime >= scenario.testDuration) {
          clearInterval(moveInterval);
          resolve();
        }
      }, scenario.mouseMoveInterval);
    });
    
    await movePromise;
    
    // 模拟拖拽结束
    const finalTarget = targetFolders[0];
    const finalRect = finalTarget.getBoundingClientRect();
    this.fireMouseEvent(finalTarget, 'dragend', 
      finalRect.left + finalRect.width / 2,
      finalRect.top + finalRect.height / 2
    );
  }
  
  fireMouseEvent(element, eventType, clientX, clientY) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      buttons: eventType.includes('drag') ? 1 : 0
    });
    
    element.dispatchEvent(event);
  }
  
  findTestFile() {
    // 查找第一个可拖拽的文件元素
    const fileElements = document.querySelectorAll('[data-file-id]');
    return fileElements.length > 0 ? fileElements[0] : null;
  }
  
  findTestFolders() {
    // 查找所有文件夹元素
    const folderElements = document.querySelectorAll('[data-folder-id]');
    return Array.from(folderElements).slice(0, 3); // 取前3个文件夹进行测试
  }
  
  generateReport() {
    console.log('\n📊 拖拽性能测试报告');
    console.log('=' .repeat(50));
    
    let totalTests = this.testResults.length;
    let successfulTests = this.testResults.filter(r => r.errors.length === 0).length;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`成功测试: ${successfulTests}`);
    console.log(`失败测试: ${totalTests - successfulTests}`);
    console.log('');
    
    this.testResults.forEach((result, index) => {
      console.log(`🎯 测试 ${index + 1}: ${result.scenario}`);
      
      if (result.errors.length > 0) {
        console.log(`❌ 错误: ${result.errors.join(', ')}`);
      } else {
        const avgFPS = result.fpsData.length > 0 ? 
          Math.round(result.fpsData.reduce((a, b) => a + b, 0) / result.fpsData.length) : 0;
        const minFPS = result.fpsData.length > 0 ? Math.min(...result.fpsData) : 0;
        
        console.log(`⏱️ 持续时间: ${Math.round(result.duration)}ms`);
        console.log(`📈 平均FPS: ${avgFPS}`);
        console.log(`📉 最低FPS: ${minFPS}`);
        console.log(`🔍 DOM查询: ${result.domQueries}`);
        console.log(`🖱️ 鼠标移动: ${result.mouseMoves}`);
        console.log(`✨ 高亮操作: ${result.highlightOps}`);
        
        // 性能评级
        const performance = this.evaluatePerformance(avgFPS, minFPS, result.domQueries, result.duration);
        console.log(`🏆 性能评级: ${performance.rating} (${performance.score}/100)`);
      }
      console.log('');
    });
    
    // 生成性能改进建议
    this.generateRecommendations();
  }
  
  evaluatePerformance(avgFPS, minFPS, domQueries, duration) {
    let score = 0;
    
    // FPS评分 (40分)
    if (avgFPS >= 60) score += 40;
    else if (avgFPS >= 45) score += 30;
    else if (avgFPS >= 30) score += 20;
    else if (avgFPS >= 20) score += 10;
    
    // 最低FPS评分 (20分)
    if (minFPS >= 30) score += 20;
    else if (minFPS >= 20) score += 15;
    else if (minFPS >= 15) score += 10;
    else if (minFPS >= 10) score += 5;
    
    // DOM查询效率评分 (20分)
    const queryRate = domQueries / (duration / 1000);
    if (queryRate <= 50) score += 20;
    else if (queryRate <= 100) score += 15;
    else if (queryRate <= 200) score += 10;
    else if (queryRate <= 300) score += 5;
    
    // 稳定性评分 (20分)
    const fpsVariance = avgFPS - minFPS;
    if (fpsVariance <= 10) score += 20;
    else if (fpsVariance <= 20) score += 15;
    else if (fpsVariance <= 30) score += 10;
    else if (fpsVariance <= 40) score += 5;
    
    let rating;
    if (score >= 90) rating = '🥇 优秀';
    else if (score >= 80) rating = '🥈 良好';
    else if (score >= 70) rating = '🥉 中等';
    else if (score >= 60) rating = '⚠️ 需要改进';
    else rating = '🚨 性能较差';
    
    return { score, rating };
  }
  
  generateRecommendations() {
    console.log('💡 性能优化建议:');
    console.log('-'.repeat(30));
    
    const avgResults = this.calculateAverageMetrics();
    
    if (avgResults.avgFPS < 30) {
      console.log('• 🎯 优化建议: FPS过低，建议增加节流时间或减少DOM操作频率');
    }
    
    if (avgResults.avgDOMQueries > 150) {
      console.log('• 🔍 优化建议: DOM查询过于频繁，建议增加缓存或减少查询次数');
    }
    
    if (avgResults.avgHighlightOps > 100) {
      console.log('• ✨ 优化建议: 高亮操作过多，建议添加防重复机制');
    }
    
    console.log('• 📝 建议检查控制台中的性能分析器以获取更详细的信息');
    console.log('• 🔧 考虑使用 requestAnimationFrame 批量处理DOM操作');
    console.log('• 💾 实现更智能的缓存策略以减少重复计算');
  }
  
  calculateAverageMetrics() {
    const validResults = this.testResults.filter(r => r.errors.length === 0);
    
    if (validResults.length === 0) {
      return { avgFPS: 0, avgDOMQueries: 0, avgHighlightOps: 0 };
    }
    
    return {
      avgFPS: validResults.reduce((sum, r) => sum + (r.fpsData.reduce((a, b) => a + b, 0) / r.fpsData.length || 0), 0) / validResults.length,
      avgDOMQueries: validResults.reduce((sum, r) => sum + r.domQueries, 0) / validResults.length,
      avgHighlightOps: validResults.reduce((sum, r) => sum + r.highlightOps, 0) / validResults.length
    };
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建全局测试实例
window.dragPerfTest = new DragPerformanceTest();

// 添加控制台命令
console.log('🎯 拖拽性能测试工具已加载');
console.log('使用 window.dragPerfTest.runAllTests() 开始测试');

export default window.dragPerfTest;
