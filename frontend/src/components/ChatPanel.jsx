// /components/ChatPanel.jsx
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WriteAiMessage from './WriteAiMessage';

const ChatPanel = ({
  project,
  messages,
  user,
  message,
  setMessage,
  send,
  isSidePanelOpen,
  setIsSidePanelOpen,
  getColorForSender
}) => {
  const navigate = useNavigate();
  const messageBoxRef = useRef(null);

  useEffect(() => {
    if (messageBoxRef.current) {
      setTimeout(() => {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  return (
    <section className="left relative h-full flex flex-col w-[350px] bg-gray-800/80 shadow-2xl backdrop-blur-sm border-r border-gray-700">
      <div className="chats h-full flex flex-col">
        <header className="flex items-center justify-between w-full bg-gray-900/90 p-4 h-16 border-b border-gray-700 backdrop-blur-sm">
          <button
            onClick={() => navigate('/')}
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
            title="Show/Hide Collaborators"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div ref={messageBoxRef} className="conversation-area flex flex-grow flex-col p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isOutgoing = msg.sender._id === user._id;
              const isAI = msg.sender._id === "ai";
              let timestamp = '--:--';
              if (msg.createdAt) {
                const date = new Date(msg.createdAt);
                if (!isNaN(date.getTime())) {
                  timestamp = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                }
              }

              return (
                <div
                  key={msg._id || index}
                  className={`message flex flex-col rounded-xl p-3 shadow-lg ${isAI ? "w-full bg-gray-700" : isOutgoing ? "ml-auto bg-blue-600/90 text-white" : "self-start bg-gray-700/50 text-gray-200"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    {!isOutgoing && !isAI && (
                      <span className="text-xs font-medium" style={{ color: getColorForSender(msg.sender.name) }}>
                        {msg.sender.name}
                      </span>
                    )}
                    {isAI && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <span className="text-sm font-semibold">AI Assistant</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm mb-1">
                    {isAI ? <WriteAiMessage message={msg.message} /> : <div className="break-words">{msg.message}</div>}
                  </div>
                  <div className={`text-xs ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                    {timestamp}
                  </div>
                </div>
              );
            })}
        </div>

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
                    e.target.style.height = 'auto';
                  }
                }
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded outline-none resize-none p-2 min-h-[40px] max-h-40 overflow-y-auto [&::-webkit-scrollbar]:[width:2.5px] [&::-webkit-scrollbar-thumb]:bg-blue-200 [&::-webkit-scrollbar-track]:bg-blue-800 [&::-webkit-scrollbar-thumb]:rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              if (message.trim()) {
                send(message.trim());
                setMessage('');
                const textarea = document.querySelector('textarea');
                if (textarea) textarea.style.height = 'auto';
              }
            }}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Send Message"
            aria-label="Send Message"
          >
            <i className="ri-send-plane-2-fill ml-0.5 text-xl"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChatPanel;