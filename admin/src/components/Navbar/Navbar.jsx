import React from 'react';
import './Navbar.css';
import {assets} from '../../assets/assets'

const Navbar = ({logout}) => {
  return (
    <div className='navbar'>
      <img src={assets.logo} alt="" className="logo" />
      <div className="navbar-right">
        <button className="logout-btn" onClick={logout}>Logout</button>
        <img src={assets.profile_image} alt="" className="profile" />
      </div>
    </div>
  );
}

export default Navbar;
