/* eslint-disable no-unused-vars */
import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [isPromptShow , setIsPromptShow] = useState(false);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, setLoading, isPromptShow, setIsPromptShow }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
