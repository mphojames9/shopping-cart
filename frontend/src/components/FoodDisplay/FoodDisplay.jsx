import React, { useContext, useState } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import { SearchIcon } from '../Icons';
import { categoryLabel } from '../../utils/format';

const FoodDisplay = ({category,setCategory}) => {

    const { food_list, ready } = useContext(StoreContext);
    const [query,setQuery] = useState('');

    const q = query.trim().toLowerCase();
    const products = food_list.filter((item)=>
        (category==='All' || category===item.category) &&
        (!q || item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
    );

    const clearFilters = () => {
        setQuery('');
        setCategory('All');
    }

    return (
    <section className='shop' id='food-display'>
        <div className="shop-head">
            <div>
                <h2>{category==='All'?'All products':categoryLabel(category)}</h2>
                {ready && <p>{products.length} {products.length===1?'product':'products'}</p>}
            </div>
            <label className="search">
                <SearchIcon />
                <input id="product-search" type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" />
            </label>
        </div>

        {!ready
            ? <div className="shop-grid" aria-busy="true">
                {Array.from({length:8}).map((_,i)=><div key={i} className="product-skeleton" />)}
              </div>
            : products.length===0
                ? <div className="shop-empty">
                    <p>{food_list.length===0?'No products yet. Check back soon.':'No products match your search.'}</p>
                    {food_list.length>0 && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear search and filters</button>}
                  </div>
                : <ul className="shop-grid">
                    {products.map((item)=>(
                        <li key={item._id}>
                            <FoodItem id={item._id} name={item.name} description={item.description} price={item.price} image={item.image}/>
                        </li>
                    ))}
                  </ul>
        }
    </section>
  );
}

export default FoodDisplay;
