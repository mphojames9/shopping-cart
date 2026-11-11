import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../../utils/format';

const statusClass = (status) =>
  status === 'Delivered' ? 'done' : status === 'Out for delivery' ? 'moving' : 'pending';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'});

const MyOrders = ({setShowLogin}) => {

  const {url,token,authConfig} = useContext(StoreContext);
  const [data,setData] = useState([]);
  const [loading,setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(url+"/api/order/userorders",authConfig());
      if (response.data.success) setData(response.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    if (token) fetchOrders();
    else setLoading(false);
  },[token])

  if (!token) {
    return (
      <div className='orders orders-message'>
        <h1>My orders</h1>
        <p>Sign in to see your orders.</p>
        <button type="button" className="btn btn-primary" onClick={()=>setShowLogin(true)}>Sign in</button>
      </div>
    );
  }

  return (
    <div className='orders'>
      <div className="orders-head">
        <h1>My orders</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={fetchOrders}>Refresh status</button>
      </div>

      {loading
        ? <p className="orders-note" aria-busy="true">Loading your orders…</p>
        : data.length === 0
          ? <div className="orders-message">
              <p>You have no orders yet.</p>
              <Link to='/shopping-cart' state={{scrollTo:'food-display'}} className="btn btn-primary">Start shopping</Link>
            </div>
          : <ul className="orders-list">
              {data.map((order)=>(
                <li key={order._id} className='order'>
                  <div className="order-meta">
                    <strong>{formatDate(order.date)}</strong>
                    <span>Order #{String(order._id).slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="order-items">{order.items.map((item)=>`${item.name} × ${item.quantity}`).join(", ")}</p>
                  <strong className="order-amount">{formatPrice(order.amount)}</strong>
                  <span className={`status status-${statusClass(order.status)}`}>{order.status}</span>
                </li>
              ))}
            </ul>
      }
    </div>
  );
}

export default MyOrders;
