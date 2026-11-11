import React, { useEffect, useState } from 'react';
import './Orders.css';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const STATUSES = ["Processing","Out for delivery","Delivered"];

const Orders = () => {

  const [orders,setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await api.get("/api/order/list");
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(errorMessage(error,"Could not load orders"));
    }
  }

  const statusHandler = async (event,orderId) => {
    try {
      const response = await api.post("/api/order/status",{orderId,status:event.target.value});
      if (response.data.success) {
        await fetchOrders();
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  useEffect(()=>{
    fetchOrders();
  },[])

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.length === 0 && <p>No paid orders yet.</p>}
        {orders.map((order)=>(
          <div key={order._id} className='order-item'>
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='order-item-food'>
                {order.items.map((item)=>`${item.name} x ${item.quantity}`).join(", ")}
              </p>
              <p className='order-item-name'>{order.address.firstName+" "+order.address.lastName}</p>
              <div className='order-item-address'>
                <p>{order.address.street+","}</p>
                <p>{order.address.city+", "+order.address.province+", "+order.address.country+", "+order.address.zipCode}</p>
              </div>
              <p className='order-item-phone'>{order.address.phone}</p>
              <p className='order-item-date'>{new Date(order.date).toLocaleString()}</p>
            </div>
            <p>Items : {order.items.reduce((sum,item)=>sum+item.quantity,0)}</p>
            <p>R{order.amount}</p>
            <select onChange={(event)=>statusHandler(event,order._id)} value={order.status}>
              {STATUSES.map((status)=>(
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
