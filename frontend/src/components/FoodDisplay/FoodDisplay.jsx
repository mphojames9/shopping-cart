import React, { useContext, useEffect, useState } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import { CloseIcon, SearchIcon } from '../Icons';
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

    // fade cards in as they scroll into view
    const idsKey = products.map((item)=>item._id).join(',');
    useEffect(()=>{
        const cards = document.querySelectorAll('.shop-grid .reveal:not(.in)');
        if (!('IntersectionObserver' in window)) {
            cards.forEach((card)=>card.classList.add('in'));
            return;
        }
        const observer = new IntersectionObserver((entries)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        },{rootMargin:'0px 0px -6% 0px',threshold:0.05});
        cards.forEach((card)=>observer.observe(card));
        return ()=>observer.disconnect();
    },[idsKey,ready,category]);

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
                {query && <button type="button" className="search-clear" aria-label="Clear search" onClick={()=>setQuery('')}><CloseIcon /></button>}
            </label>
        </div>

        {!ready
            ? <div className="shop-grid" aria-busy="true">
                {Array.from({length:8}).map((_,i)=>(
                    <div key={i} className="product-skeleton">
                        <div className="sk-media" />
                        <div className="sk-line" />
                        <div className="sk-line sk-short" />
                    </div>
                ))}
              </div>
            : products.length===0
                ? <div className="shop-empty">
                    <span className="shop-empty-icon"><SearchIcon /></span>
                    <p>{food_list.length===0?'No products yet. Check back soon.':'No products match your search.'}</p>
                    {food_list.length>0 && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear search and filters</button>}
                  </div>
                : <ul className="shop-grid" key={category}>
                    {products.map((item,i)=>(
                        <li key={item._id} className="reveal" style={{'--d':`${(i%4)*70}ms`}}>
                            <FoodItem id={item._id} name={item.name} description={item.description} price={item.price} image={item.image}/>
                        </li>
                    ))}
                  </ul>
        }
    </section>
  );
}

export default FoodDisplay;
