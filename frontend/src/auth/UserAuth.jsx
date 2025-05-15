import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

const UserAuth = ({ children }) => {
    const { user, setUser } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            console.log('No token or user found in localStorage. Redirecting to login.');
            setLoading(false); // Ensure loading is set to false before redirecting
            navigate('/login');
            return;
        }

        if (!user) {
            console.log('Validating token with backend...');
            axios.get('/users/me') // Validate token with backend
                .then((res) => {
                    console.log('Token validated. Setting user:', res.data.user);
                    setUser(res.data.user);
                })
                .catch((err) => {
                    console.error('Token validation failed:', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                })
                .finally(() => {
                    console.log('Token validation complete.');
                    setLoading(false); // Set loading to false after validation
                });
        } else {
            console.log('User already set. Stopping loading.');
            setLoading(false); // If user is already set, stop loading
        }
    }, [user, setUser, navigate]);

    if (loading) {
        console.log('Loading...');
        return <div>Loading...</div>; // Show a loading indicator while validating
    }

    return <>{children}</>;
};

export default UserAuth;
