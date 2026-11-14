import React, { useEffect, useMemo, useState } from 'react';
import './Orders.css';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';
import { BoxIcon, CheckIcon, ChevronDownIcon, MapPinIcon, PhoneIcon, ReceiptIcon } from '../../components/Icons';
import { formatDate, formatRand } from '../../utils/format';

const STATUSES = ["Processing","Out for delivery","Delivered"];
const TONES = { "Processing":"warn", "Out for delivery":"info", "Delivered":"ok" };

const Orders = () => {

  const [orders,setOrders] = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter] = useState("All");
  const [updatingId,setUpdatingId] = useState(null);

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
    } finally {
      setLoading(false);
    }
  }

  const statusHandler = async (event,orderId) => {
    setUpdatingId(orderId);
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
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(()=>{
    fetchOrders();
  },[])

  const counts = useMemo(()=>{
    const result = { All: orders.length };
    STATUSES.forEach((status)=>{ result[status] = orders.filter((o)=>o.status === status).length; });
    return result;
  },[orders]);

  const visible = filter === "All" ? orders : orders.filter((o)=>o.status === filter);

  return (
    <div className='order'>

      <div className="page-head">
        <div>
          <h1>Orders</h1>
          <p>{loading ? "Loading orders..." : `${orders.length} paid ${orders.length === 1 ? "order" : "orders"}`}</p>
        </div>
      </div>

      {(loading || orders.length > 0) &&
        <div className="filters" role="tablist" aria-label="Filter orders by status">
          {["All",...STATUSES].map((status)=>(
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              className={`filter${filter === status ? " is-active" : ""}`}
              onClick={()=>setFilter(status)}
            >
              {status}
              <span className="filter-count">{counts[status]}</span>
            </button>
          ))}
        </div>
      }

      {loading &&
        <div className="order-list" aria-hidden="true">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="card order-card">
              <div className="skeleton skel-a"/>
              <div className="skeleton skel-b"/>
              <div className="skeleton skel-c"/>
            </div>
          ))}
        </div>
      }

      {!loading && orders.length === 0 &&
        <div className="card">
          <div className="empty">
            <span className="empty-icon"><ReceiptIcon size={32} /></span>
            <h3>No paid orders yet</h3>
            <p>Orders show up here as soon as a customer has paid.</p>
          </div>
        </div>
      }

      {!loading && orders.length > 0 && visible.length === 0 &&
        <div className="card">
          <div className="empty">
            <span className="empty-icon"><BoxIcon size={30} /></span>
            <h3>Nothing here</h3>
            <p>No orders are marked “{filter}” right now.</p>
          </div>
        </div>
      }

      {!loading && visible.length > 0 &&
        <div className="order-list">
          {visible.map((order,index)=>{
            const stepIndex = Math.max(0,STATUSES.indexOf(order.status));
            const tone = TONES[order.status] || "info";
            const itemCount = order.items.reduce((sum,item)=>sum+item.quantity,0);
            const fullName = order.address.firstName+" "+order.address.lastName;

            return (
              <article
                key={order._id}
                className={`card order-card rise${updatingId === order._id ? " is-updating" : ""}`}
                style={{'--i':index}}
                data-tone={tone}
              >
                <header className="order-top">
                  <span className="order-icon"><BoxIcon size={22} /></span>
                  <div className="order-who">
                    <h3>{fullName}</h3>
                    <span>{formatDate(order.date)}</span>
                  </div>
                  <div className="order-total">
                    <strong>{formatRand(order.amount)}</strong>
                    <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                  </div>
                </header>

                <ul className="order-items">
                  {order.items.map((item,i)=>(
                    <li key={i}>
                      <span className="qty">{item.quantity} ×</span>
                      <span className="name">{item.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="order-contact">
                  <p>
                    <MapPinIcon size={17} />
                    <span>
                      {order.address.street+","}<br/>
                      {order.address.city+", "+order.address.province+", "+order.address.country+", "+order.address.zipCode}
                    </span>
                  </p>
                  <a href={`tel:${order.address.phone}`}>
                    <PhoneIcon size={17} />
                    {order.address.phone}
                  </a>
                </div>

                <div className="order-foot">
                  <ol className="stepper" style={{'--step':stepIndex}} aria-label="Delivery progress">
                    {STATUSES.map((status,k)=>(
                      <li key={status} className={k <= stepIndex ? "done" : ""} aria-current={k === stepIndex ? "step" : undefined}>
                        <span className="dot">{k < stepIndex && <CheckIcon size={11} />}</span>
                        <span className="label">{status}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="status-select">
                    <span className="status-dot" aria-hidden="true" />
                    <select
                      aria-label={`Order status for ${fullName}`}
                      onChange={(event)=>statusHandler(event,order._id)}
                      value={order.status}
                      disabled={updatingId === order._id}
                    >
                      {STATUSES.map((status)=>(
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <ChevronDownIcon size={16} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      }

    </div>
  );
}

export default Orders;
