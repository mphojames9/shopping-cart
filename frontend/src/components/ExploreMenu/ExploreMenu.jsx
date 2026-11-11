import React, { useContext } from 'react';
import './ExploreMenu.css';
import { menu_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { categoryLabel } from '../../utils/format';

const ExploreMenu = ({category, setCategory}) => {

    const {food_list,ready} = useContext(StoreContext);
    const countIn = (name) => food_list.filter((item)=>item.category===name).length;

    return (
        <nav className='categories' id='explore-menu' aria-label="Product categories">
            <button type="button" className={`chip${category==='All'?' active':''}`} aria-pressed={category==='All'} onClick={()=>setCategory('All')}>
                All {ready && <span>{food_list.length}</span>}
            </button>
            {menu_list.map((item)=>(
                <button
                    type="button"
                    key={item.menu_name}
                    className={`chip${category===item.menu_name?' active':''}`}
                    aria-pressed={category===item.menu_name}
                    onClick={()=>setCategory((prev)=>prev===item.menu_name?'All':item.menu_name)}
                >
                    {categoryLabel(item.menu_name)} {ready && <span>{countIn(item.menu_name)}</span>}
                </button>
            ))}
        </nav>
    );
}

export default ExploreMenu;
