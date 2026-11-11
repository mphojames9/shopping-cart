import React, { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Login from './components/Login/Login';
import { Navigate, Route, Routes } from 'react-router-dom';
import Orders from './pages/Orders/Orders';
import List from './pages/List/List';
import Add from './pages/Add/Add';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {

  const [token,setToken] = useState(localStorage.getItem("adminToken"));

  const logout = useCallback(()=>{
    localStorage.removeItem("adminToken");
    setToken(null);
  },[]);

  useEffect(()=>{
    window.addEventListener("admin-logout",logout);
    return ()=>window.removeEventListener("admin-logout",logout);
  },[logout]);

  if (!token) {
    return (
      <>
        <ToastContainer/>
        <Login setToken={setToken}/>
      </>
    )
  }

  return (
    <div>
      <ToastContainer/>
      <Navbar logout={logout}/>
      <hr/>
      <div className="app-content">
        <Sidebar/>
        <Routes>
          <Route path='/' element={<Navigate to='/list' replace/>}/>
          <Route path='/add' element={<Add/>}/>
          <Route path='/list' element={<List/>}/>
          <Route path='/orders' element={<Orders/>}/>
          <Route path='*' element={<Navigate to='/list' replace/>}/>
        </Routes>
      </div>
    </div>
  );
}

export default App;
