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

const WriteAiMessage = React.memo(({ message }) => {
  let content;
  try {
    const parsed = typeof message === 'string' ? JSON.parse(message) : message;
    content = parsed.text || parsed; // Extract the 'text' property or use the parsed object
  } catch {
    content = message; // Fallback to the raw message if parsing fails
  }

  // Format the content for markdown rendering
  const formattedContent = typeof content === 'object'
    ? JSON.stringify(content, null, 2) // Format objects as JSON
    : content;

  return (
    <div className="ai-reply bg-gray-800 rounded-lg p-4 text-sm leading-relaxed text-gray-300 shadow-md border border-gray-700">
      <Markdown
        options={{
          overrides: {
            // code blocks
            code: {
              component: ({ children, className }) => {
                const language = className?.replace('lang-', '') || 'plaintext';
                return (
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-auto shadow-inner">
                    <code className={`language-${language}`}>{children}</code>
                  </div>
                );
              },
            },
            // normal paragraphs → inline spans
            p: {
              component: ({ children }) => (
                <span className="text-gray-300">{children}</span>
              ),
            },
            // top-level headings still blocks
            h1: {
              component: ({ children }) => (
                <h1 className="text-lg font-bold text-gray-100 mb-2">{children}</h1>
              ),
            },
            // “sub-headings” inside lists as inline spans
            h2: {
              component: ({ children }) => (
                <span className="font-semibold text-gray-200">{children}</span>
              ),
            },
            // unordered list
            ul: {
              component: ({ children }) => (
                <ul className="list-disc list-inside text-gray-300 mb-2 pl-5">{children}</ul>
              ),
            },
            // ordered list with padding
            ol: {
              component: ({ children }) => (
                <ol className="list-decimal list-inside text-gray-300 mb-2 pl-2.5">
                  {children}
                </ol>
              ),
            },
            // list items
            li: {
              component: ({ children }) => (
                <li className="mb-1 text-gray-300">{children}</li>
              ),
            },
            // blockquotes
            blockquote: {
              component: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 text-gray-400 italic mb-2">
                  {children}
                </blockquote>
              ),
            },
          },
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
        return newTree;
      });

      setOpenFiles((prevOpenFiles) => prevOpenFiles.filter((file) => file !== filePath));
      if (currentFile === filePath) setCurrentFile(null); // Reset current file if deleted
    }
  };

  const renderFileTree = (tree = {}, path = "") => {
    return Object.keys(tree).map((file) => {
      const currentPath = path ? `${path}/${file}` : file;

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
              className="flex-grow text-left text-white truncate"
              title={file}
            >
              <i className="ri-file-line text-blue-500"></i> {file}
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
    });
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

  const handleCreateFile = () => {
    if (!newFileName.trim()) return; // Empty filename allow nahi hoga

    setFileTree((prevFileTree) => {
      const newTree = structuredClone(prevFileTree || {}); // ✅ Ensure tree is not undefined

      // ✅ Agar file already exist nahi karti, toh new file create karo
      if (!newTree[newFileName]) {
        newTree[newFileName] = { file: { contents: "" } }; // ✅ Empty file with content
      }

      return newTree;
    });

    setNewFileName("");
    setIsCreatingFile(false);
    setCurrentFile(newFileName);
    setOpenFiles((prevOpenFiles) => [...new Set([...prevOpenFiles, newFileName])]);
  };


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

  // Modified CodeMirror component with collaborative features
  const codeMirrorExtensions = [
    EditorState.allowMultipleSelections.of(true),
    EditorView.lineWrapping,
    detectLanguage(currentFile),
    collaborativeDecorations(remoteCursors),
    EditorView.updateListener.of(update => {
      // Cursor tracking emit
      if (update.selectionSet) {
        const cursorPos = update.state.selection.main.head;
        throttledCursorUpdate(cursorPos);
      }
      if (update.docChanged || update.selectionSet) {
        handleCodeChange(update);
      }
    }),
    // Add linting and intelligent code completion if available
    linter ? linter() : null,
    autocompletion ? autocompletion() : null,
  ].filter(Boolean); // Filter out null values to avoid errors

  const throttledCursorUpdate = throttle((cursorPos) => {
    sendMessage("CURSOR_UPDATE", {
      userId: user._id,
      cursorPos,
      filePath: currentFile,
      name: user.name,
    });
  }, 100);

  const handleCodeChange = (update) => {
    const newContent = update.state.doc.toString();
    const cursorPos = update.state.selection.main.head;

    // Update local state
    setFileTree(prev => {
      const newTree = JSON.parse(JSON.stringify(prev));
      const parts = currentFile.split('/');
      let current = newTree;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]] = current[parts[i]] || {};
      }

      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: newContent } };
      return newTree;
    });

    // Broadcast changes
    sendMessage('CODE_CHANGE', {
      content: newContent,
      filePath: currentFile,
      cursorPos,
      userId: user._id
    });

    // Typing indicators
    sendMessage('TYPING_STATUS', { userId: user._id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage('TYPING_STATUS', { userId: user._id, isTyping: false });
    }, 1000);
  };

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
    }
  }, [messages])

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

  return (
    <main className="h-screen w-screen flex bg-gray-950 text-white">
      <section className="left relative h-full flex flex-col w-[350px] min-w-[300px] max-w-[400px] bg-gray-800 shadow-lg">
        <div className="chats h-full flex flex-col">
          <header className="relative flex items-center justify-between w-full bg-gray-950 p-4 h-14 shadow-md">
            <div className="w-full">
              <h2
                className="text-white text-lg font-semibold truncate cursor-pointer"
                title={project.name}
              >
                {project.name}
              </h2>
            </div>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="cursor-pointer text-blue-500 text-2xl hover:text-blue-400 transition-colors"
            >
              <i className="ri-group-fill"></i>
            </button>
          </header>
          <div className="conversation-area flex flex-grow flex-col p-4 overflow-y-auto">
            <div
              ref={messageBoxRef}
              className="message-box flex-grow flex flex-col gap-4 overflow-y-auto"
            >
              {messages.map((msg, index) => {
                const isOutgoing = msg.sender._id === user._id;
                const isAI = msg.sender._id === "ai";
                const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg._id || index} // Ensure unique key
                    className={`message flex flex-col rounded-lg p-2 shadow-md ${isAI ? "max-w-full" : "max-w-[70%]"
                      } ${isOutgoing
                        ? "ml-auto bg-blue-600 text-white"
                        : "self-start bg-gray-700 text-gray-200"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      {!isOutgoing && (
                        <small
                          className="text-xs font-medium"
                          style={{ color: getColorForSender(msg.sender.name) }}
                        >
                          {msg.sender.name}
                        </small>
                      )}
                    </div>
                    <div className="text-sm">
                      {isAI ? (
                        <WriteAiMessage message={msg.message} />
                      ) : (
                        <div className="break-words">{msg.message}</div>
                      )}
                    </div>
                    <div
                      className={`text-xs text-right ${isOutgoing ? "text-gray-300" : "text-gray-400"
                        }`}
                    >
                      {timestamp}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="inputField w-full flex items-center bg-[#0f1115] p-2 gap-1 rounded-b shadow-md">
            {/* ➕ attachment button */}
            {/* <button
          className="text-gray-400 text-2xl p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="Add attachment"
        >
          <i className="ri-add-line"></i>
        </button> */}

            {/* 😊 emoji picker button */}
            {/* <button
          className="text-gray-400 text-2xl p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="Insert emoji"
        >
          <i className="ri-emotion-line"></i>
        </button> */}

            {/* 📥 expanding textarea with scrollbar */}
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
        <div
          className={`sidePanel flex flex-col gap-4 h-full w-full absolute bg-gray-800 shadow-lg transition-transform ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <header className="flex justify-between items-center p-4 bg-gray-950 shadow-md h-14">
            <div className="flex gap-2 items-center ml-2">
              <i
                className={`${project.users.length <= 1
                  ? "ri-user-fill"
                  : "ri-group-fill"
                  } text-2xl text-blue-500`}
              ></i>
              <h2 className="text-white text-xl font-semibold">
                {project.users.length <= 1
                  ? `Collaborator:`
                  : `Collaborators:`}{" "}
                {project.users.length}
              </h2>
            </div>
            <div className="buttons flex gap-3">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="text-2xl text-blue-500 hover:text-blue-400 transition-colors"
              >
                <i className="ri-user-add-fill"></i>
              </button>
              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className="text-3xl text-blue-500 hover:text-blue-400 transition-colors"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </header>
          <div className="users flex flex-col gap-3 px-3">
            {project.users?.map((user) => (
              <div key={user._id} className="user flex items-center gap-3 bg-gray-900 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="profile rounded-full px-2 py-1 text-xl text-blue-500 bg-gray-800">
                  <i className="ri-user-fill"></i>
                </div>
                <div className="userName text-white font-semibold">
                  {user.name}{" "}
                  {user._id === project.admin?._id && (
                    <span className="text-yellow-500 text-sm">(admin)</span>
                  )}
                  <div className="email text-gray-400 text-xs">
                    {user.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="right flex flex-grow h-full overflow-hidden">
        <div className="explorer bg-gray-900 h-full w-56 flex flex-col border-r border-gray-700 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-700 h-14 px-4">
            <div className="text-white font-semibold">EXPLORER</div>
            <div className="text-blue-500 text-xl flex gap-3">
              <button
                onClick={() => setIsCreatingFile(true)}
                className="hover:text-blue-400 transition-colors"
              >
                <i className="ri-file-add-line"></i>
              </button>
              {/* <button
                onClick={() => setIsCreatingFolder(true)}
                className="hover:text-blue-400 transition-colors"
              >
                <i className="ri-folder-add-line"></i>
              </button> */}
            </div>
          </div>
          <div className="file-tree w-full p-4">
            {/* Input for New File Name */}
            {isCreatingFile && (
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
                onBlur={() => setIsCreatingFile(false)}
                className="border p-2 rounded w-full outline-none bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter file name..."
                autoFocus
              />
            )}
            {/* File Tree Rendering */}
            <div>{renderFileTree(fileTree)}</div>
          </div>
        </div>
        <div className="editor flex-grow h-full w-0 relative">
          {/* Editor and Preview Panel */}
          <div className="code-editor flex flex-col h-full bg-gray-800 w-full">


            {/* Tabs Section */}
            <div className="top h-12 min-h-12 pr-1 flex justify-between w-full bg-gray-900 border-b border-gray-700">
              <div className="tab flex flex-row overflow-y-auto gap-2">
                {openFiles.map((file, index) => (
                  <div
                    key={`${file}-${index}`}
                    className={`header flex items-center px-4 py-2 gap-2 rounded-t-lg border-b-2 ${currentFile === file ? "border-blue-500 bg-gray-800" : "border-transparent hover:bg-gray-700"} transition-all duration-200`}
                  >
                    <button
                      onClick={() => setCurrentFile(file)}
                      className="text-white flex items-center gap-2"
                    >
                      <i className="ri-file-line text-blue-500"></i>
                      <p className="font-semibold text-lg">{file}</p>
                    </button>
                    <button
                      onClick={() => {
                        const updatedFiles = openFiles.filter((f) => f !== file);
                        setOpenFiles(updatedFiles);
                        if (currentFile === file) {
                          setCurrentFile(updatedFiles.length > 0 ? updatedFiles[0] : null);
                        }
                      }}
                      className="text-xl cursor-pointer text-blue-500 hover:text-red-500 transition-all duration-200"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="actions flex gap-2 py-1 ">
                <button
                  onClick={async () => {
                    if (isInstalling) return; // Prevent multiple installs
                    setIsInstalling(true);

                    await webContainer?.mount(fileTree);
                    const installProcess = await webContainer.spawn("npm", ["install"]);

                    installProcess.output.pipeTo(new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      }
                    }));

                    await installProcess.exit;
                    setIsInstalling(false);
                    setIsInstalled(true);
                    setIsPreviewPanelOpen(!isPreviewPanelOpen); // Open preview panel after autoSave
                  }}

                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  {isInstalling ? "Installing..." : "Install"}
                </button>


                <button
                  onClick={async () => {
                    if (runProcess) {
                      await runProcess.kill();
                    }

                    await webContainer.mount(fileTree); // Mount before running

                    const process = await webContainer.spawn("npm", ["start"]);
                    setRunProcess(process);


                    process.output.pipeTo(new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      }
                    }));


                    webContainer.on("server-ready", (port, url) => {
                      console.log("Server running on:", url);
                      setIframeUrl(url);

                      // 🔹 Server run hone ke baad hi save karna
                      autoSave(fileTree);

                      // 🔹 Preview Panel ko open karna
                      setIsPreviewPanelOpen(!isPreviewPanelOpen);
                    });
                  }}

                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Run
                </button>

                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="bg-gray-950 text-blue-500 p-1 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200"
                >
                  {Object.keys(THEMES).map(themeName => (
                    <option key={themeName} value={themeName}>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                  className='cursor-pointer text-blue-500 text-xl bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200'
                  title="preview">
                  <i className="ri-arrow-up-s-line p-2"></i>
                </button>


              </div>
            </div>

            {/* Code Editor Section */}
            <div className="bottom flex w-full flex-grow overflow-y-auto">

              {currentFile ? (
                <div className="h-full w-full">
                  <CodeMirror
                    key={currentFile} // Ensures re-render on file change
                    value={currentFile ? getFileContent(currentFile, fileTree) : ''}
                    theme={THEMES[selectedTheme]}
                    extensions={codeMirrorExtensions}
                    className=" w-full h-full"
                    height="100%"
                    onChange={(value) => {
                      setFileTree((prevFileTree) => {
                        const newTree = structuredClone(prevFileTree);
                        const parts = currentFile.split("/");
                        let current = newTree;

                        for (let i = 0; i < parts.length - 1; i++) {
                          if (!current[parts[i]]) return prevFileTree;
                          current = current[parts[i]];
                        }

                        if (current[parts[parts.length - 1]]?.file) {
                          current[parts[parts.length - 1]].file.contents = value;
                        }

                        return newTree;
                      });

                      // 🔥 Hot Reload Bina Server Restart Kiye
                      webContainer.mount(fileTree);
                    }}

                  />
                </div>
              ) : (
                <div className="h-full w-full">
                  <div className="flex flex-col items-center justify-center h-full w-full text-white text-lg bg-gray-850">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-blue-500 mb-4">Welcome to Your Project</h1>
                      <p className="text-gray-400 mb-6">Select a file from the explorer to start editing.</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setIsCreatingFile(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          Create New File
                        </button>
                        {/* <button
                          onClick={() => setIsCreatingFolder(true)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg"
                        >
                          Create New Folder
                        </button> */}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* <button onClick={() => setReloadKey(prev => prev + 1)}>Reload</button> */}
          {iframeUrl && webContainer && (
            <div className={`preview h-full w-full box-border max-w-full flex flex-grow flex-col items-center bg-gray-900 absolute transition-transform duration-300 ${isPreviewPanelOpen ? 'translate-y-0' : '-translate-y-full'}`}>
              <div className="header h-12 min-h-12 px-1 flex justify-between w-full bg-gray-900 border-b border-gray-700">
                <input type="text"
                  onChange={(e) => setIframeUrl(e.target.value)}
                  value={iframeUrl}
                  className="w-[94%] p-2  text-white bg-gray-700 outline-none rounded-full m-1"
                />
                <button
                  onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                  className='cursor-pointer text-blue-500 text-xl m-1 bg-gray-950 rounded-lg hover:bg-gray-700 p-2 transition-all duration-200'>
                  <i className="ri-arrow-down-s-line text-blue-500"></i>
                </button>
              </div>
              <iframe key={reloadKey} src={iframeUrl} className="w-full h-full bg-white"></iframe>
            </div>
          )}
          {/* )} */}
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75"
          onClick={() => setSearchQuery("")} // Reset search query on outside click
        >
          <div
            className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()} // Prevent resetting when clicking inside the modal
          >
            <h2 className="text-white text-xl font-semibold mb-4 text-center">
              Select a Collaborator
            </h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="ml-[10%] w-[80%] p-2 mb-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none "
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
              value={searchQuery} // Bind input value to state
            />
            <div className="addCollaborators max-h-60 overflow-y-auto flex flex-col gap-3">
              {users
                .filter(
                  (user) =>
                    !project.users.some(
                      (projectUser) => projectUser._id === user._id
                    ) &&
                    (user.name.toLowerCase().includes(searchQuery) ||
                      user.email.toLowerCase().includes(searchQuery))
                ).length > 0 ? (
                users
                  .filter(
                    (user) =>
                      !project.users.some(
                        (projectUser) => projectUser._id === user._id
                      ) &&
                      (user.name.toLowerCase().includes(searchQuery) ||
                        user.email.toLowerCase().includes(searchQuery))
                  )
                  .map((user) => (
                    <div
                      key={user._id} // Ensure unique key
                      className={`user flex items-center gap-3 p-3 rounded-lg cursor-pointer ${Array.from(selectedUserIds).includes(user._id)
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-900 hover:bg-gray-800"
                        } transition-colors`}
                      onClick={() => handleUserClick(user._id)}
                    >
                      <div className="profile rounded-full px-2 py-1 text-xl text-blue-500 bg-gray-800">
                        <i className="ri-user-fill"></i>
                      </div>
                      <div className="userName text-white font-semibold">
                        {user.name}
                        <div className="email text-gray-400 text-xs">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-gray-400">
                  No users available to add as collaborators.
                </div>
              )}
            </div>
            <div className="flex justify-between gap-4 mt-4">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Close
              </button>
              <button
                onClick={addCollaborators}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                disabled={selectedUserIds.size === 0}
              >
                Add Collaborator
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;