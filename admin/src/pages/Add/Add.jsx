import React, { useState } from 'react';
import './Add.css';
import { assets } from '../../assets/assets';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';

const Add = () => {

    const [image,setImage] = useState(false);
    const [data,setData] = useState({
        name:"",
        description:"",
        price:"",
        category:"Accessories"
    })

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const onsubmitHandler = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("name",data.name)
        formData.append("description",data.description)
        formData.append("price",Number(data.price))
        formData.append("category",data.category)
        formData.append("image",image)

        try {
            const response = await api.post("/api/food/add",formData);
            if (response.data.success) {
                setData({
                    name:"",
                    description:"",
                    price:"",
                    category:"Accessories"
                })
                setImage(false)
                toast.success(response.data.message)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }

  return (
    <div className='add'>
        <form className="flex-col" onSubmit={onsubmitHandler}>
            <div className="add-img-upload flex-col">
                <p>Upload Image</p>
                <label htmlFor='image'>
                    <img src={image?URL.createObjectURL(image):assets.upload_area} alt="" />
                </label>
                <input onChange={(e)=>setImage(e.target.files[0])} type='file' id='image' accept='image/*' hidden required />
            </div>
        <div className="add-product-name flex-col">
            <p>Product name</p>
            <input onChange={onChangeHandler} value={data.name} type='text' name='name' placeholder='Type here' required />
            </div>
            <div className="add-product-description flex-col">
                <p>Product description</p>
            <textarea onChange={onChangeHandler} value={data.description} name='description' rows='6' placeholder='Write content here' required></textarea>
        </div>
            <div className="add-category-price">
                <div className="add-category flex-col">
                    <p>Product category</p>
                    <select onChange={onChangeHandler} value={data.category} name="category">
                        <option value="Accessories">Accessories</option>
                        <option value="Phones">Phones</option>
                        <option value="Laptops">Laptops</option>
                        <option value="Smart TV">Smart TV</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Taplets">Taplets</option>
                        <option value="Office">Office</option>
                        <option value="Gaming">Gaming</option>
                    </select>
                </div>
                 <div className="add-price flex-col">
                    <p>Product price</p>
                    <input onChange={onChangeHandler} value={data.price} type='number' min='1' step='0.01' name='price' placeholder='R200' required />
                 </div>
            </div>
            <button className="add-btn" type='submit'>ADD</button>
        </form>

    </div>
  );
}

export default Add;
