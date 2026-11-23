import React, { useContext, useMemo, useRef } from 'react';
import './Header.css';
import { StoreContext, DELIVERY_FEE } from '../../context/StoreContext';
import { categoryLabel, formatPrice } from '../../utils/format';
import { buildCategoryWords, buildSuggestions } from '../../utils/smartSearch';
import { CheckIcon, ClockIcon, PlusIcon, SearchIcon, ShieldIcon, TruckIcon } from '../Icons';
import { modifierKey, openSpotlight } from '../Spotlight/Spotlight';
import { openProduct } from '../ProductSheet/ProductSheet';

// how the showcase cards sit on desktop: rotation (deg) and parallax depth (px)
const POSES = [
  { r: 3, depth: 16 },
  { r: -5, depth: 28 },
  { r: 6, depth: 22 },
  { r: -4, depth: 30 },
];

const Header = () => {

  const { food_list, ready, cartItems, addToCart, url } = useContext(StoreContext);
  const heroRef = useRef(null);

  // one product per category, so the showcase has variety (the list is shuffled on every page load)
  const featured = useMemo(() => {
    const seen = new Set();
    const picks = [];
    for (const product of food_list) {
      if (!product.image || seen.has(product.category)) continue;
      seen.add(product.category);
      picks.push(product);
      if (picks.length === 4) break;
    }
    return picks;
  }, [food_list]);

  const ideas = useMemo(() => {
    const words = buildCategoryWords(food_list);
    return buildSuggestions(food_list, words, 4);
  }, [food_list]);

  // desktop only: the cards drift a little with the pointer
  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || !heroRef.current) return;
    const box = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty('--px', (((event.clientX - box.left) / box.width - 0.5) * 2).toFixed(3));
    heroRef.current.style.setProperty('--py', (((event.clientY - box.top) / box.height - 0.5) * 2).toFixed(3));
  };
  const onPointerLeave = () => {
    heroRef.current?.style.setProperty('--px', '0');
    heroRef.current?.style.setProperty('--py', '0');
  };

  const quickAdd = (product) => {
    addToCart(product._id);
    window.dispatchEvent(new CustomEvent('cart:added', { detail: { name: product.name } }));
  };

  return (
    <section className="hero-wrap">
      <div className="hero" ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>

        <div className="hero-copy">
          <h1>Your one stop for <span>tech</span></h1>

          <p>Phones, laptops, TVs and more, delivered to your door for a flat {formatPrice(DELIVERY_FEE)}.</p>

          <button type="button" className="hero-search" onClick={() => openSpotlight()} aria-label="Search products">
            <SearchIcon />
            <span>Search or ask for anything…</span>
            <kbd>{modifierKey()} K</kbd>
          </button>

          {ideas.length > 0 &&
            <ul className="hero-try" aria-label="Try asking">
              {ideas.map((idea) => (
                <li key={idea}>
                  <button type="button" onClick={() => openSpotlight(idea)}>{idea}</button>
                </li>
              ))}
            </ul>
          }
        </div>

        {(!ready || featured.length > 0) &&
          <ul className="hero-deck" aria-label="Featured products">
            {!ready && POSES.map((pose, i) => (
              <li key={i} className="deck-card is-skeleton" style={{ '--i': i, '--r': `${pose.r}deg`, '--depth': pose.depth }} aria-hidden="true">
                <span className="deck-media" />
                <span className="deck-line" />
                <span className="deck-line short" />
              </li>
            ))}

            {ready && featured.map((product, i) => {
              const pose = POSES[i];
              const inCart = (cartItems[product._id] || 0) > 0;
              const spec = product.specs?.[0]?.value;
              return (
                <li key={product._id} className="deck-card" style={{ '--i': i, '--r': `${pose.r}deg`, '--depth': pose.depth }}>
                  <div className="deck-float">
                    <button type="button" className="deck-open" onClick={() => openProduct(product._id)} aria-label={`View ${product.name}`}>
                      <span className="deck-media">
                        <img src={url + '/images/' + product.image} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                      </span>
                      <span className="deck-cat">{categoryLabel(product.category)}{spec ? ` · ${spec}` : ''}</span>
                      <strong className="deck-name">{product.name}</strong>
                    </button>
                    <div className="deck-foot">
                      <b>{formatPrice(product.price)}</b>
                      <button type="button" className={`deck-add${inCart ? ' is-in' : ''}`} onClick={() => quickAdd(product)} aria-label={`Add ${product.name} to cart`}>
                        {inCart ? <CheckIcon /> : <PlusIcon />}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        }
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
