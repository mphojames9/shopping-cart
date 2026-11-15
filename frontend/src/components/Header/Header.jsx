import React from 'react';
import './Header.css';
import { menu_list } from '../../assets/assets';
import { DELIVERY_FEE } from '../../context/StoreContext';
import { categoryLabel, formatPrice } from '../../utils/format';
import { ArrowRightIcon, ClockIcon, ShieldIcon, TruckIcon } from '../Icons';

// categories shown as shortcuts in the hero
const FEATURED = ['Phones','Laptops','Smart TV','Taplets'];

const Header = ({setCategory}) => {

  const tiles = FEATURED.map((name)=>menu_list.find((item)=>item.menu_name===name)).filter(Boolean);
  // two columns, the second one sits lower so the tiles read as a bento
  const columns = [tiles.filter((_,i)=>i%2===0), tiles.filter((_,i)=>i%2===1)];

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
          <button type="button" className="hero-cta" onClick={()=>shop('All')}>
            Shop all products <ArrowRightIcon />
          </button>
        </div>
        <div className="hero-tiles">
          {columns.map((column,c)=>(
            <ul key={c}>
              {column.map((tile)=>{
                const index = tiles.indexOf(tile);
                return (
                  <li key={tile.menu_name} style={{'--i':index}}>
                    <button type="button" onClick={()=>shop(tile.menu_name)}>
                      <img src={tile.menu_image} alt="" />
                      <span>{categoryLabel(tile.menu_name)}</span>
                      <i aria-hidden="true"><ArrowRightIcon /></i>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
      <ul className="trust">
        <li><span><TruckIcon /></span>Flat {formatPrice(DELIVERY_FEE)} delivery</li>
        <li><span><ClockIcon /></span>Delivered within 7 working days</li>
        <li><span><ShieldIcon /></span>Pay securely by card</li>
      </ul>
    </section>
  );
}

export default Header;
