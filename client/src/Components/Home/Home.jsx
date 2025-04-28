// Home.jsx
import React, { useContext, useEffect, useState } from 'react';
import './Home.css';
import { AuthContext } from '../context/AuthContext';
import Loader from '../Loader/Loader';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { isLoading } = useContext(AuthContext);
  const [showLoader, setShowLoader] = useState(true);
  const { user } = useContext(AuthContext);
  const Navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading || showLoader) return <Loader />;

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>
            Connect and Chat in Real-Time with <span>LinkStream</span>
          </h1>
          <p>
            Join thousands of users and start chatting with friends, family, and
            new connections around the world.
          </p>
          <div className="cta-buttons">
            <button
              onClick={() => user?Navigate('/chat'): Navigate('/signup')}
              className="get-started-btn"
            >
              Get Started
            </button>
            <button className="learn-more-btn">Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-avatar"></div>
              <div className="chat-info">
                <h3>Chat Room</h3>
                <p>Online: 28</p>
              </div>
            </div>
            <div className="chat-messages">
              <div className="message">
                <div className="message-avatar"></div>
                <div className="message-content">
                  <p className="message-sender">Alex</p>
                  <p className="message-text">Hey everyone! How's it going?</p>
                </div>
              </div>
              <div className="message">
                <div className="message-avatar"></div>
                <div className="message-content">
                  <p className="message-sender">Maria</p>
                  <p className="message-text">
                    Just finished work! What's the topic today?
                  </p>
                </div>
              </div>
              <div className="message">
                <div className="message-avatar"></div>
                <div className="message-content">
                  <p className="message-sender">John</p>
                  <p className="message-text">
                    I think we're discussing the new features!
                  </p>
                </div>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type your message..." />
              <button>Send</button>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>
          Why Choose <span>LinkStream</span>?
        </h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon real-time"></div>
            <h3>Real-Time Chat</h3>
            <p>
              Instant messaging with no delays. Connect with friends and family
              instantly.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon secure"></div>
            <h3>Secure Connection</h3>
            <p>
              Your conversations are encrypted and secure. Privacy is our
              priority.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon groups"></div>
            <h3>Group Chats</h3>
            <p>
              Create and join group conversations with people who share your
              interests.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon custom"></div>
            <h3>Customizable</h3>
            <p>
              Personalize your profile and chat experience to suit your style.
            </p>
          </div>
        </div>
      </div>

      <div className="join-section">
        <div className="join-content">
          <h2>Ready to start chatting?</h2>
          <p>Join LinkStream today and connect with people around the world!</p>
          <button className="join-now-btn" onClick={() => user? Navigate('/chat') : Navigate('/signup')}>
            {user ? 'Go to chats' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
