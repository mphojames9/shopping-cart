import React, { useContext } from 'react';
import './WishlistButton.css';
import { StoreContext } from '../../context/StoreContext';
import { HeartIcon } from '../Icons';

// Round heart button: tap to save a product for later, tap again to remove it.
// Position it with a className from the parent (it is a plain inline-grid circle).
const WishlistButton = ({ id, name, className = '' }) => {

  const { wishlist, toggleWishlist } = useContext(StoreContext);
  const saved = wishlist.includes(id);

  return (
    <button
      type="button"
      className={`heart${saved ? ' on' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={saved}
      aria-label={`Save ${name} to wishlist`}
      title={saved ? 'Saved to wishlist' : 'Save to wishlist'}
      onClick={(event) => { event.stopPropagation(); toggleWishlist(id); }}
    >
      <HeartIcon />
    </button>
  );
}

export default WishlistButton;
