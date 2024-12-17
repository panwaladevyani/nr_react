import React, { useState } from 'react';
import axiosInstance from './axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post('/login', formData);
            const token = response.data.token; // Assuming the response contains a token
            if (token) {
                localStorage.setItem('authToken', token); // Save the token in localStorage

                // Optionally, save username if available in response (if not already in token)
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                const username = decodedToken.username;
                localStorage.setItem('username', username); // Store username
            }
            toast.success(response.data.message);
            navigate('/dashboard');
            // Redirect to dashboard or another page
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            toast.error(errorMessage);
            console.error('Error:', error.response);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Log In</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Log In</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
