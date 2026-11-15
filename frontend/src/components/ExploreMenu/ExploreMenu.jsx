import React, { useContext, useEffect, useRef } from 'react';
import './ExploreMenu.css';
import { menu_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { categoryLabel } from '../../utils/format';
import { GridIcon } from '../Icons';

const ExploreMenu = ({category, setCategory}) => {

    const {food_list,ready} = useContext(StoreContext);
    const countIn = (name) => food_list.filter((item)=>item.category===name).length;
    const barRef = useRef(null);
    const first = useRef(true);

    // keep the chosen category in view when the bar scrolls sideways
    // (we move the bar itself, never the page)
    useEffect(()=>{
        if (first.current) { first.current = false; return; }
        const bar = barRef.current;
        const chip = bar?.querySelector('.chip.active');
        if (!bar || !chip) return;
        bar.scrollTo({left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth)/2, behavior:'smooth'});
    },[category]);

    return (
        <nav className='categories' id='explore-menu' aria-label="Product categories" ref={barRef}>
            <button type="button" className={`chip${category==='All'?' active':''}`} aria-pressed={category==='All'} onClick={()=>setCategory('All')}>
                <span className="chip-thumb chip-thumb-all"><GridIcon /></span>
                All {ready && <small>{food_list.length}</small>}
            </button>
            {menu_list.map((item)=>(
                <button
                    type="button"
                    key={item.menu_name}
                    className={`chip${category===item.menu_name?' active':''}`}
                    aria-pressed={category===item.menu_name}
                    onClick={()=>setCategory((prev)=>prev===item.menu_name?'All':item.menu_name)}
                >
                    <span className="chip-thumb"><img src={item.menu_image} alt="" loading="lazy" /></span>
                    {categoryLabel(item.menu_name)} {ready && <small>{countIn(item.menu_name)}</small>}
                </button>
            ))}
        </nav>
    );
}

export default ExploreMenu;
