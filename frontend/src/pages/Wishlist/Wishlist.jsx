import React, { useContext } from 'react';
import './Wishlist.css';
import { Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../../components/FoodItem/FoodItem';
import { HeartIcon, PlusIcon } from '../../components/Icons';

const CART = '/shopping-cart/cart';

const Wishlist = ({setShowLogin}) => {

  const { food_list, wishlist, cartItems, addToCart, token, ready } = useContext(StoreContext);

  // newest saved first; ids of products that no longer exist are skipped
  const byId = new Map(food_list.map((item) => [item._id, item]));
  const items = [...wishlist].reverse().map((id) => byId.get(id)).filter(Boolean);
  const notInCart = items.filter((item) => !(cartItems[item._id] > 0));
  const addLabel = notInCart.length < items.length
    ? `Add ${notInCart.length} to cart`
    : items.length === 1 ? 'Add to cart' : 'Add all to cart';

  const addAll = () => {
    if (notInCart.length === 0) return;
    notInCart.forEach((item) => addToCart(item._id));
    window.dispatchEvent(new CustomEvent('cart:added', {
      detail: { name: notInCart.length === 1 ? notInCart[0].name : `${notInCart.length} items` }
    }));
  }

  // wait for products (and the saved list) so we do not flash "empty"
  if (!ready) {
    return (
      <div className='wishlist page'>
        <div className="wishlist-head"><h1>Your wishlist</h1></div>
        <div className="shop-grid" aria-busy="true" aria-label="Loading your wishlist">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="product-skeleton">
              <div className="sk-media" />
              <div className="sk-line" />
              <div className="sk-line sk-short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className='wishlist wishlist-empty page'>
        <span className="wishlist-empty-icon"><HeartIcon /></span>
        <h1>Nothing saved yet</h1>
        <p>Tap the heart on any product to keep it here for later.</p>
        <Link to='/shopping-cart' state={{scrollTo:'food-display'}} className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div className='wishlist page'>
      <div className="wishlist-head">
        <div>
          <h1>Your wishlist</h1>
          <p>{items.length} {items.length === 1 ? 'product' : 'products'} saved</p>
        </div>
        {notInCart.length > 0
          ? <button type="button" className="btn btn-primary" onClick={addAll}>
              <PlusIcon /><span>{addLabel}</span>
            </button>
          : <Link to={CART} className="btn btn-ghost">View cart</Link>}
      </div>

      {!token &&
        <p className="wishlist-note">
          This list is saved in this browser only.{' '}
          <button type="button" className="link-btn" onClick={()=>setShowLogin(true)}>Sign in</button>
          {' '}to keep it on all your devices.
        </p>
      }

      <ul className="shop-grid">
        {items.map((item, i) => (
          <li key={item._id} className="wishlist-item" style={{'--i': Math.min(i, 8)}}>
            <FoodItem id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} specs={item.specs}/>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Wishlist;
