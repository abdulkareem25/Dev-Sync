import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiLogOut, FiTrash2, FiUser, FiDownload, FiPlay, FiFolder, FiSettings, FiHelpCircle } from 'react-icons/fi';

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const navigate = useNavigate();

  // Show 'Guest' if no user is logged in
  const displayName = user?.name ? user.name : 'Guest';

  // Fetch projects with error handling
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/projects/all');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      alert('Failed to load projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create project with validation
  const createProject = async (e) => {
    e.preventDefault();
    
    if (!user?.token) {
      alert('Please login or register to create a project.');
      navigate('/login');
      return;
    }

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      alert('Project name cannot be empty');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await axios.post('/projects/create', {
        name: trimmedName,
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      setProjects(prev => [res.data, ...prev]);
      setIsModalOpen(false);
      setProjectName('');
    } catch (error) {
      console.error('Project creation failed:', error);
      alert(`Failed to create project: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // Logout with confirmation
  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    
    try {
      await axios.get('/users/logout', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  // Delete project with confirmation
  const deleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) return;
    
    try {
      setDeleteLoading(projectId);
      await axios.delete(`/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Failed to delete project: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Close modal on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Navigation Bar */}
      <nav className='p-4 bg-gray-800 shadow-xl'>
        <div className='flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4'>
          <div className="flex items-center">
            <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <FiFolder className="text-white text-xl" />
            </div>
            <h1 className='text-xl md:text-2xl font-bold text-blue-400'>DevSync: AI Collaboration Platform</h1>
          </div>
          
          <div className='flex gap-3'>
            {user ? (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm'
                >
                  <FiPlus /> New Project
                </button>
                <div className="flex items-center gap-2 ml-2 border-l border-gray-700 pl-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <FiUser />
                  </div>
                  <span className="hidden md:inline text-sm">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className='bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm'
                  title="Logout"
                >
                  <FiLogOut />
                </button>
              </>
            ) : (
              <div className='flex gap-3'>
                <button
                  onClick={() => navigate('/login')}
                  className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all text-sm'
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all text-sm'
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className='text-3xl md:text-4xl font-bold text-white mb-4'>
            Welcome, <span className='text-blue-400'>{displayName}</span>
          </h1>
          <p className='text-gray-400 text-lg max-w-2xl mx-auto'>
            Collaborate in real-time with AI assistance. Create, manage, and run your projects efficiently.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-3 rounded-lg mr-4">
                <FiFolder className="text-blue-400 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{projects.length}</h3>
                <p className="text-gray-400 text-sm">Total Projects</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-3 rounded-lg mr-4">
                <FiDownload className="text-green-400 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">5</h3>
                <p className="text-gray-400 text-sm">Dependencies Installed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-500/20 p-3 rounded-lg mr-4">
                <FiPlay className="text-purple-400 text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">12</h3>
                <p className="text-gray-400 text-sm">Projects Executed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className='text-2xl font-bold text-white'>Your Projects</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm'
              >
                <FiPlus /> Create Project
              </button>
              <button
                className='bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm'
                onClick={() => alert('Help documentation will open')}
              >
                <FiHelpCircle /> Help
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Projects Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => navigate(`/project`, { state: { project } })}
                  className={`p-6 rounded-xl bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all border-2 relative group ${
                    user && project.admin?._id === user._id
                      ? 'border-blue-500'
                      : 'border-gray-700'
                  }`}
                >
                  {/* Project Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.admin?._id === user?._id && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteProject(project._id, project.name);
                        }}
                        className='bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-all'
                        title="Delete Project"
                        disabled={deleteLoading === project._id}
                      >
                        {deleteLoading === project._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          <FiTrash2 />
                        )}
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        alert('Project settings will open');
                      }}
                      className='bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all'
                      title="Settings"
                    >
                      <FiSettings />
                    </button>
                  </div>

                  <div className="flex items-start mb-4">
                    <div className="bg-blue-500/20 p-3 rounded-lg mr-4">
                      <FiFolder className="text-blue-400 text-xl" />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold text-white mb-1 truncate max-w-[200px]'>{project.name}</h3>
                      <div className='flex items-center gap-2 text-gray-400 text-sm'>
                        <FiUser className="text-gray-500" />
                        <span>{project.admin?.name}</span>
                        {user && project.admin?._id === user._id && (
                          <span className='ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full'>
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        alert('Dependencies will be installed');
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <FiDownload /> Install
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        alert('Code will be executed');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <FiPlay /> Run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && projects.length === 0 && (
            <div className='text-center py-12 border-2 border-dashed border-gray-700 rounded-xl'>
              <div className='text-blue-400 text-5xl mb-4'>
                <FiFolder className="mx-auto" />
              </div>
              <p className='text-gray-400 text-lg mb-6'>
                No projects found. Create your first project to get started!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg flex items-center justify-center gap-2 mx-auto'
              >
                <FiPlus /> Create New Project
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-16">
          <h2 className='text-2xl font-bold text-white mb-6'>Recent Activity</h2>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-700">
              {[
                { id: 1, user: "You", action: "created", project: "E-commerce API", time: "2 hours ago" },
                { id: 2, user: "Sarah Johnson", action: "updated", project: "AI Chatbot", time: "4 hours ago" },
                { id: 3, user: "You", action: "executed", project: "Weather App", time: "1 day ago" },
                { id: 4, user: "Michael Chen", action: "added dependency", project: "Payment Gateway", time: "2 days ago" },
              ].map(activity => (
                <div key={activity.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                      <FiUser />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300">
                        <span className="font-medium">{activity.user}</span> {activity.action} <span className="text-blue-400">{activity.project}</span>
                      </p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div 
          className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'
          onClick={handleBackdropClick}
        >
          <div 
            className='bg-gray-800 rounded-xl p-6 w-full max-w-md relative'
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className='absolute top-4 right-4 text-gray-400 hover:text-white text-xl'
              aria-label="Close modal"
            >
              &times;
            </button>
            
            <h3 id="modal-title" className='text-2xl font-bold text-white mb-6'>
              Create New Project
            </h3>
            
            <form onSubmit={createProject}>
              <label htmlFor="project-name" className='block text-gray-300 mb-2'>
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className='w-full px-4 py-3 bg-gray-700 rounded-lg text-white mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                required
                autoFocus
                maxLength={60}
              />
              
              <div className='flex justify-end gap-4'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-6 py-2 text-gray-300 hover:text-white transition-all'
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-all flex items-center justify-center min-w-[120px]'
                  disabled={createLoading || !projectName.trim()}
                >
                  {createLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiPlus className="mr-2" /> Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;