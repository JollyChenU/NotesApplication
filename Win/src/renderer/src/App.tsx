import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // 监听菜单事件
    if (window.electronAPI) {
      window.electronAPI.onMenuNewNote(() => {
        console.log('New note from menu');
        // 触发新建笔记事件
      });

      window.electronAPI.onMenuSave(() => {
        console.log('Save from menu');
        // 触发保存事件
      });

      window.electronAPI.onMenuStartAI(() => {
        console.log('Start AI from menu');
        // 触发启动AI事件
      });

      window.electronAPI.onMenuStopAI(() => {
        console.log('Stop AI from menu');
        // 触发停止AI事件
      });

      window.electronAPI.onMenuImportModel((event, filePath) => {
        console.log('Import model from menu:', filePath);
        // 触发导入模型事件
      });
    }

    // 清理事件监听
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-new-note');
        window.electronAPI.removeAllListeners('menu-save');
        window.electronAPI.removeAllListeners('menu-start-ai');
        window.electronAPI.removeAllListeners('menu-stop-ai');
        window.electronAPI.removeAllListeners('menu-import-model');
      }
    };
  }, []);

  return (
    <Router>
      <div className="h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;