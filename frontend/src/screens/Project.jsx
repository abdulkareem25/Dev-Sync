// /pages/Project.jsx

// ====== Imports: Node Modules ======
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { debounce, throttle } from 'lodash';
import axios from '../config/axios.js';

// ====== Imports: CodeMirror ======
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { material } from "@uiw/codemirror-theme-material";
import { githubDark } from "@uiw/codemirror-theme-github";
import { draculaInit } from "@uiw/codemirror-theme-dracula";
import { EditorView, WidgetType, Decoration } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";

// ====== Imports: Project Components & Config ======
import { initializeSocket, sendMessage, receiveMessage } from '../config/socket.js';
import { UserContext } from '../context/UserProvider.jsx';
import { getWebContainer } from "../config/webContainer.js";
import ChatPanel from '../components/ChatPanel.jsx';
import CollaboratorsPanel from '../components/CollaboratorsPanel';
import AddCollaboratorsModal from '../components/AddCollaboratorsModal';
import FileExplorer from '../components/FileExplorer';
import EditorPanel from '../components/EditorPanel';
import ContextMenu from '../components/ContextMenu';

// ====== Constants & Initializations ======
const dracula = draculaInit();
const CURSOR_TIMEOUT = 2000;
const ONLINE_TIMEOUT = 60 * 1000;

const languageExtensions = {
  js: javascript(),
  jsx: javascript({ jsx: true }),
  py: python(),
  java: java(),
  cpp: cpp(),
  html: html(),
  css: css(),
  md: markdown(),
};

const THEMES = {
  dracula,
  material,
  githubDark
};

// ====== Main Project Component ======
const Project = () => {
  // ====== Hooks: Context and Navigation ======
  const location = useLocation();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // ====== State Management ======
  const [project, setProject] = useState(location.state.project);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [openFolders, setOpenFolders] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false); // FIXED: Added missing state
  const [runProcess, setRunProcess] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('dracula');
  const [collaborators, setCollaborators] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [creationContext, setCreationContext] = useState({ type: null, parentPath: null, name: '' });
  const [iframeUrl, setIframeUrl] = useState(null);

  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef();
  const folderInputRef = useRef();

  // ====== Utility & Handler Functions ======

  // Debounced auto-save function
  const autoSave = debounce((updatedFileTree) => {
    axios.put("/projects/update-file-tree", {
      projectId: project._id,
      fileTree: updatedFileTree,
    }).catch(err => console.log("Error in auto-save:", err));
  }, 3000);

  const handleUserClick = (id) => {
    setSelectedUserIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return newSelected;
    });
  };

  const addCollaborators = () => {
    if (!user || user._id !== project.admin?._id) return alert("Only the admin can add collaborators.");
    if (selectedUserIds.size === 0) return alert("Please select at least one user.");
    axios.put("/projects/add-user", {
      projectId: project._id,
      users: Array.from(selectedUserIds)
    }).then(() => setIsModalOpen(false)).catch(err => console.log(err));
  };

  const removeCollaborator = (userId) => {
    if (!user || user._id !== project.admin?._id) return alert("Only the admin can remove collaborators.");
    if (userId === project.admin?._id) return alert("The admin cannot be removed.");
    if (!window.confirm("Are you sure you want to remove this collaborator?")) return;
    axios.put("/projects/remove-user", { projectId: project._id, userId })
      .then(res => setProject(res.data.project))
      .catch(err => alert(err.response?.data?.error || "An error occurred."));
  };

  const getColorForSender = (sender) => {
    let hash = 0;
    for (let i = 0; i < sender.length; i++) hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 100%, 80%)`;
  };

  const send = (message) => {
    // Mark self as active
    setCollaborators(prev => ({
      ...prev,
      [user._id]: { ...prev[user._id], lastActive: Date.now() }
    }));
    // Trim and validate message
    const trimmedMessage = message.trim();
    if (trimmedMessage === "") return;
    // Build outgoing message object
    const outgoingMessage = {
      sender: { _id: user._id, name: user.name },
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    };
    // Send message to collaborators and save to DB
    sendMessage("project-message", outgoingMessage);
    setMessages((prevMessages) => [...prevMessages, outgoingMessage]);
    saveMessageToDB(outgoingMessage);
  };

  // Save a chat message to the backend
  const saveMessageToDB = async (messageData) => {
    // POST message to backend for persistence
    try {
      await axios.post('/projects/save-message', {
        projectId: project._id,
        sender: messageData.sender,
        message: messageData.message
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  // FIXED: Completed handler functions
  const handleRename = (oldPath, newPath) => {
    if (!newPath || newPath.includes('/../') || newPath.endsWith('/')) return alert('Invalid name');
    setFileTree(prev => {
      const newTree = structuredClone(prev);
      const oldParts = oldPath.split('/');
      const newParts = newPath.split('/');
      const oldName = oldParts.pop();
      const newName = newParts.pop();
      let currentOld = newTree;
      for (const part of oldParts) {
        if (!currentOld[part]) return prev;
        currentOld = currentOld[part];
      }
      let currentNew = newTree;
      for (const part of newParts) {
        if (!currentNew[part]) currentNew[part] = {};
        currentNew = currentNew[part];
      }
      if (currentOld[oldName]) {
        currentNew[newName] = currentOld[oldName];
        delete currentOld[oldName];
      }
      autoSave(newTree);
      return newTree;
    });
    setOpenFiles(prev => prev.map(file => file.startsWith(oldPath) ? file.replace(oldPath, newPath) : file));
    setOpenFolders(prev => prev.map(folder => folder.startsWith(oldPath) ? folder.replace(oldPath, newPath) : folder));
    if (currentFile && currentFile.startsWith(oldPath)) {
      setCurrentFile(currentFile.replace(oldPath, newPath));
    }
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (renameInput.trim() && contextMenu?.targetPath) {
      const parts = contextMenu.targetPath.split('/');
      parts.pop();
      const newPath = parts.length ? `${parts.join('/')}/${renameInput.trim()}` : renameInput.trim();
      handleRename(contextMenu.targetPath, newPath);
    }
    setIsRenaming(false);
    setContextMenu(null);
  };

  const deleteFileOrFolder = (path) => {
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      setFileTree(prev => {
        const newTree = structuredClone(prev);
        const parts = path.split('/');
        let current = newTree;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) return prev;
          current = current[parts[i]];
        }
        delete current[parts[parts.length - 1]];
        autoSave(newTree);
        return newTree;
      });
      setOpenFiles(prev => prev.filter(f => !f.startsWith(path)));
      setOpenFolders(prev => prev.filter(f => !f.startsWith(path)));
      if (currentFile && currentFile.startsWith(path)) setCurrentFile(null);
    }
  };

  const handleContextMenuAction = (action) => {
    if (!contextMenu) return;
    const { targetPath } = contextMenu;
    if (action === 'rename') {
      setRenameInput(targetPath.split('/').pop());
      setIsRenaming(true);
    } else if (action === 'delete') {
      deleteFileOrFolder(targetPath);
      setContextMenu(null);
    }
  };

  const getFileContent = (path, tree) => {
    if (!tree || !path) return "";
    let current = tree;
    const parts = path.split('/');
    for (const part of parts) {
      if (!current[part]) return "";
      current = current[part];
    }
    return current?.file?.contents || "";
  };

  const onOpenClick = () => {
    if (folderInputRef.current) folderInputRef.current.click();
    else if (fileInputRef.current) fileInputRef.current.click();
  };

  const onDownloadClick = () => {
    import('jszip').then(JSZip => {
      const zip = new JSZip.default();
      function addFilesToZip(tree, path = '') {
        Object.entries(tree).forEach(([name, item]) => {
          const fullPath = path ? `${path}/${name}` : name;
          if (item.file) zip.file(fullPath, item.file.contents);
          else addFilesToZip(item, fullPath);
        });
      }
      addFilesToZip(fileTree);
      zip.generateAsync({ type: 'blob' }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name || 'project'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    });
  };

  // ====== WebContainer and Editor Handlers ======
  const isImageFile = (fileName) => /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
  const getMimeType = (fileName) => ({ 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'webp': 'image/webp' }[fileName.split('.').pop().toLowerCase()] || 'application/octet-stream');
  const detectLanguage = (filename) => languageExtensions[(filename || '').split('.').pop().toLowerCase()] || javascript();

  const handleInstall = async () => {
    if (isInstalling || !webContainer) return;
    setIsInstalling(true);
    try {
      await webContainer.mount(fileTree);
      const installProcess = await webContainer.spawn("npm", ["install"]);
      await installProcess.exit;
      setIsInstalled(true);
    } catch (error) {
      console.error("Installation error:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRun = async () => {
    if (runProcess) await runProcess.kill();
    try {
      await webContainer.mount(fileTree);
      const newProcess = await webContainer.spawn("npm", ["start"]);
      setRunProcess(newProcess);
      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        setIsPreviewPanelOpen(true);
      });
    } catch (error) {
      console.error("Run error:", error);
    }
  };

  const handleCloseTab = (file) => {
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(f => f !== file);
      if (currentFile === file) {
        const idx = prev.indexOf(file);
        if (newOpenFiles.length === 0) setCurrentFile(null);
        else setCurrentFile(newOpenFiles[idx] || newOpenFiles[newOpenFiles.length - 1]);
      }
      return newOpenFiles;
    });
  };

  const handleCodeChange = (value, viewUpdate) => {
    if (!currentFile || !viewUpdate.docChanged) return;
    const newContent = value;
    setFileTree(prev => {
      const newTree = structuredClone(prev);
      let current = newTree;
      const parts = currentFile.split('/');
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      if (current[parts[parts.length - 1]]) current[parts[parts.length - 1]].file.contents = newContent;
      autoSave(newTree);
      return newTree;
    });
    sendMessage('CODE_CHANGE', { content: newContent, filePath: currentFile, userId: user._id });
    sendMessage('TYPING_STATUS', { userId: user._id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendMessage('TYPING_STATUS', { userId: user._id, isTyping: false }), 1500);
  };

  // FIXED: Added missing collaborative cursor features
  class CursorWidget extends WidgetType {
    constructor(userId, color, name) { super(); this.userId = userId; this.color = color; this.name = name; }
    eq(other) { return this.userId === other.userId; }
    toDOM() {
      const span = document.createElement("span");
      span.className = "collaborator-cursor";
      span.style.borderLeft = `2px solid ${this.color}`;
      span.setAttribute("data-user", this.name);
      return span;
    }
    ignoreEvent() { return true; }
  }

  const collaborativeDecorations = (state) => {
    const decorations = Object.entries(remoteCursors)
      .filter(([userId, cursor]) => userId !== user._id && cursor.filePath === currentFile)
      .map(([userId, cursor]) => Decoration.widget({
        widget: new CursorWidget(userId, cursor.color, cursor.name),
        side: 1
      }).range(cursor.pos));
    return Decoration.set(decorations);
  };

  const throttledCursorUpdate = throttle((cursorPos) => {
    sendMessage("CURSOR_UPDATE", { userId: user._id, cursorPos, filePath: currentFile, name: user.name });
  }, 100);

  const codeMirrorExtensions = (filePath) => [
    detectLanguage(filePath),
    EditorView.lineWrapping,
    EditorView.updateListener.of(update => {
      if (update.selectionSet) throttledCursorUpdate(update.state.selection.main.head);
    }),
    EditorView.decorations.of(collaborativeDecorations())
  ];

  // ====== Effects ======
  useEffect(() => {
      // Initialize socket connection for this project
      initializeSocket(project._id)
  
      // Start WebContainer if not already started
      if (!webContainer) {
        getWebContainer().then(container => {
          setWebContainer(container);
          console.log("Container Started");
        })
      }
  
      // Listen for incoming chat messages
      receiveMessage('project-message', data => {
        console.log("Received Data:", data);
        try {
          // Save all messages, process AI messages separately
          if (data.sender._id === 'ai') {
            saveMessageToDB(data);
            setMessages(prev => [...prev, data]);
          } else {
            // Handle normal user messages
            setMessages(prev => [...prev, data]);
          }
        } catch (error) {
          console.error("Error handling message:", error);
        }
      });
  
      // Fetch latest project data and messages from backend
      axios.get(`/projects/get-project/${location.state.project._id}`)
        .then(res => {
          const projectData = res.data.project;
          setProject(projectData);
          setFileTree(projectData.fileTree || {});
  
          // Remove duplicate messages (by sender, message, and timestamp)
          const messages = projectData.messages || [];
          const uniqueMessages = messages.reduce((acc, current) => {
            const exists = acc.some(item =>
              item.message === current.message &&
              item.sender._id === current.sender._id &&
              item.createdAt === current.createdAt
            );
            return exists ? acc : [...acc, current];
          }, []);
  
          setMessages(uniqueMessages);
        })
  
      // Fetch all users for collaborator modal
      axios.get('/users/all')
        .then(res => {
          setUsers(res.data.users)
        })
        .catch(err => {
          console.log(err);
        })
  
      // Listen for remote code changes from collaborators
      receiveMessage('CODE_CHANGE', ({ content, filePath, cursorPos, userId }) => {
        if (userId !== user._id) {
          setFileTree(prev => {
            const newTree = structuredClone(prev);
            const parts = filePath.split('/');
            let current = newTree;
  
            // Traverse to file node and update contents
            for (let i = 0; i < parts.length - 1; i++) {
              current = current[parts[i]] = current[parts[i]] || {};
            }
  
            const fileName = parts[parts.length - 1];
            current[fileName] = { file: { contents: content } };
            return newTree;
          });
        }
      });
  
      // Listen for remote cursor updates
      receiveMessage('CURSOR_UPDATE', ({ userId, cursorPos, filePath, name }) => {
        if (userId !== user._id && filePath === currentFile) {
          setRemoteCursors((prev) => ({
            ...prev,
            [userId]: {
              pos: cursorPos,
              color: getColorForSender(userId),
              name: name,
              lastActive: Date.now(),
            },
          }));
        }
      });
  
      // Listen for typing status updates from collaborators
      receiveMessage('TYPING_STATUS', ({ userId, isTyping }) => {
        setCollaborators(prev => ({
          ...prev,
          [userId]: { ...prev[userId], isTyping, lastActive: Date.now() }
        }));
      });
  
      // --- Optional: Clean up WebContainer on unmount ---
      // return () => {
      //   if (webContainer) {
      //     webContainer.teardown();
      //     setWebContainer(null);
      //   }
      // };
    }, [])

  // ====== Render ======
  const filteredUsers = users.filter(u =>
    !project.users.some(pUser => pUser._id === u._id) &&
    (u.name.toLowerCase().includes(searchQuery) || u.email.toLowerCase().includes(searchQuery))
  );

  return (
    <main className="h-screen w-screen flex bg-gradient-to-br from-gray-900 to-blue-900/20 text-white overflow-hidden">
      <ChatPanel
        project={project}
        messages={messages}
        user={user}
        message={message}
        setMessage={setMessage}
        send={send}
        isSidePanelOpen={isSidePanelOpen}
        setIsSidePanelOpen={setIsSidePanelOpen}
        getColorForSender={getColorForSender}
      />
      <CollaboratorsPanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        project={project}
        collaborators={collaborators}
        ONLINE_TIMEOUT={ONLINE_TIMEOUT}
        removeCollaborator={removeCollaborator}
        onAddCollaboratorClick={() => setIsModalOpen(true)}
      />
      <section className="right flex flex-1 h-full bg-gray-900/80 backdrop-blur-sm min-w-0">
        <FileExplorer
          fileTree={fileTree}
          openFolders={openFolders}
          setOpenFolders={setOpenFolders}
          setCurrentFile={setCurrentFile}
          setOpenFiles={setOpenFiles}
          setContextMenu={setContextMenu}
          creationContext={creationContext}
          setCreationContext={setCreationContext}
          onOpenClick={onOpenClick}
          onDownloadClick={onDownloadClick}
        />
        <EditorPanel
          openFiles={openFiles}
          currentFile={currentFile}
          setCurrentFile={setCurrentFile}
          handleCloseTab={handleCloseTab}
          handleInstall={handleInstall}
          isInstalling={isInstalling}
          handleRun={handleRun}
          getFileContent={getFileContent}
          fileTree={fileTree}
          isImageFile={isImageFile}
          getMimeType={getMimeType}
          THEMES={THEMES}
          selectedTheme={selectedTheme}
          codeMirrorExtensions={codeMirrorExtensions}
          handleCodeChange={handleCodeChange}
          iframeUrl={iframeUrl}
          isPreviewPanelOpen={isPreviewPanelOpen}
          setIsPreviewPanelOpen={setIsPreviewPanelOpen}
          setReloadKey={setReloadKey}
          reloadKey={reloadKey}
          project={project}
          setCreationContext={setCreationContext}
        />
      </section>

      <AddCollaboratorsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredUsers={filteredUsers}
        selectedUserIds={selectedUserIds}
        handleUserClick={handleUserClick}
        addCollaborators={addCollaborators}
      />

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          targetPath={contextMenu.targetPath}
          isFolder={contextMenu.isFolder}
          onClose={() => { setContextMenu(null); setIsRenaming(false); }}
          onAction={handleContextMenuAction}
          onRenameSubmit={handleRenameSubmit}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          renameInput={renameInput}
          setRenameInput={setRenameInput}
        />
      )}

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple />
      <input type="file" ref={folderInputRef} style={{ display: 'none' }} webkitdirectory="true" directory="true" multiple />
    </main>
  );
};

export default Project;