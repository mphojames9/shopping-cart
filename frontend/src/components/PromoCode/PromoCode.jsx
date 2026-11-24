import React, { useContext, useState } from 'react';
import './PromoCode.css';
import { StoreContext } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import { CloseIcon, TagIcon } from '../Icons';

// "Have a promo code?" box for the cart. Shows the applied code once it works.
const PromoCode = ({ setShowLogin }) => {

  const { token, coupon, applyCoupon, removeCoupon, getDiscount } = useContext(StoreContext);

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || busy) return;
    if (!token) {
      setShowLogin(true); // codes are for signed-in customers; the typed code stays here
      return;
    }
    setBusy(true);
    setError('');
    const result = await applyCoupon(trimmed);
    setBusy(false);
    if (result.ok) {
      setCode('');
      setOpen(false);
    } else {
      setError(result.message || 'That promo code is not valid');
    }
  };

  // applied: show it, with a way to take it off
  if (coupon) {
    const saving = getDiscount();
    const needsMore = saving === 0 && coupon.minSubtotal > 0;
    return (
      <div className={`promo promo-applied${needsMore ? ' is-waiting' : ''}`}>
        <span className="promo-icon"><TagIcon /></span>
        <div className="promo-text">
          <strong>{coupon.code}</strong>
          <span>
            {needsMore
              ? `Spend ${formatPrice(coupon.minSubtotal)} on products to get this discount`
              : coupon.type === 'percent'
                ? `${coupon.value}% off applied`
                : `${formatPrice(coupon.value)} off applied`}
          </span>
        </div>
        <button type="button" className="promo-remove" aria-label={`Remove promo code ${coupon.code}`} onClick={removeCoupon}>
          <CloseIcon />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="promo-toggle" aria-expanded="false" onClick={() => setOpen(true)}>
        <TagIcon /><span>Have a promo code?</span>
      </button>
    );
  }

  return (
    <form className="promo promo-form" onSubmit={submit} noValidate>
      <label htmlFor="promo-code">Promo code</label>
      <div className="promo-row">
        <input
          id="promo-code"
          type="text"
          value={code}
          onChange={(event) => { setCode(event.target.value); setError(''); }}
          placeholder="Enter code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={30}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'promo-error' : undefined}
          autoFocus
        />
        <button type="submit" className="btn btn-ghost" disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : token ? 'Apply' : 'Sign in'}
        </button>
      </div>
      {error && <p className="promo-error" id="promo-error" role="alert">{error}</p>}
      {!token && <p className="promo-hint">Sign in to use a promo code.</p>}
    </form>
  );
};

export default PromoCode;
