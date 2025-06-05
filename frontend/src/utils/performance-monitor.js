/**
 * 文件名: performance-monitor.js
 * 组件: 拖拽性能监控工具
 * 描述: 监控拖拽操作的性能指标，帮助识别和优化性能瓶颈
 * 功能: FPS监控、DOM操作计数、内存使用监控、拖拽延迟测量
 * 作者: Jolly Chen
 * 时间: 2024-12-25
 * 版本: 1.0.0
 */

class DragPerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.metrics = {
      fps: [],
      domOperations: 0,
      dragStartTime: null,
      dragEndTime: null,
      mouseMoveCount: 0,
      domQueryCount: 0,
      highlightOperations: 0,
      memoryUsage: []
    };
    
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.animationFrameId = null;
    
    // 创建性能监控面板
    this.createMonitorPanel();
    
    // 监听拖拽事件
    this.setupEventListeners();
  }
  
  createMonitorPanel() {
    // 创建监控面板
    this.panel = document.createElement('div');
    this.panel.id = 'drag-performance-monitor';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 280px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      padding: 10px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      display: none;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    document.body.appendChild(this.panel);
    
    // 创建内容区域
    this.content = document.createElement('div');
    this.panel.appendChild(this.content);
    
    // 创建控制按钮
    this.createControls();
  }
  
  createControls() {
    const controls = document.createElement('div');
    controls.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      gap: 5px;
    `;
    
    // 开始/停止按钮
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.textContent = '开始监控';
    this.toggleBtn.style.cssText = `
      background: #333;
      color: #00ff00;
      border: 1px solid #555;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    
    this.toggleBtn.onclick = () => this.toggle();
    controls.appendChild(this.toggleBtn);
    
    // 重置按钮
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置';
    resetBtn.style.cssText = this.toggleBtn.style.cssText;
    resetBtn.onclick = () => this.reset();
    controls.appendChild(resetBtn);
    
    // 隐藏按钮
    const hideBtn = document.createElement('button');
    hideBtn.textContent = '隐藏';
    hideBtn.style.cssText = this.toggleBtn.style.cssText;
    hideBtn.onclick = () => this.hide();
    controls.appendChild(hideBtn);
    
    this.panel.insertBefore(controls, this.content);
  }
  
  setupEventListeners() {
    // 监听DND事件
    document.addEventListener('dragstart', () => {
      this.metrics.dragStartTime = performance.now();
      this.metrics.mouseMoveCount = 0;
      this.metrics.domOperations = 0;
      this.metrics.domQueryCount = 0;
      this.metrics.highlightOperations = 0;
    });
    
    document.addEventListener('dragend', () => {
      this.metrics.dragEndTime = performance.now();
      this.updateDisplay();
    });
    
    // 监听鼠标移动
    document.addEventListener('mousemove', () => {
      if (this.metrics.dragStartTime && !this.metrics.dragEndTime) {
        this.metrics.mouseMoveCount++;
      }
    });
    
    // 劫持DOM查询方法来计数
    this.interceptDOMQueries();
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        this.show();
      }
    });
  }
  
  interceptDOMQueries() {
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;
    const originalElementsFromPoint = document.elementsFromPoint;
    
    document.querySelector = function(...args) {
      if (window.dragMonitor && window.dragMonitor.isMonitoring) {
        window.dragMonitor.metrics.domQueryCount++;
      }
      return originalQuerySelector.apply(this, args);
    };
    
    document.querySelectorAll = function(...args) {
      if (window.dragMonitor && window.dragMonitor.isMonitoring) {
        window.dragMonitor.metrics.domQueryCount++;
      }
      return originalQuerySelectorAll.apply(this, args);
    };
    
    document.elementsFromPoint = function(...args) {
      if (window.dragMonitor && window.dragMonitor.isMonitoring) {
        window.dragMonitor.metrics.domQueryCount++;
      }
      return originalElementsFromPoint.apply(this, args);
    };
  }
  
  startFPSMonitoring() {
    const measureFPS = (currentTime) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.metrics.fps.push(fps);
        
        // 保持最近10秒的FPS数据
        if (this.metrics.fps.length > 10) {
          this.metrics.fps.shift();
        }
        
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        if (this.isMonitoring) {
          this.updateDisplay();
        }
      }
      
      if (this.isMonitoring) {
        this.animationFrameId = requestAnimationFrame(measureFPS);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(measureFPS);
  }
  
  collectMemoryInfo() {
    if (performance.memory) {
      const memInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
      
      this.metrics.memoryUsage.push(memInfo);
      
      // 保持最近10次的内存数据
      if (this.metrics.memoryUsage.length > 10) {
        this.metrics.memoryUsage.shift();
      }
    }
  }
  
  updateDisplay() {
    if (!this.isMonitoring) return;
    
    this.collectMemoryInfo();
    
    const avgFPS = this.metrics.fps.length > 0 ? 
      Math.round(this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length) : 0;
    
    const currentFPS = this.metrics.fps[this.metrics.fps.length - 1] || 0;
    
    const dragDuration = this.metrics.dragStartTime && this.metrics.dragEndTime ? 
      Math.round(this.metrics.dragEndTime - this.metrics.dragStartTime) : 'N/A';
    
    const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    const isDragging = this.metrics.dragStartTime && !this.metrics.dragEndTime;
    
    this.content.innerHTML = `
      <div style="color: #ffff00; font-weight: bold; margin-bottom: 5px;">
        🎯 拖拽性能监控 ${isDragging ? '(拖拽中)' : ''}
      </div>
      
      <div><strong>📊 FPS指标:</strong></div>
      <div>• 当前FPS: <span style="color: ${currentFPS < 30 ? '#ff4444' : currentFPS < 50 ? '#ffaa00' : '#44ff44'}">${currentFPS}</span></div>
      <div>• 平均FPS: <span style="color: ${avgFPS < 30 ? '#ff4444' : avgFPS < 50 ? '#ffaa00' : '#44ff44'}">${avgFPS}</span></div>
      <div>• 最低FPS: <span style="color: #ff4444">${Math.min(...this.metrics.fps) || 'N/A'}</span></div>
      
      <div style="margin-top: 8px;"><strong>🖱️ 拖拽指标:</strong></div>
      <div>• 拖拽时长: ${dragDuration}ms</div>
      <div>• 鼠标移动: ${this.metrics.mouseMoveCount}次</div>
      <div>• DOM查询: ${this.metrics.domQueryCount}次</div>
      <div>• 高亮操作: ${this.metrics.highlightOperations}次</div>
      
      ${latestMemory ? `
      <div style="margin-top: 8px;"><strong>💾 内存使用:</strong></div>
      <div>• 已用: ${latestMemory.used}MB</div>
      <div>• 总量: ${latestMemory.total}MB</div>
      ` : ''}
      
      <div style="margin-top: 8px;"><strong>⚡ 性能评估:</strong></div>
      <div style="color: ${this.getPerformanceColor()};">${this.getPerformanceStatus()}</div>
      
      <div style="margin-top: 8px; font-size: 10px; color: #888;">
        Ctrl+Shift+P 显示/隐藏监控器
      </div>
    `;
  }
  
  getPerformanceStatus() {
    const avgFPS = this.metrics.fps.length > 0 ? 
      this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length : 0;
    
    const domQueryRate = this.metrics.dragStartTime && this.metrics.dragEndTime ? 
      this.metrics.domQueryCount / ((this.metrics.dragEndTime - this.metrics.dragStartTime) / 1000) : 0;
    
    if (avgFPS >= 50 && domQueryRate < 100) {
      return '🟢 性能优秀';
    } else if (avgFPS >= 30 && domQueryRate < 200) {
      return '🟡 性能良好';
    } else if (avgFPS >= 20) {
      return '🟠 性能一般';
    } else {
      return '🔴 性能较差';
    }
  }
  
  getPerformanceColor() {
    const status = this.getPerformanceStatus();
    if (status.includes('优秀')) return '#44ff44';
    if (status.includes('良好')) return '#88ff44';
    if (status.includes('一般')) return '#ffaa00';
    return '#ff4444';
  }
  
  toggle() {
    if (this.isMonitoring) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  start() {
    this.isMonitoring = true;
    this.toggleBtn.textContent = '停止监控';
    this.startFPSMonitoring();
    this.updateDisplay();
    console.log('🎯 拖拽性能监控已启动');
  }
  
  stop() {
    this.isMonitoring = false;
    this.toggleBtn.textContent = '开始监控';
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    console.log('🎯 拖拽性能监控已停止');
  }
  
  reset() {
    this.metrics = {
      fps: [],
      domOperations: 0,
      dragStartTime: null,
      dragEndTime: null,
      mouseMoveCount: 0,
      domQueryCount: 0,
      highlightOperations: 0,
      memoryUsage: []
    };
    this.updateDisplay();
    console.log('🎯 性能监控数据已重置');
  }
  
  show() {
    this.panel.style.display = 'block';
    if (!this.isMonitoring) {
      this.start();
    }
  }
  
  hide() {
    this.panel.style.display = 'none';
  }
  
  // 公共方法供外部调用
  recordHighlightOperation() {
    this.metrics.highlightOperations++;
  }
  
  recordDOMOperation() {
    this.metrics.domOperations++;
  }
}

// 创建全局实例
window.dragMonitor = new DragPerformanceMonitor();

// 导出给模块使用
export default window.dragMonitor;
