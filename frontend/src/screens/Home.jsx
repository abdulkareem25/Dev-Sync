import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);

  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();

    if (!user || !user._id) {
      console.error("User data is not available. Please check if the user is logged in.");
      return;
    }

    if (!projectName.trim()) {
      console.error("Project name is required.");
      return;
    }

    axios.post('/projects/create', {
      name: projectName,
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    })
    .then((res) => {
      console.log("Project created successfully:", res.data);
      setIsModalOpen(false);
      setProjectName("");
      setProjects([...projects, res.data]);
    })
    .catch((error) => {
      console.error("Error creating project:", error.response?.data || error.message);
    });
  }

  // Updated handleLogout to call the backend logout endpoint and clear local storage
  function handleLogout() {
    axios.get('/users/logout')
      .then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/'); // Redirect to login after logout
      })
      .catch(err => console.error("Error logging out:", err));
  }

  useEffect(() => {
    axios.get('/projects/all')
      .then((res) => {
        setProjects(res.data.projects);
      })
      .catch(err => console.log(err));
  }, []); // Removed fetching `loggedInUser` as `user` from context is used directly

  return (
    <main className='text-white bg-gray-900 h-screen'>
      <header className='p-10 text-5xl font-semibold text-center'>
        Welcome to DevSync AI, <span className='text-blue-500'>{user?.name || 'Guest'}</span>
      </header>
      <section className='flex items-center justify-center flex-col h-[70%]'>
        <h1 className='mb-4 text-3xl font-bold'>Manage Your Projects Seamlessly</h1>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-7 rounded-lg shadow-md transition-all duration-300 cursor-pointer mb-6'>
            <span className='mr-2'>Create New Project</span>
            <i className="ri-add-line"></i>
          </button>
        )}

        <div className='absolute top-10 right-10'>
          {user ? (
            <button
              onClick={handleLogout}
              className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 cursor-pointer'>
              Logout
            </button>
          ) : (
            <div className='flex gap-4'>
              <button
                onClick={() => navigate('/login')}
                className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 cursor-pointer'>
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className='bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 cursor-pointer'>
                Register
              </button>
            </div>
          )}
        </div>

        <h2 className='mt-8 mb-4 text-2xl font-semibold'>Your Projects</h2>
        <div className='flex gap-4 flex-wrap justify-center w-[85%]'>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id}
                onClick={() => navigate(`/project`, { state: { project } })}
                className={`project bg-white text-blue-600 hover:bg-blue-200 font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-center items-center h-40 w-60 border-2 ${user && project.admin?._id === user._id ? 'border-yellow-500' : 'border-gray-300'}`}>
                <h3 className='text-lg font-bold'>{project.name}</h3>
                <p className='text-sm'>Admin: {project.admin?.name}</p>
              </div>
            ))
          ) : (
            <p className='text-gray-400'>No projects found. Create your first project now!</p>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-white text-xl font-semibold mb-4 text-center">Enter Project Name</h2>
              <form onSubmit={createProject}>
                <input
                  type="text"
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project Name"
                  required
                />
                <div className="flex justify-between gap-4">
                  <button type="button"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
      <footer className='text-center py-4 bg-gray-800 text-gray-400'>
        &copy; 2025 Project Manager. All rights reserved.
      </footer>
    </main>
  );
};

export default Home;
