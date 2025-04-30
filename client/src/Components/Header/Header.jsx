// Header.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const Navigate = useNavigate();

  const handleLogout = () => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/logout`, {
        withCredentials: true,
      })
      .then(() => {
        setUser(null);
      });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1 style={{ cursor: 'pointer' }} onClick={() => Navigate('/')}>
            Link<span>Stream</span>
          </h1>
        </div>
        <div className="menu-icon" onClick={toggleMenu}>
          <div className={`menu-line ${isMenuOpen ? 'open' : ''}`}></div>
          <div className={`menu-line ${isMenuOpen ? 'open' : ''}`}></div>
          <div className={`menu-line ${isMenuOpen ? 'open' : ''}`}></div>
        </div>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            <li>
              <a onClick={() => Navigate('/')}>Home</a>
            </li>
            {user ? (
              <li>
                <a onClick={() => (user ? Navigate('/chat') : '')}>Chat</a>
              </li>
            ) : (
              ''
            )}
            <li>
              <a onClick={() => Navigate('/profile')}>Profile</a>
            </li>
          </ul>
        </nav>
        <div className="auth-buttons">
          {user ? (
            <div>
              <button
                onClick={() => {
                  handleLogout();
                  setUser(null);
                  Navigate('/');
                }}
                className="login-btn"
              >
                Log out
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => Navigate('/login')} className="login-btn">
                Login
              </button>
              <button
                onClick={() => Navigate('/signup')}
                className="signup-btn"
              >
                Sign Up
              </button>
            </div>
          )}
          {user && (
            <p className="welcome-user">
              <span>HELLO </span>
              {user.name.split(' ')[0].toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
