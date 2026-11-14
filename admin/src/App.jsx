import React, { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Login from './components/Login/Login';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Orders from './pages/Orders/Orders';
import List from './pages/List/List';
import Add from './pages/Add/Add';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toasts = (
  <ToastContainer position="top-center" autoClose={3200} limit={3} pauseOnFocusLoss={false} theme="light" />
);

const App = () => {

  const [token,setToken] = useState(localStorage.getItem("adminToken"));
  const location = useLocation();

  const logout = useCallback(()=>{
    localStorage.removeItem("adminToken");
    setToken(null);
  },[]);

  useEffect(()=>{
    window.scrollTo(0,0);
  },[location.pathname]);

  useEffect(()=>{
    window.addEventListener("admin-logout",logout);
    return ()=>window.removeEventListener("admin-logout",logout);
  },[logout]);

  if (!token) {
    return (
      <>
        {toasts}
        <Login setToken={setToken}/>
      </>
    )
  }

  return (
    <div className="shell">
      {toasts}
      <Navbar logout={logout}/>
      <div className="shell-body">
        <Sidebar/>
        <main className="shell-main">
          {/* keyed by path so every page change plays the entrance animation */}
          <div className="page" key={location.pathname}>
            <Routes location={location}>
              <Route path='/' element={<Navigate to='/list' replace/>}/>
              <Route path='/add' element={<Add/>}/>
              <Route path='/list' element={<List/>}/>
              <Route path='/orders' element={<Orders/>}/>
              <Route path='*' element={<Navigate to='/list' replace/>}/>
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
