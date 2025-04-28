// Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <h2>Link<span>Stream</span></h2>
            <p>Connect and chat in real-time with people around the world.</p>
          </div>
          <div className="footer-links">
            <div className="footer-links-column">
              <h3>Company</h3>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/blog">Blog</a></li>
              </ul>
            </div>
            <div className="footer-links-column">
              <h3>Features</h3>
              <ul>
                <li><a href="/chat">Chat</a></li>
                <li><a href="/groups">Groups</a></li>
                <li><a href="/direct-messages">Direct Messages</a></li>
                <li><a href="/profile">Profile</a></li>
              </ul>
            </div>
            <div className="footer-links-column">
              <h3>Support</h3>
              <ul>
                <li><a href="/help">Help Center</a></li>
                <li><a href="/faq">FAQ</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="social-links">
            <a href="#" className="social-icon facebook">
              <span className="sr-only">Facebook</span>
            </a>
            <a href="#" className="social-icon twitter">
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="social-icon instagram">
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="social-icon discord">
              <span className="sr-only">Discord</span>
            </a>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} LinkStream By Mobin. All rights reserved.</p>
          </div>
          <div className="language-selector">
            <select>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;