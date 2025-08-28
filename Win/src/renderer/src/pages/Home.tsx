import React, { useState, useEffect } from 'react';
import { FileText, FolderPlus, Plus, Settings, Minimize2, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';

const Home: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    // 获取应用版本
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });
    }
  }, []);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    }
  };

  const handleNewNote = () => {
    toast.success('新建笔记功能待实现');
  };

  const handleNewFolder = () => {
    toast.success('新建文件夹功能待实现');
  };

  const handleSettings = () => {
    toast.info('设置功能待实现');
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 自定义标题栏 */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b no-select" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">AI Notes</span>
          {appVersion && (
            <span className="text-xs text-gray-500">v{appVersion}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 侧边栏 */}
        <div className="w-64 bg-gray-50 border-r flex flex-col">
          {/* 操作按钮 */}
          <div className="p-4 border-b">
            <div className="flex space-x-2">
              <button
                onClick={handleNewNote}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新建笔记</span>
              </button>
              <button
                onClick={handleNewFolder}
                className="flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleSettings}
                className="flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 文件夹和笔记列表 */}
          <div className="flex-1 p-4">
            <div className="text-center text-gray-500 mt-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无笔记</p>
              <p className="text-sm mt-2">点击上方按钮开始创建</p>
            </div>
          </div>
        </div>

        {/* 主编辑区域 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">欢迎使用 AI Notes</h2>
              <p className="text-gray-400">选择或创建一个笔记开始编辑</p>
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <p>• 支持 Markdown 格式</p>
                <p>• 集成 AI 智能助手</p>
                <p>• 本地数据存储</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="bg-gray-100 px-4 py-1 border-t text-xs text-gray-600 flex items-center justify-between">
        <span>就绪</span>
        <span>AI: 未连接</span>
      </div>
    </div>
  );
};

export default Home;