import React, { useState, useRef, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Type, Hash, List, Code, GitBranch } from 'lucide-react';
import mermaid from 'mermaid';

interface NoteBlock {
  id?: number;
  type: 'text' | 'heading' | 'list' | 'code' | 'mermaid';
  content: string;
  position: number;
}

interface BlockEditorProps {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  onSave?: () => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, onSave }) => {
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化 Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // 自动保存
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onSave?.();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [blocks, onSave]);

  const addBlock = (position: number, type: NoteBlock['type'] = 'text') => {
    const newBlock: NoteBlock = {
      type,
      content: '',
      position,
    };

    const newBlocks = [...blocks];
    // 调整后续块的位置
    newBlocks.forEach(block => {
      if (block.position >= position) {
        block.position += 1;
      }
    });
    newBlocks.push(newBlock);
    newBlocks.sort((a, b) => a.position - b.position);
    
    onChange(newBlocks);
    setActiveBlockId(position);
  };

  const updateBlock = (position: number, content: string) => {
    const newBlocks = blocks.map(block =>
      block.position === position ? { ...block, content } : block
    );
    onChange(newBlocks);
  };

  const deleteBlock = (position: number) => {
    const newBlocks = blocks
      .filter(block => block.position !== position)
      .map(block => ({
        ...block,
        position: block.position > position ? block.position - 1 : block.position
      }));
    onChange(newBlocks);
  };

  const changeBlockType = (position: number, type: NoteBlock['type']) => {
    const newBlocks = blocks.map(block =>
      block.position === position ? { ...block, type } : block
    );
    onChange(newBlocks);
    setShowBlockMenu(null);
  };

  const renderBlock = (block: NoteBlock) => {
    const isActive = activeBlockId === block.position;
    const showMenu = showBlockMenu === block.position;

    const blockTypeIcons = {
      text: Type,
      heading: Hash,
      list: List,
      code: Code,
      mermaid: GitBranch,
    };

    const BlockIcon = blockTypeIcons[block.type];

    return (
      <div
        key={block.position}
        className={`group relative border-l-2 pl-4 py-2 transition-colors ${
          isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
        }`}
        onFocus={() => setActiveBlockId(block.position)}
        onBlur={() => setActiveBlockId(null)}
      >
        {/* 块控制按钮 */}
        <div className="absolute -left-8 top-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab"
            title="拖拽排序"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setShowBlockMenu(showMenu ? null : block.position)}
              title="块类型"
            >
              <BlockIcon className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {Object.entries(blockTypeIcons).map(([type, Icon]) => (
                    <button
                      key={type}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => changeBlockType(block.position, type as NoteBlock['type'])}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="p-1 text-gray-400 hover:text-red-600"
            onClick={() => deleteBlock(block.position)}
            title="删除块"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 块内容 */}
        <div className="min-h-[2rem]">
          {block.type === 'heading' && (
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.position, e.target.value)}
              placeholder="输入标题..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none resize-none"
            />
          )}
          
          {block.type === 'text' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.position, e.target.value)}
              placeholder="输入文本..."
              className="w-full bg-transparent border-none outline-none resize-none min-h-[2rem]"
              rows={Math.max(1, block.content.split('\n').length)}
            />
          )}
          
          {block.type === 'list' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.position, e.target.value)}
              placeholder="• 列表项 1\n• 列表项 2"
              className="w-full bg-transparent border-none outline-none resize-none min-h-[2rem] font-mono"
              rows={Math.max(2, block.content.split('\n').length)}
            />
          )}
          
          {block.type === 'code' && (
            <div className="bg-gray-100 rounded-md p-3">
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.position, e.target.value)}
                placeholder="输入代码..."
                className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm"
                rows={Math.max(3, block.content.split('\n').length)}
              />
            </div>
          )}
          
          {block.type === 'mermaid' && (
            <div className="space-y-2">
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.position, e.target.value)}
                placeholder="graph TD\n    A[开始] --> B[处理]\n    B --> C[结束]"
                className="w-full bg-gray-100 border border-gray-200 rounded-md p-3 font-mono text-sm"
                rows={Math.max(4, block.content.split('\n').length)}
              />
              {block.content && (
                <div className="border border-gray-200 rounded-md p-4 bg-white">
                  <MermaidRenderer content={block.content} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 添加块按钮 */}
        <div className="absolute -bottom-2 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            onClick={() => addBlock(block.position + 1)}
            title="添加块"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {blocks.length === 0 ? (
        <div className="text-center py-8">
          <button
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => addBlock(0)}
          >
            <Plus className="w-4 h-4" />
            <span>添加第一个块</span>
          </button>
        </div>
      ) : (
        blocks
          .sort((a, b) => a.position - b.position)
          .map(renderBlock)
      )}
      
      {/* 点