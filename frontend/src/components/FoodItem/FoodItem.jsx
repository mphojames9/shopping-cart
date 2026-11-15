import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import { CheckIcon, MinusIcon, PlusIcon } from '../Icons';

const FoodItem = ({id,name,price,description,image}) => {

    const {cartItems,addToCart,removeFromCart,url} = useContext(StoreContext);
    const qty = cartItems[id] || 0;

    // first add also tells the toast to show up
    const addFirst = () => {
        addToCart(id);
        window.dispatchEvent(new CustomEvent('cart:added',{detail:{name}}));
    }

  return (
    <article className={`product${qty>0?' in-cart':''}`}>
        <div className="product-media">
            <img src={url+"/images/"+image} alt={name} loading="lazy" />
            {qty>0 && <span className="product-incart"><CheckIcon /> In cart</span>}
        </div>
        <div className="product-info">
            <h3>{name}</h3>
            <p className="product-desc">{description}</p>
            <div className="product-buy">
                <strong className="product-price">{formatPrice(price)}</strong>
                {qty===0
                    ? <button type="button" className="add-btn" aria-label={`Add ${name} to cart`} onClick={addFirst}>
                        <PlusIcon /><span>Add</span>
                      </button>
                    : <div className="stepper">
                        <button type="button" aria-label={`Remove one ${name}`} onClick={()=>removeFromCart(id)}><MinusIcon /></button>
                        <span key={qty} aria-live="polite">{qty}</span>
                        <button type="button" aria-label={`Add one more ${name}`} onClick={()=>addToCart(id)}><PlusIcon /></button>
                      </div>
                }
            </div>
        </div>
    </article>
  );
}

export default FoodItem;
