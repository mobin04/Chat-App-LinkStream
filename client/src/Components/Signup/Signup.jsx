import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loader from '../Loader/Loader';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const [showErr, setShowErr] = useState(false);
  const { setUser } = useContext(AuthContext);
  const [isLoading, setLoading] = useState(false);
  const Navigate = useNavigate();

  useEffect(() => {
    if (err) {
      setShowErr(true);
      const timer = setTimeout(() => {
        setShowErr(false);
        setError('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [err]);

  const handleSignup = async (name, email, pass) => {
    if (!name || !email || !pass) {
      setError('Please fill out all fields');
      return;
    }

    if (pass.length < 6) {
      setError('Password must atleast 6 characters');
      return;
    }

    try {
      setLoading(true);
      // Send login request
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/signup`,
        {
          name,
          email: email.toLowerCase(),
          password: pass,
        },
        {
          withCredentials: true,
        }
      );

      if (res.data.status === 'success') {
        const userRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/me`,
          {
            withCredentials: true,
          }
        );
        setUser(userRes.data.data.user);
        setLoading(false);
        Navigate('/');
      } else {
        setError('Signup failed! Please try again');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError(
        error?.response?.data?.message || 'Login failed! Please try again'
      );
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className="main-container">
        <div className="login-container">
          <div className="logo-text">
            <h1>
              Link<span>Stream</span>
            </h1>
          </div>
          <div className="input-container">
            <div className="fields">
              <label htmlFor="name">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                type="text"
                required
              />
              <label htmlFor="email">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                required
              />
              <label htmlFor="password">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6-Digit required"
                type="password"
                required
              />
              {showErr ? <p className="error-msg-popup">{err}</p> : ''}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSignup(name, email, password);
            }}
            className="submit-btn"
          >
            submit
          </button>
          <p onClick={() => Navigate('/login')} className="sign-up-btn">
            Already have an account?
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
