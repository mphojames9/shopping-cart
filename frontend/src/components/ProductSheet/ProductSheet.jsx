import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import './ProductSheet.css';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { categoryLabel, formatPrice } from '../../utils/format';
import { ArrowRightIcon, CartIcon, CloseIcon, MinusIcon, PlusIcon } from '../Icons';

const CART = '/shopping-cart/cart';

/* Anything can open the product sheet: openProduct(product._id) */
export const openProduct = (id) =>
  window.dispatchEvent(new CustomEvent('product:open', { detail: { id } }));

const ProductSheet = () => {

  const { food_list, ready, cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const [id, setId] = useState(null);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const closeTimer = useRef(null);

  const hide = useCallback(({ restoreFocus = true } = {}) => {
    setClosing(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setId(null);
      setClosing(false);
      if (restoreFocus) lastFocus.current?.focus?.({ preventScroll: true });
    }, 170);
  }, []);

  useEffect(() => {
    const onOpen = (event) => {
      clearTimeout(closeTimer.current);
      lastFocus.current = document.activeElement;
      setClosing(false);
      setId(event.detail?.id ?? null);
    };
    window.addEventListener('product:open', onOpen);
    return () => {
      window.removeEventListener('product:open', onOpen);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const product = id ? food_list.find((item) => item._id === id) : null;

  // the page behind stops scrolling, focus moves into the dialog, Esc closes it
  useEffect(() => {
    if (!product) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('.ps-close')?.focus();
    const onKey = (event) => { if (event.key === 'Escape') { event.preventDefault(); hide(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [product?._id, hide]);

  // the product disappeared (removed in the admin): close quietly
  useEffect(() => {
    if (id && ready && !product) setId(null);
  }, [id, ready, product]);

  if (!product) return null;

  const qty = cartItems[product._id] || 0;
  const specs = Array.isArray(product.specs) ? product.specs : [];

  const addFirst = () => {
    addToCart(product._id);
    window.dispatchEvent(new CustomEvent('cart:added', { detail: { name: product.name } }));
  };
  const goCart = () => {
    hide({ restoreFocus: false });
    navigate(CART);
  };

  // keep Tab inside the dialog
  const trapTab = (event) => {
    if (event.key !== 'Tab') return;
    const nodes = [...panelRef.current.querySelectorAll('button')].filter((n) => !n.disabled && n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div className={`ps-root${closing ? ' is-closing' : ''}`}>
      <div className="ps-backdrop" onClick={() => hide()} />
      <div className="ps-panel" role="dialog" aria-modal="true" aria-labelledby="ps-title" ref={panelRef} onKeyDown={trapTab}>

        <button type="button" className="ps-close" aria-label="Close details" onClick={() => hide()}><CloseIcon /></button>

        <div className="ps-media">
          <img src={url + '/images/' + product.image} alt={product.name} />
        </div>

        <div className="ps-body">
          <div className="ps-scroll">
            <span className="ps-cat">{categoryLabel(product.category)}</span>
            <h2 id="ps-title">{product.name}</h2>
            <strong className="ps-price">{formatPrice(product.price)}</strong>
            <p className="ps-desc">{product.description}</p>

            {specs.length > 0 ? (
              <>
                <h3 className="ps-subtitle">Specifications</h3>
                <dl className="ps-specs">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <dt>{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="ps-nospecs">No specifications listed for this product yet.</p>
            )}
          </div>

          <div className="ps-foot">
            {qty === 0 ? (
              <button type="button" className="ps-add" onClick={addFirst}>
                <PlusIcon /><span>Add to cart</span><b>{formatPrice(product.price)}</b>
              </button>
            ) : (
              <>
                <div className="ps-stepper">
                  <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => removeFromCart(product._id)}><MinusIcon /></button>
                  <span key={qty} aria-live="polite">{qty}</span>
                  <button type="button" aria-label={`Add one more ${product.name}`} onClick={() => addToCart(product._id)}><PlusIcon /></button>
                </div>
                <button type="button" className="ps-cart" onClick={goCart}>
                  <CartIcon /><span>View cart</span><ArrowRightIcon />
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductSheet;
