import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-backdrop"></div>
      <div className="loader">
        <div className="circle-container">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="circle" style={{ animationDelay: `${index * 0.11}s` }}></div>
          ))}
        </div>
        <div className="loading-text">Loading</div>
      </div>
    </div>
  );
};

export default Loader;