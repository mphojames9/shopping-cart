import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderSummary from '../../components/OrderSummary/OrderSummary';

const Field = ({label, ...props}) => (
  <label className='field'>
    <span>{label}</span>
    <input required {...props} />
  </label>
);

const PlaceOder = () => {

  const {getTotalCartAmount, token, food_list, cartItems, url, ready, authConfig} = useContext(StoreContext);
  const navigate = useNavigate();

  const [submitting,setSubmitting] = useState(false);
  const [data,setData] = useState({
    firstName:"",
    lastName:"",
    email:"",
    street:"",
    city:"",
    province:"",
    zipCode:"",
    country:"South Africa",
    phone:""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data=>({...data,[name]:value}))
  }

  const placeOrder = async (event) => {
    event.preventDefault();
    const items = food_list
      .filter((item)=>cartItems[item._id] > 0)
      .map((item)=>({id:item._id,quantity:cartItems[item._id]}));

    setSubmitting(true);
    try {
      const response = await axios.post(url+"/api/order/place",{address:data,items},authConfig());
      if (response.data.success) {
        window.location.replace(response.data.session_url);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // need to be logged in with something in the cart (wait until the saved cart has loaded)
  useEffect(()=>{
    if (!ready) return;
    if (!token || getTotalCartAmount() === 0) {
      navigate('/shopping-cart/cart');
    }
  },[ready,token])

  return (
    <form onSubmit={placeOrder} className='checkout'>
      <div className='checkout-form'>
        <h1>Delivery details</h1>
        <div className='field-row'>
          <Field label='First name' name='firstName' autoComplete='given-name' value={data.firstName} onChange={onChangeHandler} type='text' />
          <Field label='Last name' name='lastName' autoComplete='family-name' value={data.lastName} onChange={onChangeHandler} type='text' />
        </div>
        <Field label='Email address' name='email' autoComplete='email' value={data.email} onChange={onChangeHandler} type='email' />
        <Field label='Phone' name='phone' autoComplete='tel' value={data.phone} onChange={onChangeHandler} type='tel' />
        <Field label='Street address' name='street' autoComplete='street-address' value={data.street} onChange={onChangeHandler} type='text' />
        <div className='field-row'>
          <Field label='City' name='city' autoComplete='address-level2' value={data.city} onChange={onChangeHandler} type='text' />
          <Field label='Province' name='province' autoComplete='address-level1' value={data.province} onChange={onChangeHandler} type='text' />
        </div>
        <div className='field-row'>
          <Field label='Postal code' name='zipCode' autoComplete='postal-code' value={data.zipCode} onChange={onChangeHandler} type='text' />
          <Field label='Country' name='country' autoComplete='country-name' value={data.country} onChange={onChangeHandler} type='text' />
        </div>
      </div>

      <OrderSummary showItems note="Payments are processed securely by Stripe.">
        <button type='submit' className='btn btn-primary btn-block' disabled={submitting}>
          {submitting ? 'Redirecting to payment…' : 'Continue to payment'}
        </button>
      </OrderSummary>
    </form>
  );
}

export default PlaceOder;
