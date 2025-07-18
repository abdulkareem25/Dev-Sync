// /components/CollaboratorsPanel.jsx
import React from 'react';

const CollaboratorsPanel = ({
  isOpen,
  onClose,
  project,
  collaborators,
  ONLINE_TIMEOUT,
  removeCollaborator,
  onAddCollaboratorClick
}) => {
  return (
    <div className={`sidePanel absolute inset-0 bg-gray-800/95 backdrop-blur-xl w-[350px] transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <header className="flex justify-between items-center p-4 bg-gray-900 h-16 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <i className="ri-team-line text-2xl text-blue-400"></i>
          <h2 className="text-white text-lg font-semibold">
            Collaborators ({project.users.length})
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddCollaboratorClick}
            className="text-blue-400 hover:text-blue-300 text-xl p-2 rounded-lg transition-all"
            title="Add Collaborator"
          >
            <i className="ri-user-add-line"></i>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 text-2xl p-2 rounded-lg transition-all"
            title="Close Collaborators Panel"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      </header>
      <div className="users-list p-4 space-y-3 overflow-y-auto">
        {project.users?.map((user) => {
          const collaborator = collaborators[user._id];
          const isOnline = collaborator && collaborator.lastActive && (Date.now() - collaborator.lastActive < ONLINE_TIMEOUT);
          return (
            <div key={user._id} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                  <i className="ri-user-3-line text-blue-400"></i>
                  {isOnline && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full z-50"></span>
                  )}
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
                  <div className="text-gray-400 text-sm">{user.email}</div>
                </div>
              </div>
              {user._id !== project.admin?._id && (
                <button
                  onClick={() => removeCollaborator(user._id)}
                  className="absolute right-7 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all"
                  title="Remove Collaborator"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollaboratorsPanel;