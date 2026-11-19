import React, { useEffect, useState } from 'react';
import './Home.css';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';

const Home = () => {

  const [category, setCategory] = useState('All');
  const [smart, setSmart] = useState(null); // product ids chosen by a Spotlight search
  const { state } = useLocation();

  // picking a category yourself replaces a Spotlight search
  const chooseCategory = (name) => {
    setSmart(null);
    setCategory(name);
  };

  // Spotlight can ask for a category, a set of search results, or one product to be shown
  useEffect(()=>{
    if (!state) return;
    if (state.category) { setSmart(null); setCategory(state.category); }
    if (state.smart) { setSmart(state.smart); setCategory('All'); }
    if (state.reveal) { setSmart(null); setCategory('All'); }
  },[state]);

  // "Shop" / search links on other pages send people here and ask us to scroll
  useEffect(()=>{
    if (!state?.scrollTo) return;
    const timer = setTimeout(()=>{
      document.getElementById(state.scrollTo)?.scrollIntoView({behavior:'smooth'});
      if (state.focus) document.getElementById(state.focus)?.focus({preventScroll:true});
    },60);
    return ()=>clearTimeout(timer);
  },[state]);

  return (
    <div className='page'>
      <Header setCategory={chooseCategory}/>
      <ExploreMenu category={category} setCategory={chooseCategory}/>
      <FoodDisplay category={category} setCategory={chooseCategory} smart={smart} onClearSmart={()=>setSmart(null)} reveal={state?.reveal}/>
    </div>
  );
}

export default Home;
