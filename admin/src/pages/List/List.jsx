import React, { useEffect, useState } from 'react';
import './List.css';
import api, { API_URL, errorMessage } from '../../api';
import {toast} from 'react-toastify';

const List = () => {

    const [list,setList] = useState([]);

    const fetchList = async () => {
      try {
        const response = await api.get("/api/food/list");
        if (response.data.success){
          setList(response.data.data)
        } else {
          toast.error("Error")
        }
      } catch (error) {
        toast.error(errorMessage(error,"Could not load products"))
      }
    }

    const removeFood = async(foodId) => {
      if (!window.confirm("Remove this product?")) return;
      try {
        const response = await api.post("/api/food/remove",{id:foodId});
        await fetchList();
        if (response.data.success) {
          toast.success(response.data.message)
        }else{
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(errorMessage(error))
      }
    }

    useEffect(()=>{
      fetchList()
    },[])

  return (
    <div className="list add flex-col">
      <p>All Product List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item)=>{
          return (
            <div key={item._id} className="list-table-format">
              <img src={`${API_URL}/images/`+item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>R {item.price}</p>
              <p onClick={()=>removeFood(item._id)} className='cursor'>X</p>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default List;
