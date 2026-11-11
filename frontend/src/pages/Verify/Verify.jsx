import React, { useContext, useEffect } from 'react';
import './Verify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

// Stripe sends the customer back here after checkout.
// The server asks Stripe whether the order was really paid.
const Verify = () => {

  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const {url,token,ready,setCartItems,authConfig} = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(()=>{
    if (!ready) return;
    if (!token || !orderId) {
      navigate('/shopping-cart');
      return;
    }
    const verifyPayment = async () => {
      try {
        const response = await axios.post(url+"/api/order/verify",{orderId},authConfig());
        if (response.data.success) {
          setCartItems({});
          navigate('/shopping-cart/myorders');
        } else {
          navigate('/shopping-cart/cart');
        }
      } catch (error) {
        navigate('/shopping-cart/cart');
      }
    }
    verifyPayment();
  },[ready])

  return (
    <div className='verify' role="status">
      <div className="spinner"></div>
      <p>Confirming your payment…</p>
    </div>
  );
}

export default Verify;
