import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';

const FoodItem = ({id,name,price,description,image}) => {

    const {cartItems,addToCart,removeFromCart,url} = useContext(StoreContext);
    const qty = cartItems[id] || 0;

  return (
    <article className='product'>
        <div className="product-media">
            <img src={url+"/images/"+image} alt={name} loading="lazy" />
        </div>
        <div className="product-info">
            <h3>{name}</h3>
            <p className="product-desc">{description}</p>
            <div className="product-buy">
                <strong className="product-price">{formatPrice(price)}</strong>
                {qty===0
                    ? <button type="button" className="btn btn-primary btn-sm" onClick={()=>addToCart(id)}>Add to cart</button>
                    : <div className="stepper">
                        <button type="button" aria-label={`Remove one ${name}`} onClick={()=>removeFromCart(id)}>&minus;</button>
                        <span aria-live="polite">{qty}</span>
                        <button type="button" aria-label={`Add one more ${name}`} onClick={()=>addToCart(id)}>+</button>
                      </div>
                }
            </div>
        </div>
    </article>
  );
}

export default FoodItem;
