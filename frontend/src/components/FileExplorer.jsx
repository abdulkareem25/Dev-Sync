// /components/FileExplorer.jsx
import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

const fileIcons = {
  json: <Icon icon="devicon:json" width="1em" height="1em" color="#f7df1e" />,
  js: <Icon icon="devicon:javascript" width="1em" height="1em" color="#f7e018" />,
  jsx: <Icon icon="devicon:react" width="1em" height="1em" color="#61dafb" />,
  ts: <Icon icon="devicon:typescript" width="1em" height="1em" color="#3178c6" />,
  html: <Icon icon="devicon:html5" width="1em" height="1em" color="#e34c26" />,
  css: <Icon icon="devicon:css3" width="1em" height="1em" color="#264de4" />,
  md: <Icon icon="devicon:markdown" width="1em" height="1em" />,
  default: <Icon icon="vscode-icons:file-type-generic" width="1em" height="1em" />,
};

const getFileIcon = (fileName) => {
  if (!fileName) return fileIcons.default;
  const ext = fileName.split('.').pop().toLowerCase();
  return fileIcons[ext] || fileIcons.default;
};

const FileExplorer = ({
  fileTree,
  openFolders,
  setOpenFolders,
  setCurrentFile,
  setOpenFiles,
  setContextMenu,
  setCreationContext,
  onOpenClick,
  onDownloadClick,
}) => {
  const creationInputRef = useRef(null);

  const renderTree = (tree, currentPath = "") => {
    return Object.entries(tree).map(([name, item]) => {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      const isFolder = typeof item === 'object' && item !== null && !item.file;

      return (
        <div key={fullPath} className="tree-item">
          <div
            className="group flex items-center gap-2 hover:bg-gray-700 p-1 rounded relative"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ position: { x: e.clientX, y: e.clientY }, targetPath: fullPath, isFolder });
            }}
          >
            <button
              className="flex items-center gap-2 flex-1"
              onClick={() => {
                if (isFolder) {
                  setOpenFolders((prev) =>
                    prev.includes(fullPath)
                      ? prev.filter((p) => p !== fullPath)
                      : [...prev, fullPath]
                  );
                } else {
                  setCurrentFile(fullPath);
                  setOpenFiles((prev) => (prev.includes(fullPath) ? prev : [...prev, fullPath]));
                }
              }}
            >
              {isFolder ? (
                <i className={`ri-folder-${openFolders.includes(fullPath) ? 'open' : 'close'}-fill text-yellow-500`} />
              ) : (
                getFileIcon(name)
              )}
              <span className="truncate pb-0.5">{name}</span>
            </button>
            {isFolder && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreationContext({ type: 'file', parentPath: fullPath, name: '' });
                  }}
                  className="text-gray-400 hover:text-blue-400"
                  title="Create New File"
                >
                  <i className="ri-file-add-line text-sm"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreationContext({ type: 'folder', parentPath: fullPath, name: '' });
                  }}
                  className="text-gray-400 hover:text-yellow-500"
                  title="Create New Folder"
                >
                  <i className="ri-folder-add-line text-sm"></i>
                </button>
              </div>
            )}
          </div>
          {isFolder && openFolders.includes(fullPath) && (
            <div className="ml-4">{renderTree(item, fullPath)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="explorer h-full w-52 flex flex-col border-r border-gray-700">
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
        <h3 className="text-white font-semibold">EXPLORER</h3>
        <div className="flex items-center">
          <button
            onClick={() => setCreationContext({ type: 'file', parentPath: '', name: '' })}
            className="text-blue-400 hover:text-blue-300 p-0.5 rounded-lg transition-all"
            title="Create New File"
          >
            <i className="ri-file-add-line text-lg"></i>
          </button>
          <button
            onClick={() => setCreationContext({ type: 'folder', parentPath: '', name: '' })}
            className="text-blue-400 hover:text-blue-300 p-0.5 rounded-lg transition-all ml-2"
            title="Create New Folder"
          >
            <i className="ri-folder-add-line text-lg"></i>
          </button>
        </div>
      </div>
      <div className="file-tree flex-1 p-4 space-y-2 overflow-y-auto">
        {renderTree(fileTree)}
      </div>
      <div className="action-panel p-4 border-t border-gray-700 space-y-3 bg-gray-900">
        <button
          onClick={onOpenClick}
          className="w-full flex items-center justify-start text-gray-200 hover:text-white text-sm font-medium p-2 rounded-md transition-colors hover:bg-gray-800"
        >
          <i className="ri-folder-open-line text-lg mr-2"></i> Open File/Folder
        </button>
        <button
          onClick={onDownloadClick}
          className="w-full flex items-center justify-start text-gray-200 hover:text-white text-sm font-medium p-2 rounded-md transition-colors hover:bg-gray-800"
        >
          <i className="ri-download-line text-lg mr-2"></i> Download Code
        </button>
      </div>
    </div>
  );
};

export default FileExplorer;