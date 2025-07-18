// /components/EditorPanel.jsx
import React from 'react';
import CodeMirror from "@uiw/react-codemirror";
import { Icon } from '@iconify/react';

const fileIcons = {
    js: <Icon icon="devicon:javascript" width="1em" height="1em" color="#f7e018" />,
    jsx: <Icon icon="devicon:react" width="1em" height="1em" color="#61dafb" />,
    ts: <Icon icon="devicon:typescript" width="1em" height="1em" color="#3178c6" />,
    html: <Icon icon="devicon:html5" width="1em" height="1em" color="#e34c26" />,
    css: <Icon icon="devicon:css3" width="1em" height="1em" color="#264de4" />,
    md: <Icon icon="devicon:markdown" width="1em" height="1em" />,
    default: <Icon icon="vscode-icons:file-type-generic" width="1em" height="1em" />
  };

const getFileIcon = (fileName) => {
    if (!fileName) return fileIcons.default;
    const ext = fileName.split('.').pop().toLowerCase();
    return fileIcons[ext] || fileIcons.default;
};


const EditorPanel = ({
  openFiles,
  currentFile,
  setCurrentFile,
  handleCloseTab,
  handleInstall,
  isInstalling,
  handleRun,
  getFileContent,
  fileTree,
  isImageFile,
  getMimeType,
  THEMES,
  selectedTheme,
  codeMirrorExtensions,
  handleCodeChange,
  iframeUrl,
  isPreviewPanelOpen,
  setIsPreviewPanelOpen,
  setReloadKey,
  reloadKey,
  project,
  setCreationContext
}) => {
  return (
    <div className="editor flex flex-col flex-1 w-[calc(100%-13rem)] min-w-0">
      <div className="tabs-bar flex items-center h-16 w-full px-4 bg-gray-900 border-b border-gray-700">
        <div className="tab flex-1 overflow-x-auto whitespace-nowrap min-w-0">
          <div className="opened-files flex items-center gap-1 p-1 w-max">
            {openFiles.map((file) => (
              <div
                key={file}
                className={`tab-item flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-all ${currentFile === file ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/60'}`}
                onClick={() => setCurrentFile(file)}
              >
                {getFileIcon(file)}
                <span className="truncate max-w-[120px] pb-0.5">{file.split('/').pop()}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCloseTab(file); }}
                  className="ml-1 text-gray-500 hover:text-red-400"
                  title="Close Tab"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="control-buttons flex items-center gap-3 bg-gray-900 ml-4 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="p-2 hover:bg-gray-700 rounded-lg transition-all"
            disabled={isInstalling}
            title="Install Dependencies"
          >
            {isInstalling ? (
              <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <i className="ri-download-line text-blue-400"></i>
            )}
          </button>
          <button
            onClick={handleRun}
            className="p-2 hover:bg-gray-700 rounded-lg transition-all"
            title="Run Project"
          >
            <i className="ri-play-line text-green-400"></i>
          </button>
        </div>
      </div>
      <div className="editor-content relative overflow-y-auto h-[calc(100%-4rem)]">
        {currentFile ? (
          isImageFile(currentFile) ? (
            <img
              src={`data:${getMimeType(currentFile)};base64,${getFileContent(currentFile, fileTree)}`}
              alt={currentFile.split('/').pop()}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <CodeMirror
              key={currentFile + selectedTheme}
              value={getFileContent(currentFile, fileTree)}
              theme={THEMES[selectedTheme]}
              extensions={codeMirrorExtensions(currentFile)}
              className="h-full"
              onChange={handleCodeChange}
            />
          )
        ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-950/50 text-center p-8">
                <i className="ri-code-s-slash-line text-6xl text-blue-400 mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to {project.name}</h3>
                <p className="text-gray-400 mb-6">Select a file or create a new one to start coding</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setCreationContext({ type: 'file', parentPath: '', name: '' })}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
                  >
                    Create New File
                  </button>
                  <button
                    onClick={() => setCreationContext({ type: 'folder', parentPath: '', name: '' })}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-all"
                  >
                    Create New Folder
                  </button>
                </div>
              </div>
        )}
      </div>
      {iframeUrl && (
        <div className="relative">
          <button
            onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
            className='cursor-pointer text-blue-500 text-xl bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200 fixed bottom-4 right-4 z-50'
          >
            <i className={`ri-arrow-${isPreviewPanelOpen ? 'down' : 'up'}-s-line p-2`}></i>
          </button>
          <div
            className={`preview-panel fixed bottom-0 left-0 right-0 h-full bg-gray-900 border-gray-700 transition-transform duration-300 ease-in-out ${isPreviewPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ zIndex: 40 }}
          >
            <div className="flex items-center justify-between p-[11.5px] border-b border-gray-700">
              <h3 className="font-semibold text-white rounded-lg px-4 py-2 mr-4">Preview</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setReloadKey(prev => prev + 1)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <i className="ri-refresh-line text-xl"></i>
                </button>
                <button
                  onClick={() => setIsPreviewPanelOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
            <iframe
              key={reloadKey}
              src={iframeUrl}
              className="w-full h-[calc(100%-4rem)] bg-white"
              title="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPanel;