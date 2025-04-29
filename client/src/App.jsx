// App.jsx
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './Components/Header/Header';
import Home from './Components/Home/Home';
import Chat from './Components/Chat/Chat';
import Footer from './Components/Footer/Footer';
import './App.css';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';
import { AuthContext } from './Components/context/AuthContext';
import axios from 'axios';

function App() {
  const location = useLocation();
  const isFooter = location.pathname !== '/chat';
  const { setUser } = useContext(AuthContext);
  const {setLoading} = useContext(AuthContext);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const fetchUser = () => {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/me`, {
          withCredentials: true,
        })
        .then((res) => {
          setUser(res.data.data.user);
        })
        .catch(() => {
          setUser(null);
        }).finally(() => {
          setLoading(false);
        })
    };

    fetchUser();
    
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      {isFooter && <Footer />}
    </div>
  );
}

export default App;
