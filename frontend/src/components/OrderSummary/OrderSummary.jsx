import React, { useContext } from 'react';
import './OrderSummary.css';
import { StoreContext, DELIVERY_FEE } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';

// Totals box shared by the cart and checkout pages. The button goes in as children.
const OrderSummary = ({showItems=false, note, children}) => {

  const {food_list,cartItems,getTotalCartAmount} = useContext(StoreContext);

  const subtotal = getTotalCartAmount();
  const delivery = subtotal === 0 ? 0 : DELIVERY_FEE;
  const items = food_list.filter((item)=>cartItems[item._id] > 0);

  return (
    <aside className='order-summary'>
      <h2>Order summary</h2>
      {showItems &&
        <ul className="summary-items">
          {items.map((item)=>(
            <li key={item._id}>
              <span>{item.name} <small>&times; {cartItems[item._id]}</small></span>
              <span>{formatPrice(item.price*cartItems[item._id])}</span>
            </li>
          ))}
        </ul>
      }
      <dl className="summary-lines">
        <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>{formatPrice(delivery)}</dd></div>
        <div className="summary-total"><dt>Total</dt><dd>{formatPrice(subtotal+delivery)}</dd></div>
      </dl>
      {children}
      {note && <p className="summary-note">{note}</p>}
    </aside>
  );
}

export default OrderSummary;
