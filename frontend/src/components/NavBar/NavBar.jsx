import React, { useContext, useEffect, useRef, useState } from 'react';
import './NavBar.css';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { CartIcon, ChevronIcon, GridIcon, HeartIcon, HomeIcon, PackageIcon, SearchIcon, UserIcon } from '../Icons';
import { modifierKey, openSpotlight } from '../Spotlight/Spotlight';

const HOME = '/shopping-cart';
const CART = '/shopping-cart/cart';
const ORDERS = '/shopping-cart/myorders';
const WISHLIST = '/shopping-cart/wishlist';

const NavBar = ({setShowLogin}) => {

  const {cartItems,token,logout,wishlist} = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);
  const [scrolled,setScrolled] = useState(false);

  const cartCount = Object.values(cartItems).reduce((sum,qty)=>sum+qty,0);
  const path = location.pathname.replace(/\/$/,'');
  const onHome = path === HOME;
  const onCart = path === CART;
  const onOrders = path === ORDERS;
  const onWishlist = path === WISHLIST;

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

  // tapping Home while already on it takes you back to the top
  const homeTap = (event) => {
    if (onHome) {
      event.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
    }
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

  // glass bar gets a hairline + shadow once the page moves under it
  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);

  const badge = cartCount>0 && <span key={cartCount} className="cart-badge">{cartCount}</span>;
  const savedCount = wishlist.length;

  return (
    <>
      <header className={`navbar${scrolled?' scrolled':''}`}>
        <div className="navbar-inner">
          <Link to={HOME} className="navbar-brand" onClick={homeTap}><img src={assets.logo} alt="One Stop home" /></Link>

          <nav className="navbar-links" aria-label="Main">
            <Link to={HOME} onClick={homeTap}>Home</Link>
            <a href="#food-display" onClick={goTo('food-display')}>Shop</a>
            <a href="#footer" onClick={scrollToFooter}>Contact</a>
          </nav>

          <div className="navbar-actions">
            <button type="button" className="search-pill" aria-label="Search products" aria-keyshortcuts="Control+K Meta+K" onClick={()=>openSpotlight()}>
              <SearchIcon /><span>Search products</span><kbd>{modifierKey()} K</kbd>
            </button>
            <button type="button" className="icon-btn search-icon-btn" aria-label="Search products" onClick={()=>openSpotlight()}>
              <SearchIcon />
            </button>
            <Link to={WISHLIST} className={`icon-btn icon-btn-wishlist${onWishlist?' active':''}`} aria-current={onWishlist?'page':undefined} aria-label={`Wishlist, ${savedCount} ${savedCount===1?'item':'items'}`}>
              <HeartIcon />
              {savedCount>0 && <span key={savedCount} className="cart-badge wishlist-badge">{savedCount}</span>}
            </Link>
            <Link to={CART} className="icon-btn icon-btn-cart" aria-label={`Cart, ${cartCount} ${cartCount===1?'item':'items'}`}>
              <CartIcon />
              {badge}
            </Link>
            {token
              ? <details className="account" ref={accountRef}>
                  <summary aria-label="Account"><UserIcon /><span className="account-label">Account</span><ChevronIcon className="account-chevron" /></summary>
                  <div className="account-menu">
                    <Link to={ORDERS} onClick={closeAccount}>My orders</Link>
                    <button type="button" onClick={handleLogout}>Sign out</button>
                  </div>
                </details>
              : <button type="button" className="btn btn-primary btn-sm signin-btn" onClick={()=>setShowLogin(true)}>Sign in</button>}
          </div>
        </div>
      </header>

      {/* thumb-reach navigation for phones */}
      <nav className="tabbar" aria-label="Quick navigation">
        <Link to={HOME} className={`tab${onHome?' active':''}`} onClick={homeTap} aria-current={onHome?'page':undefined}>
          <HomeIcon /><span>Home</span>
        </Link>
        <a href="#food-display" className="tab" onClick={goTo('food-display')}>
          <GridIcon /><span>Shop</span>
        </a>
        <Link to={CART} className={`tab${onCart?' active':''}`} aria-current={onCart?'page':undefined} aria-label={`Cart, ${cartCount} ${cartCount===1?'item':'items'}`}>
          <span className="tab-icon"><CartIcon />{badge}</span><span>Cart</span>
        </Link>
        {token
          ? <Link to={ORDERS} className={`tab${onOrders?' active':''}`} aria-current={onOrders?'page':undefined}>
              <PackageIcon /><span>Orders</span>
            </Link>
          : <button type="button" className="tab" onClick={()=>setShowLogin(true)}>
              <UserIcon /><span>Sign in</span>
            </button>}
      </nav>
    </>
  );
}

export default NavBar;
