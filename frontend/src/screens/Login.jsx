import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/UserProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    axios.post('/users/login', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate('/home');
      }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to DevSync AI</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
              <i className="ri-mail-line absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
              <i className="ri-lock-line absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-lg font-semibold text-white transition-all"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-all">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;