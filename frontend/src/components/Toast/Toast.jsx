import React, { useEffect, useRef, useState } from 'react';
import './Toast.css';
import { Link } from 'react-router-dom';
import { CheckIcon } from '../Icons';

// Listens for the "cart:added" event that FoodItem fires, so no shared state is needed.
const Toast = () => {

  const [toast,setToast] = useState(null);
  const timer = useRef(null);

  useEffect(()=>{
    const onAdded = (event) => {
      setToast({id:Date.now(),name:event.detail?.name || 'Item'});
      clearTimeout(timer.current);
      timer.current = setTimeout(()=>setToast(null),2800);
    };
    window.addEventListener('cart:added',onAdded);
    return ()=>{
      window.removeEventListener('cart:added',onAdded);
      clearTimeout(timer.current);
    };
  },[]);

  return (
    <div className="toast-region" aria-live="polite">
      {toast &&
        <div key={toast.id} className="toast" role="status">
          <span className="toast-check"><CheckIcon /></span>
          <span className="toast-text"><strong>{toast.name}</strong> added to cart</span>
          <Link to="/shopping-cart/cart" className="toast-link" onClick={()=>setToast(null)}>View cart</Link>
        </div>
      }
    </div>
  );
}

export default Toast;
