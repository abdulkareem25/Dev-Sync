// /components/ContextMenu.jsx
import React, { useEffect, useRef } from 'react';

const ContextMenu = ({
  position,
  targetPath,
  isFolder,
  onClose,
  onAction,
  renameInput,
  setRenameInput,
  isRenaming,
  setIsRenaming,
  onRenameSubmit,
}) => {
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!position) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [position, onClose]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-2 z-[9999]"
      style={{ left: position.x, top: position.y, minWidth: 160 }}
    >
      <div className="text-white min-w-[160px]">
        {isRenaming ? (
          <form onSubmit={onRenameSubmit} className="px-4 py-2">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-32"
            />
            <button type="submit" className="hidden">Rename</button>
          </form>
        ) : (
          <>
            <button
              onClick={() => onAction('rename')}
              className="w-full px-4 py-2 text-left hover:bg-gray-700"
            >
              Rename
            </button>
            <button
              onClick={() => onAction('delete')}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ContextMenu;