import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import { CheckIcon, MinusIcon, PlusIcon } from '../Icons';
import { openProduct } from '../ProductSheet/ProductSheet';

const FoodItem = ({id,name,price,description,image,specs}) => {

    const {cartItems,addToCart,removeFromCart,url} = useContext(StoreContext);
    const qty = cartItems[id] || 0;
    const specList = Array.isArray(specs) ? specs : [];

    // first add also tells the toast to show up
    const addFirst = () => {
        addToCart(id);
        window.dispatchEvent(new CustomEvent('cart:added',{detail:{name}}));
    }

  return (
    <article id={`product-${id}`} className={`product${qty>0?' in-cart':''}`}>
        <button type="button" className="product-media" onClick={()=>openProduct(id)} aria-label={`View details for ${name}`}>
            <img src={url+"/images/"+image} alt="" loading="lazy" />
            {qty>0 && <span className="product-incart"><CheckIcon /> In cart</span>}
        </button>
        <div className="product-info">
            <h3>{name}</h3>
            <p className="product-desc">{description}</p>
            {specList.length>0 &&
                <button type="button" className="product-specs" onClick={()=>openProduct(id)} aria-label={`View all ${specList.length} specifications for ${name}`}>
                    {specList.slice(0,2).map((spec)=><span key={spec.label} className="spec-val" title={`${spec.label}: ${spec.value}`}>{spec.value}</span>)}
                    {specList.length>2 && <span className="more more-wide">+{specList.length-2}</span>}
                    {specList.length>1 && <span className="more more-narrow">+{specList.length-1}</span>}
                </button>
            }
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
