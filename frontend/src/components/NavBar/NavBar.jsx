import React, { useContext, useEffect, useRef } from 'react';
import './NavBar.css';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { CartIcon, ChevronIcon, SearchIcon } from '../Icons';

const HOME = '/shopping-cart';

const NavBar = ({setShowLogin}) => {

  const {cartItems,token,logout} = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

  const cartCount = Object.values(cartItems).reduce((sum,qty)=>sum+qty,0);
  const onHome = location.pathname.replace(/\/$/,'') === HOME;

  // scroll to a section of the home page (going there first when we are on another page)
  const goTo = (sectionId,focusId) => (event) => {
    event.preventDefault();
    if (onHome) {
      document.getElementById(sectionId)?.scrollIntoView({behavior:'smooth'});
      if (focusId) document.getElementById(focusId)?.focus({preventScroll:true});
    } else {
      navigate(HOME,{state:{scrollTo:sectionId,focus:focusId}});
    }
  }

  const scrollToFooter = (event) => {
    event.preventDefault();
    document.getElementById('footer')?.scrollIntoView({behavior:'smooth'});
  }

  const closeAccount = () => {
    if (accountRef.current) accountRef.current.open = false;
  }

  const handleLogout = () => {
    closeAccount();
    logout();
    navigate(HOME);
  }

  // close the account menu when clicking elsewhere
  useEffect(()=>{
    const close = (event) => {
      const menu = accountRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    document.addEventListener('pointerdown',close);
    return ()=>document.removeEventListener('pointerdown',close);
  },[]);

  return (
    <header className='navbar'>
      <div className="navbar-inner">
        <Link to={HOME} className="navbar-brand"><img src={assets.logo} alt="One Stop home" /></Link>

        <nav className="navbar-links" aria-label="Main">
          <Link to={HOME}>Home</Link>
          <a href="#food-display" onClick={goTo('food-display')}>Shop</a>
          <a href="#footer" onClick={scrollToFooter}>Contact</a>
        </nav>

        <div className="navbar-actions">
          <a href="#product-search" className="icon-btn" aria-label="Search products" onClick={goTo('food-display','product-search')}>
            <SearchIcon />
          </a>
          <Link to='/shopping-cart/cart' className="icon-btn" aria-label={`Cart, ${cartCount} ${cartCount===1?'item':'items'}`}>
            <CartIcon />
            {cartCount>0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {token
            ? <details className="account" ref={accountRef}>
                <summary>Account <ChevronIcon /></summary>
                <div className="account-menu">
                  <Link to='/shopping-cart/myorders' onClick={closeAccount}>My orders</Link>
                  <button type="button" onClick={handleLogout}>Sign out</button>
                </div>
              </details>
            : <button type="button" className="btn btn-primary btn-sm" onClick={()=>setShowLogin(true)}>Sign in</button>}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
