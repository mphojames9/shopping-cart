import React from 'react';
import './Navbar.css';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { LogoutIcon, UserIcon } from '../Icons';

const Navbar = ({logout}) => {
  return (
    <header className='navbar'>
      <NavLink to='/list' className='navbar-brand' aria-label='One stop, go to products'>
        <img src={assets.logo} alt="One stop" className="logo" />
      </NavLink>

      <div className="navbar-right">
        <div className="navbar-user">
          <span className="avatar" aria-hidden="true"><UserIcon size={18} /></span>
          <span className="navbar-role">Admin</span>
        </div>
        <button className="logout-btn" onClick={logout} aria-label="Log out">
          <LogoutIcon size={18} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
