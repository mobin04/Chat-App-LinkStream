import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const [showErr, setShowErr] = useState(false);
  const { setUser, setLoading } = useContext(AuthContext);
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

  const handleSignup = (name, email, pass) => {
    if (!name || !email || !pass) {
      setError('All fields are mandatory');
      return;
    }

    try {
      axios.post(
        'http://localhost:8000/api/v1/users/signup',
        {
          name,
          email,
          password: pass,
        },
        {
          withCredentials: true,
        }
      );

      setTimeout(async () => {
        const res = await axios.get('http://localhost:8000/api/v1/users/me', {
          withCredentials: true,
        });
        setUser(res.data.data.user);
        setLoading(false);
      }, 2000);

      Navigate('/');
      
    } catch (err) {
      setError(err.response.data.message);
    }
  };

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
                type="text"
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
