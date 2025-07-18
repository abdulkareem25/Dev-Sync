// /components/AddCollaboratorsModal.jsx
import React from 'react';

const AddCollaboratorsModal = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredUsers,
  selectedUserIds,
  handleUserClick,
  addCollaborators
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
  );
};

export default AddCollaboratorsModal;