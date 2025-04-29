import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const { setLoading, setUser } = useContext(AuthContext);
  const Navigate = useNavigate();

  useEffect(() => {
    if (err) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [err]);

  const handleLogin = async (email, pass) => {
    if (!email || !pass) {
      setError(`Are you forgot to enter your email and password ?`);
      return;
    }
    try {
      setLoading(true); // set to true
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/login`,
        {
          email,
          password: pass,
        },
        {
          withCredentials: true,
        }
      );

      if(res.response.data.status === 'success'){
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/me`, {
          withCredentials: true,
        });
        setUser(res.data.data.user);
        setLoading(false);
      }

      Navigate('/');
    } catch (error) {
      console.log(error);
      setLoading(false);
      setError(error.response.data.message);
    }
  };

  return (
    <div className="main-container">
      <div className="login-container">
        <div className="logo-text">
          <h1>
            Link<span>Stream</span>
          </h1>
        </div>
        <div className="input-container">
          <div className="fields">
            <label htmlFor="email">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="text"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            {showError ? (
              <p className="error-msg-popup">
                {err || 'Login failed! Please try again'}
              </p>
            ) : (
              ''
            )}
          </div>
          <p className="forgot-btn">Forgot Password</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
          className="submit-btn"
        >
          submit
        </button>
        <p onClick={() => Navigate('/signup')} className="sign-up-btn">
          Don't have an account?
        </p>
      </div>
    </div>
  );
}

export default Login;
