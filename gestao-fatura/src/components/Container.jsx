import React from 'react';
import './Container.css';

const Container = ({ title, children }) => {
  return (
    <div className="container">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
};

export default Container;