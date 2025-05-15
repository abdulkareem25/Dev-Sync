import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { material } from "@uiw/codemirror-theme-material";
import { githubDark } from "@uiw/codemirror-theme-github";
import { createTheme } from "@uiw/codemirror-themes";
import { draculaInit } from "@uiw/codemirror-theme-dracula";
import { debounce, throttle } from "lodash";
import { EditorView, WidgetType, Decoration } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";

import React, { useState, useEffect, useContext, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js'
import { UserContext } from '../context/UserProvider.jsx'
import Markdown from 'markdown-to-jsx'
import { getWebContainer } from "../config/webContainer.js";
import { pythonIcon, cppIcon, javaIcon, goIcon, swiftIcon, kotlinIcon } from '../components/LanguageIcons.jsx';
import { Icon } from '@iconify/react';

const dracula = draculaInit();

const languageExtensions = {
  js: javascript(),
  jsx: javascript({ jsx: true }),
  ts: javascript({ typescript: true }),
  py: python(),
  java: java(),
  cpp: cpp(),
  html: html(),
  css: css(),
  md: markdown(),
};

const detectLanguage = (filename) => {
  const extension = (filename || 'index.js').split('.').pop().toLowerCase();
  return languageExtensions[extension] || javascript();
};

const THEMES = {
  dracula,
  material,
  githubDark
};

const CURSOR_TIMEOUT = 2000; // 2 seconds

// ICON MAP for file extensions
const fileIcons = {
  js: <Icon icon="devicon:javascript" width="1.5em" height="1.5em" color="#f7e018" />,
  jsx: <Icon icon="devicon:react" width="1.5em" height="1.5em" color="#61dafb" />,
  ts: <Icon icon="devicon:typescript" width="1.5em" height="1.5em" color="#3178c6" />,
  py: <Icon icon="devicon:python" width="1.5em" height="1.5em" />,
  java: <Icon icon="devicon:java" width="1.5em" height="1.5em" />,
  cpp: <Icon icon="devicon:cplusplus" width="1.5em" height="1.5em" />,
  html: <Icon icon="devicon:html5" width="1.5em" height="1.5em" color="#e34c26" />,
  css: <Icon icon="devicon:css3" width="1.5em" height="1.5em" color="#264de4" />,
  md: <Icon icon="devicon:markdown" width="1.5em" height="1.5em" />,
  json: <Icon icon="vscode-icons:file-type-json" width="1.5em" height="1.5em" />,
  xml: <Icon icon="vscode-icons:file-type-xml" width="1.5em" height="1.5em" />,
  sh: <Icon icon="devicon:bash" width="1.5em" height="1.5em" />,
  go: <Icon icon="devicon:go" width="1.5em" height="1.5em" />,
  rs: <Icon icon="devicon:rust" width="1.5em" height="1.5em" />,
  php: <Icon icon="devicon:php" width="1.5em" height="1.5em" />,
  cs: <Icon icon="devicon:csharp" width="1.5em" height="1.5em" />,
  swift: <Icon icon="devicon:swift" width="1.5em" height="1.5em" />,
  kt: <Icon icon="devicon:kotlin" width="1.5em" height="1.5em" />,
  dart: <Icon icon="devicon:dart" width="1.5em" height="1.5em" />,
  scss: <Icon icon="devicon:sass" width="1.5em" height="1.5em" />,
  less: <Icon icon="vscode-icons:file-type-less" width="1.5em" height="1.5em" />,
  yaml: <Icon icon="vscode-icons:file-type-yaml" width="1.5em" height="1.5em" />,
  yml: <Icon icon="vscode-icons:file-type-yaml" width="1.5em" height="1.5em" />,
  toml: <Icon icon="vscode-icons:file-type-toml" width="1.5em" height="1.5em" />,
  txt: <Icon icon="vscode-icons:file-type-text" width="1.5em" height="1.5em" />,
  lock: <Icon icon="vscode-icons:file-type-lock" width="1.5em" height="1.5em" />,
  dockerfile: <Icon icon="devicon:docker" width="1.5em" height="1.5em" />,
  makefile: <Icon icon="vscode-icons:file-type-makefile" width="1.5em" height="1.5em" />,
  rb: <Icon icon="devicon:ruby" width="1.5em" height="1.5em" />,
  pl: <Icon icon="devicon:perl" width="1.5em" height="1.5em" />,
  sql: <Icon icon="devicon:mysql" width="1.5em" height="1.5em" />,
  default: <Icon icon="vscode-icons:file-type-generic" width="1.5em" height="1.5em" />
};

// Allowed file extensions
const allowedExtensions = [
  'js', 'jsx', 'ts', 'py', 'java', 'cpp', 'html', 'css', 'md',
  'json', 'xml', 'sh', 'go', 'rs', 'php', 'cs', 'swift', 'kt', 'dart',
  'scss', 'less', 'yaml', 'yml', 'toml', 'txt', 'lock', 'dockerfile', 'makefile', 'rb', 'pl', 'sql'
];

const WriteAiMessage = React.memo(({ message }) => {
  const formattedContent = (() => {
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      return parsed.text || parsed;
    } catch {
      return typeof message === 'string' ? message : String(message);
    }
  })();

  return (
    <div className="ai-reply bg-gray-800 rounded-lg p-4 text-sm leading-relaxed text-gray-300 shadow-md border border-gray-700">
      <Markdown
        options={{
          overrides: {
            // Custom components for special blocks
            think: {
              component: ({ children }) => (
                <div className="bg-gray-700/50 p-3 rounded-lg my-3 border-l-4 border-blue-500">
                  <div className="text-blue-400 text-xs font-mono mb-2">THINKING PROCESS:</div>
                  <div className="text-gray-300 text-sm space-y-2">{children}</div>
                </div>
              )

              // component: () => null
            },
            // Headings hierarchy
            h1: { component: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mb-3 mt-2">{children}</h1> },
            h2: { component: ({ children }) => <h2 className="text-lg font-semibold text-gray-100 mb-2 mt-4">{children}</h2> },
            h3: { component: ({ children }) => <h3 className="text-md font-medium text-gray-200 mb-2 mt-3">{children}</h3> },
            h4: { component: ({ children }) => <h4 className="text-sm font-medium text-gray-300 mb-1 mt-2">{children}</h4> },
            // Paragraphs with proper spacing
            p: { component: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p> },
            // Code blocks with proper language detection
            code: {
              component: ({ children, className }) => {
                const language = className?.replace('language-', '') || 'plaintext';
                return (
                  <div className="bg-gray-900 rounded-md overflow-hidden mb-4 mt-2 shadow-lg">
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                      <span>{language}</span>
                    </div>
                    <pre className="p-4 overflow-auto">
                      <code className={`language-${language} text-sm`}>{children}</code>
                    </pre>
                  </div>
                );
              }
            },
            // Inline code snippets
            inlineCode: { component: ({ children }) => <code className="bg-gray-700 px-1.5 py-0.5 rounded text-red-300 text-sm">{children}</code> },
            // Lists with improved spacing
            ul: { component: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-4 pl-4">{children}</ul> },
            ol: { component: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 pl-4">{children}</ol> },
            li: { component: ({ children }) => <li className="text-gray-300 pl-2">{children}</li> },
            // Blockquotes with updated styling
            blockquote: {
              component: ({ children }) => (
                <blockquote className="border-l-4 border-green-500 pl-4 text-gray-400 italic my-4 bg-gray-700/20 py-2 rounded-r">
                  {children}
                </blockquote>
              )
            },
            // Tables support
            table: { component: ({ children }) => <table className="w-full my-4 bg-gray-700/20 rounded-lg overflow-hidden">{children}</table> },
            th: { component: ({ children }) => <th className="px-4 py-2 bg-gray-800 text-left text-gray-300 border-b border-gray-600">{children}</th> },
            td: { component: ({ children }) => <td className="px-4 py-2 border-b border-gray-700/50 text-gray-400">{children}</td> }
          }
        }}
      >
        {formattedContent}
      </Markdown>
    </div>
  );
});

const Project = () => {
  const location = useLocation()
  const { user } = useContext(UserContext)

  // Home page pe jane ka button (top right corner, always visible)
  const navigate = useNavigate();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])

  const [fileTree, setFileTree] = useState({})
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([])
  const [openFolders, setOpenFolders] = useState([])

  const [webContainer, setWebContainer] = useState(null)
  const [reloadKey, setReloadKey] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(null)
  const [runProcess, setRunProcess] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('dracula');

  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [collaborators, setCollaborators] = useState({});
  const [localCursor, setLocalCursor] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const typingTimeoutRef = useRef(null);

  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);

  const messageBoxRef = React.useRef(null)

  const [searchQuery, setSearchQuery] = useState("");

  const deleteFile = (filePath) => {
    if (window.confirm(`Are you sure you want to delete "${filePath}"?`)) {
      setFileTree((prevFileTree) => {
        const newTree = structuredClone(prevFileTree);
        const parts = filePath.split("/");
        let current = newTree;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) return prevFileTree; // File path invalid
          current = current[parts[i]];
        }

        delete current[parts[parts.length - 1]]; // Delete the file
        // Auto-save after file deletion
        autoSave(newTree);
        return newTree;
      });

      setOpenFiles((prevOpenFiles) => prevOpenFiles.filter((file) => file !== filePath));
      if (currentFile === filePath) setCurrentFile(null); // Reset current file if deleted
    }
  };

  const renderFileTree = (tree = {}, path = "") => {
    return (
      <>
        {isCreatingFile && (
          <div className="file-creation-ui p-2 mb-2">
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFileCreate()}
              onBlur={handleFileCreate}
              placeholder="New file name"
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg 
                      focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {/* <div className="mt-1 text-xs text-gray-400">
              Allowed extensions: {allowedExtensions.join(', ')}
            </div> */}
          </div>
        )}
        {Object.keys(tree).map((file) => {
          const currentPath = path ? `${path}/${file}` : file;
          const ext = file.split('.').pop().toLowerCase();
          const icon = fileIcons[ext] || fileIcons.default;

          if (typeof tree[file] === "object" && !tree[file].file) {
            return (
              <div key={currentPath} className="folder">
                <button
                  onClick={() =>
                    setOpenFolders((prev) =>
                      prev.includes(currentPath)
                        ? prev.filter((f) => f !== currentPath)
                        : [...prev, currentPath]
                    )
                  }
                  className="folder-name text-lg flex cursor-pointer gap-2 hover:bg-gray-700 w-full p-2 transition-all duration-200"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Add context menu logic here
                    console.log("Context menu for folder:", currentPath);
                  }}
                >
                  <i className="ri-folder-fill text-yellow-500"></i>
                  <p
                    className="font-semibold text-lg truncate w-full flex overflow-hidden whitespace-nowrap"
                    title={file}
                  >
                    {file}
                  </p>
                </button>
                {openFolders.includes(currentPath) && (
                  <div className="pl-4">{renderFileTree(tree[file], currentPath)}</div>
                )}
              </div>
            );
          } else {
            return (
              <div key={currentPath} className="tree-element flex items-center gap-2 p-2 hover:bg-gray-700 w-full transition-all duration-200">
                <button
                  onClick={() => {
                    setCurrentFile(currentPath);
                    setOpenFiles((prev) => [...new Set([...prev, currentPath])]);

                    // Ensure new files have valid structure
                    setFileTree((prevFileTree) => {
                      const newTree = JSON.parse(JSON.stringify(prevFileTree));
                      const parts = currentPath.split("/");
                      let current = newTree;

                      for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
                          current[parts[i]] = {}; // ✅ Ensure parent folder exists
                        }
                        current = current[parts[i]];
                      }

                      // ✅ Ensure file exists
                      if (!current[parts[parts.length - 1]]) {
                        current[parts[parts.length - 1]] = { file: { contents: "" } };
                      }

                      return newTree;
                    });
                  }}
                  className="flex-grow text-left text-white truncate flex items-center gap-2"
                  title={file}
                >
                  {icon} <span>{file}</span>
                </button>
                <button
                  onClick={() => deleteFile(currentPath)}
                  className="text-red-500 hover:text-red-700 transition-all duration-200"
                  title="Delete File"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            );
          }
        })}
      </>
    );
  };

  const getFileContent = (path, tree) => {
    if (!tree || !path) return "";
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      if (!current[parts[i]]) return "";
      current = current[parts[i]];
    }

    return current?.file?.contents ?? ""; // Ensure empty files are also handled
  };

  const saveMessageToDB = async (messageData) => {
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

  const autoSave = debounce((updatedFileTree) => {
    axios.put("/projects/update-file-tree", {
      projectId: location.state.project._id,
      fileTree: updatedFileTree,
    }).then(res => {
      console.log("Auto-saved:", res.data);
    }).catch(err => {
      console.log("Error in auto-save:", err);
    });
  }, 1000);

  // const handleFileCreate = () => {
  //   const trimmed = newFileName.trim();
  //   if (!trimmed) return;
  //   const ext = trimmed.split('.').pop().toLowerCase();
  //   if (!allowedExtensions.includes(ext)) {
  //     alert('Please use a valid file extension: .js, .jsx, .ts, .py, .java, .cpp, .html, .css, .md');
  //     return;
  //   }
  //   setFileTree((prevFileTree) => {
  //     const newTree = structuredClone(prevFileTree || {});

  //     // ✅ Agar file already exist nahi karti, toh new file create karo
  //     if (!newTree[trimmed]) {
  //       newTree[trimmed] = { file: { contents: "" } }; // ✅ Empty file with content
  //       // Auto-save immediately after file creation
  //       autoSave(newTree);
  //     }

  //     return newTree;
  //   });

  //   setNewFileName("");
  //   setIsCreatingFile(false);
  //   setCurrentFile(trimmed);
  //   setOpenFiles((prevOpenFiles) => [...new Set([...prevOpenFiles, trimmed])]);
  // };


  // const handleCreateFolder = () => {
  //   if (!newFolderName.trim()) return;

  //   setFileTree((prevFileTree) => {
  //     const newTree = structuredClone(prevFileTree);
  //     const parts = newFolderName.split("/");
  //     let current = newTree;

  //     // ✅ Ensure all parent folders exist
  //     for (let i = 0; i < parts.length; i++) {
  //       if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
  //         current[parts[i]] = {}; // Creates folder if missing
  //       }
  //       current = current[parts[i]];
  //     }

  //     return newTree;
  //   });

  //   setNewFolderName("");
  //   setIsCreatingFolder(false);
  //   setOpenFolders((prevOpenFolders) => [...new Set([...prevOpenFolders, newFolderName])]);
  // };


  const handleUserClick = (id) => {
    setSelectedUserIds(prevSelectedUserIds => {
      const newSelectedUserIds = new Set(prevSelectedUserIds)
      if (newSelectedUserIds.has(id)) {
        newSelectedUserIds.delete(id)
      } else {
        newSelectedUserIds.add(id)
      }
      return newSelectedUserIds
    })
  }

  function addCollaborators() {
    if (!user || user._id !== location.state.project.admin?._id) {
      alert("Only the admin can add collaborators.");
      return;
    }

    if (selectedUserIds.size === 0) {
      alert("Select users");
      return;
    }

    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserIds)
    })
      .then(res => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch(err => {
        console.log(err);
      });
  }


  function getColorForSender(sender) {
    let hash = 0
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 100%, 80%)`
  }


  const send = (message) => {
    const trimmedMessage = message.trim();
    if (trimmedMessage === "") return;

    const outgoingMessage = {
      sender: { _id: user._id, name: user.name },
      message: trimmedMessage,
    };

    sendMessage("project-message", outgoingMessage);
    setMessages((prevMessages) => [...prevMessages, outgoingMessage]);
    saveMessageToDB(outgoingMessage);
  };

  useEffect(() => {
    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then(container => {
        setWebContainer(container);
        console.log("Container Started");
      })
    }

    receiveMessage('project-message', data => {
      console.log("Received Data:", data);

      try {
        // Save all messages but only process non-AI messages
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

    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => {
        const projectData = res.data.project;
        setProject(projectData);
        setFileTree(projectData.fileTree || {});

        // Handle messages with null check
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

    axios.get('/users/all')
      .then(res => {
        setUsers(res.data.users)
      })
      .catch(err => {
        console.log(err);
      })

    // Listen for remote changes
    receiveMessage('CODE_CHANGE', ({ content, filePath, cursorPos, userId }) => {
      if (userId !== user._id) {
        setFileTree(prev => {
          const newTree = structuredClone(prev);
          const parts = filePath.split('/');
          let current = newTree;

          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]] = current[parts[i]] || {};
          }

          const fileName = parts[parts.length - 1];
          current[fileName] = { file: { contents: content } };
          return newTree;
        });
      }
    });

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

    receiveMessage('TYPING_STATUS', ({ userId, isTyping }) => {
      setCollaborators(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isTyping }
      }));
    });
  }, [])

  // Custom cursor decoration extension
  const collaborativeDecorations = (cursors) => {
    return EditorView.decorations.of(state => {
      const decorations = [];
      Object.entries(cursors).forEach(([userId, { pos, color, name }]) => {
        decorations.push(
          Decoration.widget({
            widget: new CursorWidget(userId, color, name),
            side: 1
          }).range(pos)
        );
      });
      return Decoration.set(decorations, true);
    });
  };


  class CursorWidget extends WidgetType {
    constructor(userId, color, name) {
      super();
      this.userId = userId;
      this.color = color;
      this.name = name;
    }

    eq(other) {
      return this.userId === other.userId && this.color === other.color && this.name === other.name;
    }

    toDOM() {
      const span = document.createElement("span");
      span.className = "collaborator-cursor";
      span.style.borderLeft = `2px solid ${this.color}`;
      span.setAttribute("data-user", this.name || this.userId);
      // span.appendChild(tooltip); // Removed JS tooltip, only CSS tooltip remains
      return span;
    }

    ignoreEvent() {
      return true;
    }
  }

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (messageBoxRef.current) {
      setTimeout(() => {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  // collaborators normal karne ke liye
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedUserIds(new Set()); // Modal band hone pe selectedUserIds empty ho jayega
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!webContainer || !isInstalled) return;
    async function updateFiles() {
      try {
        await webContainer.mount(fileTree); // Sirf updated files mount karo
        console.log("Files updated in container without restart");
      } catch (error) {
        console.error("Error updating files:", error);
      }
    }
    updateFiles();
  }, [fileTree]); // Server restart nahi hoga, sirf file update hogi

  // Clean up inactive cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const filtered = {};
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (now - (cursor.lastActive || 0) < CURSOR_TIMEOUT) {
            filtered[userId] = cursor;
          }
        });
        return filtered;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        send(message.trim());
        setMessage('');
        e.target.style.height = 'auto';
      }
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      send(message.trim());
      setMessage('');
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.style.height = 'auto';
    }
  };

  const handleInstall = async () => {
    if (isInstalling || !webContainer) return;
    setIsInstalling(true);

    try {
      await webContainer.mount(fileTree);
      const installProcess = await webContainer.spawn("npm", ["install"]);

      installProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          console.log(chunk);
        }
      }));

      await installProcess.exit;
      setIsInstalled(true);
    } catch (error) {
      console.error("Installation error:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRun = async () => {
    if (runProcess) {
      await runProcess.kill();
    }

    try {
      await webContainer.mount(fileTree);
      const newProcess = await webContainer.spawn("npm", ["start"]);
      setRunProcess(newProcess);

      newProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          console.log(chunk);
        }
      }));

      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        autoSave(fileTree);
        setIsPreviewPanelOpen(true);
      });
    } catch (error) {
      console.error("Run error:", error);
    }
  };

  const handleCloseTab = (file) => {
    setOpenFiles(prev => prev.filter(f => f !== file));
    if (currentFile === file) {
      setCurrentFile(openFiles.length > 1 ? openFiles[0] : null);
    }
  };

  // Add this derived state for filtered users
  const filteredUsers = users.filter(user =>
    !project.users.some(projectUser => projectUser._id === user._id) &&
    (user.name.toLowerCase().includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery))
  );

  // Add these inside the Project component

  const handleCodeChange = (value, viewUpdate) => {
    if (!currentFile || !viewUpdate) return;

    const newContent = value;
    const cursorPos = viewUpdate.state.selection.ranges[0].from;

    // Update local file tree state
    setFileTree(prev => {
      const newTree = structuredClone(prev);
      const parts = currentFile.split('/');
      let current = newTree;

      // Navigate to the file location in the tree
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }

      // Update file contents
      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: newContent } };

      // Debounced auto-save
      autoSave(newTree);
      return newTree;
    });

    // Broadcast changes to collaborators
    sendMessage('CODE_CHANGE', {
      content: newContent,
      filePath: currentFile,
      cursorPos,
      userId: user._id
    });

    // Handle typing indicators
    sendMessage('TYPING_STATUS', {
      userId: user._id,
      isTyping: true,
      fileName: currentFile,
      projectId: project._id
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage('TYPING_STATUS', {
        userId: user._id,
        isTyping: false,
        fileName: currentFile,
        projectId: project._id
      });
    }, 1500);
  };

  // Enhanced CodeMirror extensions configuration
  const codeMirrorExtensions = (filePath) => [
    EditorState.allowMultipleSelections.of(true),
    detectLanguage(filePath),
    EditorView.lineWrapping,
    EditorView.updateListener.of(update => {
      if (update.docChanged || update.selectionSet) {
        const cursorPos = update.state.selection.main.head;
        throttledCursorUpdate(cursorPos);
      }
    }),
    collaborativeDecorations(remoteCursors),
    EditorView.theme({
      "&": {
        fontSize: "14px",
        height: "100%",
        backgroundColor: "transparent",
      },
      ".cm-content": {
        fontFamily: "Fira Code, Menlo, Monaco, Consolas, Courier New, monospace",
        padding: "1rem 0",
      },
      ".cm-gutters": {
        backgroundColor: "#1a1a1a",
        borderRight: "1px solid #333",
        color: "#666",
      },
      ".cm-activeLine": {
        backgroundColor: "#ffffff08",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "#ffffff05",
      },
      ".collaborator-cursor": {
        position: "relative",
        "&::after": {
          content: "attr(data-user)",
          position: "absolute",
          top: "-1.25rem",
          left: "-2px",
          fontSize: "0.75rem",
          background: "var(--cursor-color)",
          color: "white",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          whiteSpace: "nowrap",
        }
      }
    }),
    linter(),
    autocompletion(),
    EditorView.contentAttributes.of({ "data-enable-grammarly": "false" }),
  ];

  // File creation handler
  const handleFileCreate = () => {
    const trimmedName = newFileName.trim();

    if (!trimmedName) {
      setIsCreatingFile(false);
      return;
    }

    // Validate file extension
    const extension = trimmedName.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      alert(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
      setNewFileName("");
      setIsCreatingFile(false);
      return;
    }

    // Split path into directories and filename
    const pathParts = trimmedName.split('/');
    const fileName = pathParts.pop();
    const directories = pathParts;

    setFileTree(prev => {
      const newTree = structuredClone(prev);
      let currentLevel = newTree;

      // Navigate through/create directories
      directories.forEach(dir => {
        if (!currentLevel[dir]) {
          currentLevel[dir] = {};
        }
        currentLevel = currentLevel[dir];
      });

      // Create file if it doesn't exist
      if (!currentLevel[fileName]) {
        currentLevel[fileName] = { file: { contents: "" } };

        // Auto-save after creation
        autoSave(newTree);

        // Open parent folders
        setOpenFolders(prev => [
          ...new Set([...prev, ...directories])
        ]);
      }

      return newTree;
    });

    // Set as current file and add to open files
    const fullPath = trimmedName;
    setCurrentFile(fullPath);
    setOpenFiles(prev => [...new Set([...prev, fullPath])]);
    setNewFileName("");
    setIsCreatingFile(false);
  };


  return (
    <main className="h-screen w-screen flex bg-gradient-to-br from-gray-900 to-blue-900/20 text-white overflow-hidden">
      {/* Left Chat Section */}
      <section className="left relative h-full flex flex-col w-[350px] min-w-[250px] bg-gray-800/80 shadow-2xl backdrop-blur-sm">
        <div className="chats h-full flex flex-col">
          {/* Chat Header */}
          <header className="flex items-center justify-between w-full bg-gray-900/90 p-4 h-16 border-b border-gray-700 backdrop-blur-sm">
            <button
              onClick={() => navigate('/home')}
              className="text-blue-400 hover:text-blue-300 text-2xl p-2 rounded-lg transition-all"
              title="Go to Home"
            >
              <i className="ri-home-4-line"></i>
            </button>

            <div className="flex-1 px-4">
              <h2 className="text-white text-lg font-semibold truncate" title={project.name}>
                {project.name}
              </h2>
              <p className="text-xs text-gray-400">{project.users.length} collaborators</p>
            </div>

            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="text-blue-400 hover:text-blue-300 text-2xl p-2 rounded-lg transition-all"
            >
              <i className="ri-group-fill"></i>
            </button>
          </header>

          {/* Chat Messages */}
          <div ref={messageBoxRef} className="conversation-area flex flex-grow flex-col p-4 overflow-y-auto space-y-4">
            <div className="message-box flex-grow flex flex-col gap-4">
              {messages.map((msg, index) => {
                const isOutgoing = msg.sender._id === user._id;
                const isAI = msg.sender._id === "ai";
                const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg._id || index}
                    className={`message flex flex-col rounded-xl p-3 shadow-lg ${isAI ? "w-full bg-gray-700" :
                      isOutgoing
                        ? "ml-auto bg-blue-600/90 text-white"
                        : "self-start bg-gray-700/50 text-gray-200"
                      }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      {!isOutgoing && !isAI && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: getColorForSender(msg.sender.name) }}
                        >
                          {msg.sender.name}
                        </span>
                      )}
                      {isAI && (
                        <div className="flex items-center gap-2 text-blue-400">
                          {/* <i className="ri-ai-generate"></i> */}
                          <span className="text-sm font-semibold">AI Assistant</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm mb-1">
                      {isAI ? (
                        <WriteAiMessage message={msg.message} />
                      ) : (
                        <div className="break-words">{msg.message}</div>
                      )}
                    </div>
                    <div className={`text-xs ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                      {timestamp}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div className="inputField w-full flex items-center bg-gray-900/80 p-3 gap-2 border-t border-gray-700 backdrop-blur-sm">
            <div className="flex-grow">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      send(message.trim());
                      setMessage('');
                      e.target.style.height = 'auto'; // Reset height after sending
                    }
                  }
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Type a message..."
                rows={1}
                className={`
                    w-full
                    bg-gray-800
                    text-white
                    placeholder-gray-500
                    rounded
                    outline-none
                    resize-none
                    p-2
                    min-h-[40px]
                    max-h-40
                    overflow-y-auto
                    [&::-webkit-scrollbar]:[width:2.5px]
                  [&::-webkit-scrollbar-thumb]:bg-blue-200
                  [&::-webkit-scrollbar-track]:bg-blue-800
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    transition-all
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                `}
              />
            </div>

            {/* ▶️ green send button */}
            <button
              onClick={() => {
                if (message.trim()) {
                  send(message.trim());
                  setMessage('');
                  const textarea = document.querySelector('textarea'); // Select the textarea
                  if (textarea) textarea.style.height = 'auto'; // Reset height after sending
                }
              }}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Send Message"
              aria-label="Send Message"
            >
              <i className="ri-send-plane-fill text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Collaborators Side Panel */}
        <div className={`sidePanel absolute inset-0 bg-gray-800/95 backdrop-blur-xl transition-transform 
                    ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <header className="flex justify-between items-center p-4 bg-gray-900 h-16 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <i className="ri-team-line text-2xl text-blue-400"></i>
              <h2 className="text-white text-lg font-semibold">
                Collaborators ({project.users.length})
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 text-xl p-2 rounded-lg transition-all"
              >
                <i className="ri-user-add-line"></i>
              </button>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="text-gray-400 hover:text-gray-300 text-2xl p-2 rounded-lg transition-all"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </header>

          <div className="users-list p-4 space-y-3 overflow-y-auto">
            {project.users?.map((user) => (
              <div key={user._id} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <i className="ri-user-3-line text-blue-400"></i>
                  </div>
                  {user._id === project.admin?._id && (
                    <div className="absolute -bottom-0.5 -right-0 ">
                      <i className="ri-shield-star-line text-yellow-500"></i>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {user.name}
                    <span className="text-gray-400 text-sm ml-2">{user.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Editor Section */}
      <section className="right flex flex-grow h-full bg-gray-900/80 backdrop-blur-sm">
        {/* File Explorer */}
        <div className="explorer h-full w-52 flex flex-col border-r border-gray-700">
          <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
            <h3 className="text-white font-semibold">EXPLORER</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCreatingFile(true);
                  setNewFileName("");
                }}
                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg transition-all"
              >
                <i className="ri-file-add-line text-xl"></i>
              </button>
            </div>
          </div>

          <div className="file-tree p-4 space-y-2 overflow-y-auto">
            {renderFileTree(fileTree)}
          </div>
        </div>

        {/* Code Editor */}
        <div className="editor flex-grow flex flex-col min-w-0">
          {/* Editor Tabs */}
          <div className="tabs-bar flex items-center h-16 px-4 bg-gray-900 border-b border-gray-700">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
              {openFiles.map((file) => (
                <div
                  key={file}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 ${currentFile === file
                    ? "border-blue-500 bg-gray-800"
                    : "border-transparent hover:bg-gray-700"
                    }`}
                >
                  <i className="ri-file-line text-blue-400"></i>
                  <span className="text-white truncate max-w-[150px]">{file}</span>
                  <button
                    onClick={() => handleCloseTab(file)}
                    className="text-gray-400 hover:text-red-400 ml-2 transition-all"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="ml-auto flex gap-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all"
                disabled={isInstalling}
              >
                {isInstalling ? <i className="ri-loader-4-line animate-spin"></i> : "Install"}
              </button>

              <button
                onClick={handleRun}
                className="px-4 py-2 bg-green-600/30 hover:bg-green-600/40 text-green-400 rounded-lg transition-all"
              >
                Run
              </button>

              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-gray-800 text-blue-400 px-3 rounded-lg cursor-pointer"
              >
                {Object.keys(THEMES).map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Editor Content */}
          <div className="editor-content flex-grow relative min-w-0">
            {currentFile ? (
              <CodeMirror
                key={currentFile + selectedTheme} // Force remount on theme/file change
                value={getFileContent(currentFile, fileTree)}
                theme={THEMES[selectedTheme]}
                extensions={codeMirrorExtensions(currentFile)}
                className="h-full overflow-x-auto"
                height="100%"
                onChange={handleCodeChange}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  foldGutter: true,
                  syntaxHighlighting: true,
                  searchKeymap: true,
                  lintKeymap: true,
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-950/50 text-center p-8">
                <i className="ri-code-s-slash-line text-6xl text-blue-400 mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to {project.name}</h3>
                <p className="text-gray-400 mb-6">Select a file or create a new one to start coding</p>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
                >
                  Create New File
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {iframeUrl && (
            <div className="relative">
              <button
                onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                className='cursor-pointer text-blue-500 text-xl bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200 fixed bottom-4 right-4 z-50'
                title="preview"
              >
                <i className={`ri-arrow-${isPreviewPanelOpen ? 'down' : 'up'}-s-line p-2`}></i>
              </button>

              <div
                className={`preview-panel fixed bottom-0 left-0 right-0 h-full bg-gray-900 border-gray-700 transition-transform duration-300 ease-in-out ${isPreviewPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ zIndex: 40 }}
              >
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  <input
                    type="text"
                    value={iframeUrl}
                    onChange={(e) => setIframeUrl(e.target.value)}
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg mr-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setReloadKey(prev => prev + 1)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Reload Preview"
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
                  className="w-full h-full bg-white"
                  title="Preview"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add Collaborators Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Add Collaborators</h3>

            <input
              type="text"
              placeholder="Search users..."
              className="w-full p-3 mb-4 bg-gray-700 rounded-lg text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />

            <div className="users-list max-h-[50vh] overflow-y-auto space-y-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${selectedUserIds.has(user._id)
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                      }`}
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <i className="ri-user-line text-blue-400"></i>
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 p-4">
                  No matching users found
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addCollaborators}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                disabled={selectedUserIds.size === 0}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;