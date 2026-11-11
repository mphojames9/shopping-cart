import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets';

const Footer = () => {
  return (
    <footer className='footer' id='footer'>
        <div className="footer-inner">
            <div className="footer-brand">
                <img src={assets.logo} alt='One Stop' />
                <p>Phones, laptops, TVs, monitors and gaming gear in one place.</p>
            </div>
            <div>
                <h2>Shop</h2>
                <ul>
                    <li><Link to='/shopping-cart'>Home</Link></li>
                    <li><Link to='/shopping-cart/cart'>Cart</Link></li>
                    <li><Link to='/shopping-cart/myorders'>My orders</Link></li>
                </ul>
            </div>
            <div>
                <h2>Contact us</h2>
                <ul>
                    <li><a href='tel:+27112331245'>+27 11 233 1245</a></li>
                    <li><a href='mailto:demo@onestop.com'>demo@onestop.com</a></li>
                </ul>
            </div>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} One Stop. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
