import React, { useEffect, useState } from 'react';
import './Home.css';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';

const Home = () => {

  const [category, setCategory] = useState('All');
  const { state } = useLocation();

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
    <div>
      <Header setCategory={setCategory}/>
      <ExploreMenu category={category} setCategory={setCategory}/>
      <FoodDisplay category={category} setCategory={setCategory}/>
    </div>
  );
}

export default Home;
