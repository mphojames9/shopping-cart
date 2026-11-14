import React from 'react';
import './Sidebar.css';
import { NavLink, useLocation } from 'react-router-dom';
import { PlusIcon, BoxIcon, ReceiptIcon } from '../Icons';

const items = [
  { to:'/add',    label:'Add product', Icon:PlusIcon },
  { to:'/list',   label:'Products',    Icon:BoxIcon },
  { to:'/orders', label:'Orders',      Icon:ReceiptIcon },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, items.findIndex((item)=>pathname.startsWith(item.to)));

  return (
    <nav className='sidebar' aria-label='Main' style={{'--idx': activeIndex}}>
      {/* one pill that slides to the active item (left sidebar on desktop, bottom dock on mobile) */}
      <span className='sidebar-indicator' aria-hidden='true' />
      {items.map(({ to, label, Icon })=>(
        <NavLink key={to} to={to} className='sidebar-option'>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default Sidebar;
