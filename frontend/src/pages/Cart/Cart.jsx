import React, { useContext } from 'react';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import OrderSummary from '../../components/OrderSummary/OrderSummary';
import { formatPrice } from '../../utils/format';

const Cart = ({setShowLogin}) => {

  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount, url, token, ready } = useContext(StoreContext)

  const navigate = useNavigate();

  const items = food_list.filter((item) => cartItems[item._id] > 0);
  const subtotal = getTotalCartAmount();

  const checkout = () => {
    if (subtotal === 0) return;
    if (!token) {
      setShowLogin(true);
      return;
    }
    navigate('/shopping-cart/placeOder');
  }

  // wait for the saved cart to load so we do not flash "empty"
  if (!ready) {
    return <div className='cart'><h1>Your cart</h1></div>;
  }

  if (items.length === 0) {
    return (
      <div className='cart cart-empty'>
        <h1>Your cart is empty</h1>
        <p>Add something from the shop and it will show up here.</p>
        <Link to='/shopping-cart' state={{scrollTo:'food-display'}} className="btn btn-primary">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className='cart'>
      <h1>Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item._id} className="cart-row">
              <div className="cart-thumb"><img src={url+"/images/"+item.image} alt='' /></div>
              <div className="cart-name">
                <h3>{item.name}</h3>
                <p>{formatPrice(item.price)} each</p>
              </div>
              <div className="stepper">
                <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => removeFromCart(item._id)}>&minus;</button>
                <span aria-live="polite">{cartItems[item._id]}</span>
                <button type="button" aria-label={`Add one more ${item.name}`} onClick={() => addToCart(item._id)}>+</button>
              </div>
              <strong className="cart-line">{formatPrice(item.price * cartItems[item._id])}</strong>
            </li>
          ))}
        </ul>
        <OrderSummary note="You will pay by card on Stripe's secure page.">
          <button type="button" className="btn btn-primary btn-block" onClick={checkout}>
            {token ? 'Checkout' : 'Sign in to checkout'}
          </button>
        </OrderSummary>
      </div>
    </div>
  );
}

export default Cart;
