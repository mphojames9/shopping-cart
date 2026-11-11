import React, { useState} from 'react';
import NavBar from './components/NavBar/NavBar';
import { Route, Routes } from 'react-router-dom';
import PlaceOder from './pages/PlaceOrder/PlaceOder';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';

const App = () => {

  const [showLogin,setShowLogin] = useState(false)

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
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
