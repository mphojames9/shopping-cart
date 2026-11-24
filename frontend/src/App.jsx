import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar/NavBar';
import { Route, Routes, useLocation } from 'react-router-dom';
import PlaceOder from './pages/PlaceOrder/PlaceOder';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders';
import Wishlist from './pages/Wishlist/Wishlist';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';
import Toast from './components/Toast/Toast';
import Spotlight from './components/Spotlight/Spotlight';
import ProductSheet from './components/ProductSheet/ProductSheet';

const App = () => {

  const [showLogin,setShowLogin] = useState(false)
  const { pathname, state } = useLocation()

  // new page -> start at the top (unless a link asked to scroll to a section)
  useEffect(()=>{
    if (!state?.scrollTo) window.scrollTo({top:0,left:0,behavior:'instant'});
  },[pathname])

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin}/> : null}
      <NavBar setShowLogin={setShowLogin} />
      <main className='app'>
        <Routes>
          <Route path='/shopping-cart' element={<Home />} />
          <Route path='/shopping-cart/cart' element={<Cart setShowLogin={setShowLogin} />} />
          <Route path='/shopping-cart/placeOder' element={<PlaceOder />} />
          <Route path='/shopping-cart/verify' element={<Verify />} />
          <Route path='/shopping-cart/myorders' element={<MyOrders setShowLogin={setShowLogin} />} />
          <Route path='/shopping-cart/wishlist' element={<Wishlist setShowLogin={setShowLogin} />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
      <ProductSheet />
      <Spotlight />
    </>
  );
}

export default App;
