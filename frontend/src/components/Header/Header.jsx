import React from 'react';
import './Header.css';
import { menu_list } from '../../assets/assets';
import { DELIVERY_FEE } from '../../context/StoreContext';
import { categoryLabel, formatPrice } from '../../utils/format';

// categories shown as shortcuts in the hero
const FEATURED = ['Phones','Laptops','Smart TV','Taplets'];

const Header = ({setCategory}) => {

  const tiles = FEATURED.map((name)=>menu_list.find((item)=>item.menu_name===name)).filter(Boolean);

  const shop = (category) => {
    setCategory(category);
    document.getElementById('food-display')?.scrollIntoView({behavior:'smooth'});
  }

  return (
    <section className='hero-wrap'>
      <div className="hero">
        <div className="hero-copy">
          <h1>Your one stop for phones, laptops and TVs</h1>
          <p>Monitors, tablets, accessories and gaming gear too, delivered to your door.</p>
          <button type="button" className="hero-cta" onClick={()=>shop('All')}>Shop all products</button>
        </div>
        <ul className="hero-tiles">
          {tiles.map((tile)=>(
            <li key={tile.menu_name}>
              <button type="button" onClick={()=>shop(tile.menu_name)}>
                <img src={tile.menu_image} alt="" />
                <span>{categoryLabel(tile.menu_name)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ul className="hero-facts">
        <li>Flat {formatPrice(DELIVERY_FEE)} delivery</li>
        <li>Delivered within 7 working days</li>
        <li>Pay securely by card</li>
      </ul>
    </section>
  );
}

export default Header;
