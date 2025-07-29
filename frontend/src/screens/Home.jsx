import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, admin, member
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Show 'Guest' if no user is logged in
  const displayName = user?.name ? user.name : 'Guest';

  // Filter projects based on search and filter criteria
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterBy === 'all' || 
      (filterBy === 'admin' && project.admin?._id === user?._id) ||
      (filterBy === 'member' && project.admin?._id !== user?._id);
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    total: projects.length,
    adminProjects: projects.filter(p => p.admin?._id === user?._id).length,
    memberProjects: projects.filter(p => p.admin?._id !== user?._id).length,
    recentProjects: projects.filter(p => {
      const projectDate = new Date(p.createdAt || Date.now());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return projectDate > weekAgo;
    }).length
  };

  function createProject(e) {
    e.preventDefault();
    if (!user || !user._id) {
      alert('Please login or register to create a project.');
      return;
    }
    if (!projectName.trim()) return;

    axios.post('/projects/create', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      name: projectName.trim(),
    }).then((res) => {
      setIsModalOpen(false);
      setProjectName("");
      setProjects([...projects, res.data]);
    }).catch(console.error);
  }

  function handleLogout() {
    if (!window.confirm('Are you sure you want to logout?')) return;
    axios.get('/users/logout')
      .then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
        window.location.reload();
      }).catch(console.error);
  }

  const deleteProject = (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) return;
    axios
      .delete(`/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(() => {
        setProjects(projects.filter(p => p._id !== projectId));
        alert(`Project "${projectName}" has been deleted.`);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to delete project: " + err.response?.data?.error || err.message);
      });
  };

  useEffect(() => {
    if (user) {
      axios.get('/projects/all')
        .then((res) => setProjects(res.data.projects))
        .catch(console.error);
    }
  }, [user]);

  // Features data for guest users
  const features = [
    {
      icon: "ri-shield-check-line",
      title: "Secure Authentication",
      description: "JWT-based secure login and registration system with robust user management"
    },
    {
      icon: "ri-team-line",
      title: "Project Management",
      description: "Create projects, invite collaborators, and manage team workflows efficiently"
    },
    {
      icon: "ri-chat-3-line",
      title: "Real-Time Chat",
      description: "Project-specific chat rooms powered by Socket.io for instant communication"
    },
    {
      icon: "ri-robot-line",
      title: "AI Assistant",
      description: "Leverage AI for code generation, debugging, and comprehensive code reviews"
    },
    {
      icon: "ri-server-line",
      title: "Live Code Execution",
      description: "Generate, edit, and run server code directly in your browser environment"
    },
    {
      icon: "ri-dashboard-line",
      title: "Collaborative Workspace",
      description: "Seamless team collaboration with integrated tools and real-time updates"
    }
  ];

  const techStack = [
    { name: "React.js", color: "text-blue-400" },
    { name: "Node.js", color: "text-green-400" },
    { name: "MongoDB", color: "text-green-500" },
    { name: "Socket.io", color: "text-purple-400" },
    { name: "Redis", color: "text-red-400" },
    { name: "AI Integration", color: "text-yellow-400" }
  ];

  return (
    <main className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      {/* Navigation Bar */}
      <nav className='p-6 bg-gray-800/90 backdrop-blur-sm shadow-xl border-b border-gray-700 sticky top-0 z-40'>
        <div className='flex justify-between items-center max-w-7xl mx-auto'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <i className="ri-code-s-slash-line text-white text-xl"></i>
            </div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
              Dev-Sync
            </h1>
          </div>
          <div className='flex items-center gap-4'>
            {user ? (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg'
                >
                  <i className="ri-add-line"></i> New Project
                </button>
                
                {/* User Menu */}
                <div className='relative'>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className='flex items-center gap-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all'
                  >
                    <div className='w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center'>
                      <span className='text-white font-semibold text-sm'>
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className='text-white font-medium'>{user.name}</span>
                    <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {showUserMenu && (
                    <div className='absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2'>
                      <div className='px-4 py-2 border-b border-gray-700'>
                        <p className='text-sm text-gray-400'>Signed in as</p>
                        <p className='text-white font-medium'>{user.name}</p>
                      </div>
                      <button
                        onClick={() => {/* Navigate to profile */}}
                        className='w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-all flex items-center gap-2'
                      >
                        <i className="ri-user-line"></i> Profile
                      </button>
                      <button
                        onClick={() => {/* Navigate to settings */}}
                        className='w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-all flex items-center gap-2'
                      >
                        <i className="ri-settings-3-line"></i> Settings
                      </button>
                      <hr className='border-gray-700 my-2' />
                      <button
                        onClick={handleLogout}
                        className='w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 transition-all flex items-center gap-2'
                      >
                        <i className="ri-logout-box-line"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className='flex gap-4'>
                <button
                  onClick={() => navigate('/login')}
                  className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg transition-all shadow-lg'
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-2 rounded-lg transition-all shadow-lg'
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {user ? (
        // Enhanced Dashboard for Logged in Users
        <>
          {/* Dashboard Header */}
          <section className='py-8 px-4'>
            <div className='max-w-7xl mx-auto'>
              <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8'>
                <div>
                  <h1 className='text-4xl font-bold text-white mb-2'>
                    Welcome back, <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>{displayName}</span>
                  </h1>
                  <p className='text-gray-400 text-lg'>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                {/* Quick Actions */}
                {/* <div className='flex flex-wrap gap-4'>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg'
                  >
                    <i className="ri-add-line"></i> New Project
                  </button>
                  <button
                    onClick={() => {}}
                    className='bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-all flex items-center gap-2'
                  >
                    <i className="ri-layout-grid-line"></i> Templates
                  </button>
                  <button
                    onClick={() => {}}
                    className='bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-all flex items-center gap-2'
                  >
                    <i className="ri-download-cloud-line"></i> Import
                  </button>
                </div> */}
              </div>

              {/* Statistics Cards */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <div className='bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-blue-400 text-sm font-medium'>Total Projects</p>
                      <p className='text-3xl font-bold text-white'>{stats.total}</p>
                    </div>
                    <div className='w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                      <i className="ri-folder-line text-blue-400 text-xl"></i>
                    </div>
                  </div>
                </div>
                
                <div className='bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-green-400 text-sm font-medium'>Admin Projects</p>
                      <p className='text-3xl font-bold text-white'>{stats.adminProjects}</p>
                    </div>
                    <div className='w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center'>
                      <i className="ri-crown-line text-green-400 text-xl"></i>
                    </div>
                  </div>
                </div>
                
                <div className='bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-purple-400 text-sm font-medium'>Member Projects</p>
                      <p className='text-3xl font-bold text-white'>{stats.memberProjects}</p>
                    </div>
                    <div className='w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center'>
                      <i className="ri-team-line text-purple-400 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Projects Section */}
          <div className='max-w-7xl mx-auto px-4 pb-20'>
            <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8'>
              <h2 className='text-3xl font-bold text-white'>Your Projects</h2>
              
              {/* Search and Filter Bar */}
              <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto'>
                <div className='relative'>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full sm:w-64 px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className='px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500'
                >
                  <option value="all">All Projects</option>
                  <option value="admin">Admin Projects</option>
                  <option value="member">Member Projects</option>
                </select>
                
                <div className='flex bg-gray-700 rounded-lg p-1'>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <i className="ri-grid-line"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <i className="ri-list-check"></i>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Projects Grid/List */}
            {filteredProjects.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredProjects.map((project) => (
                  viewMode === 'grid' ? (
                    <div
                      key={project._id}
                      onClick={() => navigate(`/project`, { state: { project } })}
                      className={`p-6 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 cursor-pointer transition-all border-2 relative shadow-xl hover:shadow-2xl transform hover:-translate-y-1 group ${user && project.admin?._id === user._id
                        ? 'border-blue-500 shadow-blue-500/20'
                        : 'border-gray-600'
                        }`}
                    >
                      {project.admin?._id === user?._id && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteProject(project._id, project.name);
                          }}
                          className='absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100'
                          title="Delete Project"
                        >
                          <i className="ri-delete-bin-5-line text-lg"></i>
                        </button>
                      )}
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                          <i className="ri-folder-line text-white text-xl"></i>
                        </div>
                        <div className='flex-1'>
                          <h3 className='text-xl font-semibold text-white mb-1'>{project.name}</h3>
                          <p className='text-sm text-gray-400'>
                            Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-gray-400'>
                          <i className="ri-user-line"></i>
                          <span>{project.admin?.name}</span>
                        </div>
                        {user && project.admin?._id === user._id && (
                          <span className='px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30'>
                            Admin
                          </span>
                        )}
                      </div>
                      <div className='mt-4 flex items-center gap-4 text-sm text-gray-400'>
                        <span className='flex items-center gap-1'>
                          <i className="ri-time-line"></i>
                          {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        <span className='flex items-center gap-1'>
                          <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                          Active
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={project._id}
                      onClick={() => navigate(`/project`, { state: { project } })}
                      className={`p-4 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 cursor-pointer transition-all border-l-4 relative group ${user && project.admin?._id === user._id
                        ? 'border-l-blue-500'
                        : 'border-l-gray-600'
                        }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                            <i className="ri-folder-line text-white"></i>
                          </div>
                          <div>
                            <h3 className='text-lg font-semibold text-white'>{project.name}</h3>
                            <p className='text-sm text-gray-400'>By {project.admin?.name}</p>
                          </div>
                        </div>
                        <div className='flex items-center gap-4'>
                          {user && project.admin?._id === user._id && (
                            <span className='px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full'>
                              Admin
                            </span>
                          )}
                          <span className='text-sm text-gray-400'>
                            {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                          {project.admin?._id === user?._id && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteProject(project._id, project.name);
                              }}
                              className='text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100'
                              title="Delete Project"
                            >
                              <i className="ri-delete-bin-5-line"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <i className="ri-folder-add-line text-white text-3xl"></i>
                </div>
                <h3 className='text-2xl font-bold text-white mb-4'>
                  {searchTerm || filterBy !== 'all' ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className='text-gray-400 text-lg mb-6'>
                  {searchTerm || filterBy !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Create your first project to get started!'
                  }
                </p>
                {(!searchTerm && filterBy === 'all') && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg transform hover:-translate-y-1'
                  >
                    Create Your First Project
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        // Guest user view remains the same...
        <>
          {/* Hero Section for Guest Users */}
          <section className='text-center py-20 px-4 relative overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl transform -translate-y-1/2'></div>
            
            <div className='relative z-10 max-w-4xl mx-auto'>
              <h1 className='text-6xl md:text-7xl font-bold text-white mb-6 leading-tight'>
                AI-Enhanced{' '}
                <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                  Real-Time
                </span>{' '}
                Project Collaboration
              </h1>
              <p className='text-gray-300 text-xl md:text-2xl mb-8 leading-relaxed'>
                Collaborate, Manage, and Run Projects Efficiently with AI-Powered Tools
              </p>
              <p className='text-gray-400 text-lg mb-12 max-w-2xl mx-auto'>
                A modern, full-stack platform for seamless team collaboration. Create projects, 
                chat in real time, invite collaborators, and leverage AI for code generation 
                and server code execution - all in one place.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={() => navigate('/register')}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg transform hover:-translate-y-1'
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className='border-2 border-gray-600 hover:border-blue-500 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:bg-blue-500/10 text-white'
                >
                  Login
                </button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className='py-20 px-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50'>
            <div className='max-w-7xl mx-auto'>
              <div className='text-center mb-16'>
                <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
                  Powerful Features for{' '}
                  <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                    Modern Teams
                  </span>
                </h2>
                <p className='text-gray-400 text-xl max-w-3xl mx-auto'>
                  Everything you need to build, collaborate, and deploy projects efficiently
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className='p-8 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-2 group'
                  >
                    <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
                      <i className={`${feature.icon} text-white text-2xl`}></i>
                    </div>
                    <h3 className='text-2xl font-bold text-white mb-4'>{feature.title}</h3>
                    <p className='text-gray-400 leading-relaxed'>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className='py-20 px-4'>
            <div className='max-w-6xl mx-auto text-center'>
              <h2 className='text-4xl font-bold text-white mb-6'>
                Built with{' '}
                <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                  Modern Technology
                </span>
              </h2>
              <p className='text-gray-400 text-xl mb-12'>
                Powered by industry-leading tools and frameworks
              </p>
              <div className='flex flex-wrap justify-center gap-6'>
                {techStack.map((tech, index) => (
                  <div
                    key={index}
                    className='px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border border-gray-700 hover:border-blue-500/50 transition-all'
                  >
                    <span className={`font-semibold ${tech.color}`}>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className='py-20 px-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20'>
            <div className='max-w-4xl mx-auto text-center'>
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
                Ready to{' '}
                <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                  Transform
                </span>{' '}
                Your Workflow?
              </h2>
              <p className='text-gray-300 text-xl mb-8'>
                Join thousands of developers already using Dev-Sync for their projects
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={() => navigate('/register')}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg transform hover:-translate-y-1'
                >
                  Start Building Today
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className='border-2 border-gray-600 hover:border-blue-500 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:bg-blue-500/10 text-white'
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className='py-12 px-4 border-t border-gray-800'>
            <div className='max-w-6xl mx-auto text-center'>
              <div className='flex items-center justify-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <i className="ri-code-s-slash-line text-white text-xl"></i>
                </div>
                <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                  Dev-Sync
                </h3>
              </div>
              <p className='text-gray-400 mb-4'>
                AI-Enhanced Real-Time Project Collaboration Platform
              </p>
              <p className='text-gray-500 text-sm'>
                Built with ❤️ for developers, by developers
              </p>
            </div>
          </footer>
        </>
      )}

      {/* Enhanced Create Project Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <div className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700 shadow-2xl'>
            <div className='text-center mb-8'>
              <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                <i className="ri-add-line text-white text-2xl"></i>
              </div>
              <h3 className='text-3xl font-bold text-white'>Create New Project</h3>
              <p className='text-gray-400 mt-2'>Start your next amazing project</p>
            </div>
            <form onSubmit={createProject}>
              <div className='mb-6'>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter an awesome project name..."
                  className='w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                  required
                />
              </div>
              <div className='flex justify-end gap-4'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-6 py-3 text-gray-300 hover:text-white transition-all font-medium'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-lg transition-all font-semibold shadow-lg'
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className='fixed inset-0 z-30' 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </main>
  );
};

export default Home;
