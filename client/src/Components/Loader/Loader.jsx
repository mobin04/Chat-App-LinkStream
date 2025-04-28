import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="galaxy-loader">
        <div className="center-circle"></div>
        {[...Array(12)].map((_, index) => (
          <div key={index} className="particle" style={{ '--i': index + 1 }}></div>
        ))}
        {[...Array(8)].map((_, index) => (
          <div key={index} className="orbit-dot" style={{ '--j': index + 1 }}></div>
        ))}
      </div>
    </div>
  );
};

export default Loader;