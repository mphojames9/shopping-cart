import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import './Spotlight.css';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { menu_list } from '../../assets/assets';
import { categoryLabel, formatPrice } from '../../utils/format';
import {
  buildCategoryWords, buildIndex, buildSuggestions, highlight, parseQuery, removeChip, searchProducts,
} from '../../utils/smartSearch';
import {
  ArrowRightIcon, CartIcon, ClockIcon, CloseIcon, EnterIcon, MicIcon, MinusIcon, PlusIcon, SearchIcon, SparklesIcon,
} from '../Icons';

const HOME = '/shopping-cart';
const CART = '/shopping-cart/cart';
const RECENT_KEY = 'onestop:recent-searches';
const LIMIT = 8;
const FALLBACK_EXAMPLES = ['phones under R5000', 'cheapest laptop', 'gaming 2k-6k'];

/* Anything in the app can open the palette: openSpotlight() or openSpotlight('phones') */
export const openSpotlight = (query = '') =>
  window.dispatchEvent(new CustomEvent('spotlight:open', { detail: { query } }));

export const modifierKey = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')
    ? '⌘'
    : 'Ctrl';

const loadRecent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((x) => typeof x === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
};
const saveRecent = (list) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* private mode: fine */ }
};

const isTyping = (target) => !!target?.closest?.('input, textarea, select, [contenteditable="true"]');

/* ------------------------------------------------------------------
   Presentational view (no data fetching, easy to preview)
------------------------------------------------------------------- */
export const SpotlightView = ({
  closing, query, onQuery, onClear, inputRef, panelRef, placeholder, phase, listening, canVoice, onVoice, onClose,
  onKeyDown, chips, onChip, sections, cursor, onCursor, onRun, onAdd, onRemoveOne, qtyOf, url, tokens, ready,
  cart, onCart, activeItem, mod, notice, emptyFor, onClearRecent,
}) => {
  const hint = !activeItem ? '' : activeItem.kind === 'product' ? 'add to cart' : activeItem.kind === 'action' ? 'open' : activeItem.kind === 'category' ? 'browse' : 'search';

  const renderItem = (item) => {
    const active = item.idx === cursor;
    const common = {
      id: `sp-opt-${item.idx}`,
      role: 'option',
      'aria-selected': active,
      className: `sp-row sp-${item.kind}${active ? ' is-active' : ''}`,
      onPointerMove: () => { if (!active) onCursor(item.idx); },
      onClick: () => onRun(item, 'click'),
    };

    if (item.kind === 'product') {
      const p = item.product;
      const qty = qtyOf(p._id);
      return (
        <li key={item.key} {...common}>
          <span className="sp-thumb">
            <img src={url + '/images/' + p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          </span>
          <span className="sp-main">
            <strong className="sp-name">
              {highlight(p.name, tokens).map((part, i) => (part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>))}
            </strong>
            <span className="sp-meta">{[categoryLabel(p.category), ...(p.specs || []).slice(0, 2).map((spec) => spec.value)].join(' · ')}</span>
          </span>
          <span className="sp-price">{formatPrice(p.price)}</span>
          {qty === 0 ? (
            <button type="button" tabIndex={-1} className="sp-add" aria-label={`Add ${p.name} to cart`}
              onClick={(e) => { e.stopPropagation(); onAdd(p); }}>
              <PlusIcon /><span>Add</span><kbd aria-hidden="true"><EnterIcon /></kbd>
            </button>
          ) : (
            <span className="sp-stepper" onClick={(e) => e.stopPropagation()}>
              <button type="button" tabIndex={-1} aria-label={`Remove one ${p.name}`} onClick={() => onRemoveOne(p)}><MinusIcon /></button>
              <span key={qty}>{qty}</span>
              <button type="button" tabIndex={-1} aria-label={`Add one more ${p.name}`} onClick={() => onAdd(p)}><PlusIcon /></button>
            </span>
          )}
        </li>
      );
    }

    if (item.kind === 'category') {
      return (
        <li key={item.key} {...common}>
          <span className="sp-thumb sp-thumb-sm"><img src={item.image} alt="" loading="lazy" /></span>
          <span className="sp-main"><strong className="sp-name"><span>{categoryLabel(item.name)}</span></strong></span>
          <span className="sp-count">{item.count}</span>
          <ArrowRightIcon className="sp-go" />
        </li>
      );
    }

    if (item.kind === 'action') {
      return (
        <li key={item.key} {...common}>
          <span className="sp-glyph sp-glyph-brand"><ArrowRightIcon /></span>
          <span className="sp-main"><strong className="sp-name"><span>{item.label}</span></strong><span className="sp-meta">{item.sub}</span></span>
          <EnterIcon className="sp-go" />
        </li>
      );
    }

    // recent + suggestion
    const Icon = item.kind === 'recent' ? ClockIcon : SparklesIcon;
    return (
      <li key={item.key} {...common}>
        <span className="sp-glyph"><Icon /></span>
        <span className="sp-main"><strong className="sp-name"><span>{item.text}</span></strong></span>
        <ArrowRightIcon className="sp-go sp-fill" />
      </li>
    );
  };

  return (
    <div className={`sp-root${closing ? ' is-closing' : ''}`} onKeyDown={onKeyDown}>
      <div className="sp-backdrop" onClick={onClose} />
      <div className={`sp-panel${listening ? ' is-listening' : ''}`} role="dialog" aria-modal="true" aria-label="Search products" ref={panelRef}>

        <div className="sp-input">
          <SearchIcon className="sp-input-icon" />
          <div className="sp-field">
            {!query && <span className="sp-ph" key={phase} aria-hidden="true">{listening ? 'Listening…' : placeholder}</span>}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              role="combobox"
              aria-expanded="true"
              aria-controls="sp-list"
              aria-autocomplete="list"
              aria-activedescendant={activeItem ? `sp-opt-${cursor}` : undefined}
              aria-label="Search products"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              enterKeyHint="go"
            />
          </div>
          {query && <button type="button" className="sp-iconbtn" aria-label="Clear search" onClick={onClear}><CloseIcon /></button>}
          {canVoice &&
            <button type="button" className={`sp-iconbtn sp-mic${listening ? ' is-on' : ''}`} aria-label={listening ? 'Stop voice search' : 'Search by voice'} aria-pressed={listening} onClick={onVoice}>
              <MicIcon />
            </button>
          }
          <button type="button" className="sp-esc" onClick={onClose} aria-label="Close search"><kbd>esc</kbd><span>Cancel</span></button>
        </div>

        {chips.length > 0 &&
          <div className="sp-chips" aria-label="How your search was understood">
            <SparklesIcon className="sp-chips-icon" />
            {chips.map((chip) => (
              <button key={chip.id} type="button" className={`sp-chip sp-chip-${chip.kind}`} onClick={() => onChip(chip)} aria-label={`Remove filter: ${chip.label}`}>
                {chip.label}<CloseIcon />
              </button>
            ))}
          </div>
        }

        <ul
          className="sp-list"
          id="sp-list"
          role="listbox"
          aria-label="Results"
          aria-busy={!ready}
          onMouseDown={(e) => { if (e.target.closest('.sp-row, .sp-clear-recent')) e.preventDefault(); }}
        >
          {!ready && Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="sp-skel" role="presentation"><span /><i /><i /></li>
          ))}

          {ready && emptyFor &&
            <li className="sp-empty" role="presentation">
              <span className="sp-empty-icon"><SearchIcon /></span>
              <strong>Nothing matches “{emptyFor}”</strong>
              <span>Try another word, or remove a filter above.</span>
            </li>
          }

          {sections.map((section, s) => (
            <React.Fragment key={section.title || `s${s}`}>
              {section.title &&
                <li className="sp-section" role="presentation">
                  <span>{section.title}</span>
                  {section.meta && <small>{section.meta}</small>}
                  {section.title === 'Recent searches' &&
                    <button type="button" tabIndex={-1} className="sp-clear-recent" onClick={onClearRecent}>Clear</button>
                  }
                </li>
              }
              {section.items.map(renderItem)}
            </React.Fragment>
          ))}
        </ul>

        <footer className="sp-foot">
          <span className="sp-hints" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd>navigate</span>
            {hint && <span><kbd><EnterIcon /></kbd>{hint}</span>}
            {activeItem?.kind === 'product' && <span><kbd>{mod}</kbd><kbd><EnterIcon /></kbd>show in shop</span>}
          </span>
          {cart.count > 0 &&
            <button type="button" className="sp-cart" onClick={onCart}>
              <CartIcon />
              <span>{cart.count} {cart.count === 1 ? 'item' : 'items'} · {formatPrice(cart.total)}</span>
              <ArrowRightIcon />
            </button>
          }
        </footer>

        <div className="sp-sr" role="status" aria-live="polite">{notice}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   Container: shortcuts, search, cart + navigation
------------------------------------------------------------------- */
const Spotlight = () => {

  const { food_list, ready, cartItems, addToCart, removeFromCart, getTotalCartAmount, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState(loadRecent);
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState(0);
  const [notice, setNotice] = useState('');

  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const closeTimer = useRef(null);
  const recognition = useRef(null);
  const keyboardMove = useRef(false);

  /* ----- open / close ----- */
  const stopVoice = useCallback(() => {
    try { recognition.current?.abort(); } catch { /* already stopped */ }
    recognition.current = null;
    setListening(false);
  }, []);

  const show = useCallback((initial = '') => {
    clearTimeout(closeTimer.current);
    lastFocus.current = document.activeElement;
    setQuery(initial);
    setCursor(0);
    setClosing(false);
    setOpen(true);
  }, []);

  const hide = useCallback(({ restoreFocus = true } = {}) => {
    stopVoice();
    setClosing(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      if (restoreFocus) lastFocus.current?.focus?.({ preventScroll: true });
    }, 160);
  }, [stopVoice]);

  // Ctrl/Cmd + K and "/" from anywhere, plus openSpotlight() from other components
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open && !closing) hide(); else show();
        return;
      }
      if (!open && event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();
        show();
      }
    };
    const onOpen = (event) => show(event.detail?.query || '');
    window.addEventListener('keydown', onKey);
    window.addEventListener('spotlight:open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('spotlight:open', onOpen);
    };
  }, [open, closing, show, hide]);

  // while open: page behind does not scroll, input is focused, placeholder rotates
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open || query) return undefined;
    const timer = setInterval(() => setPhase((p) => p + 1), 2800);
    return () => clearInterval(timer);
  }, [open, query]);

  useEffect(() => () => { clearTimeout(closeTimer.current); stopVoice(); }, [stopVoice]);

  /* ----- understanding + searching ----- */
  const categoryWords = useMemo(() => buildCategoryWords(food_list), [food_list]);
  const index = useMemo(() => buildIndex(food_list, categoryWords), [food_list, categoryWords]);
  const parsed = useMemo(() => parseQuery(query, categoryWords), [query, categoryWords]);
  const found = useMemo(() => searchProducts(index, parsed), [index, parsed]);
  const suggestions = useMemo(() => buildSuggestions(food_list, categoryWords), [food_list, categoryWords]);
  const categories = useMemo(
    () => menu_list
      .map((m) => ({ name: m.menu_name, image: m.menu_image, count: food_list.filter((p) => p.category === m.menu_name).length }))
      .filter((c) => c.count > 0),
    [food_list]
  );

  const cartCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const cart = { count: cartCount, total: getTotalCartAmount() };
  const qtyOf = (id) => cartItems[id] || 0;

  /* ----- actions ----- */
  const remember = (text) => {
    const clean = text.trim();
    if (clean.length < 2) return;
    setRecent((previous) => {
      const next = [clean, ...previous.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      saveRecent(next);
      return next;
    });
  };

  const addProduct = (product) => {
    addToCart(product._id);
    remember(query);
    setNotice(`${product.name} added to cart`);
  };
  const removeOne = (product) => {
    removeFromCart(product._id);
    setNotice(`One ${product.name} removed from cart`);
  };
  const reveal = (product) => {
    remember(query);
    hide({ restoreFocus: false });
    navigate(HOME, { state: { reveal: { id: product._id, at: Date.now() } } });
  };
  const showAll = () => {
    remember(query);
    hide({ restoreFocus: false });
    navigate(HOME, {
      state: {
        scrollTo: 'food-display',
        smart: { ids: found.results.map((r) => r.product._id), label: query.trim() },
      },
    });
  };
  const goCategory = (name) => {
    hide({ restoreFocus: false });
    navigate(HOME, { state: { scrollTo: 'food-display', category: name } });
  };
  const goCart = () => {
    hide({ restoreFocus: false });
    navigate(CART);
  };
  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  /* ----- the list the keyboard moves through ----- */
  const { sections, flat } = useMemo(() => {
    const out = [];
    let n = 0;
    const add = (title, list, meta) => {
      if (list.length) out.push({ title, meta, items: list.map((item) => ({ ...item, idx: n++ })) });
    };
    const asIdeas = () => add('Try asking', suggestions.map((text) => ({ kind: 'suggestion', key: 's:' + text, text })));

    if (!ready) return { sections: [], flat: [] };
    if (parsed.empty) {
      add('Recent searches', recent.map((text) => ({ kind: 'recent', key: 'r:' + text, text })));
      asIdeas();
      add('Browse categories', categories.map((c) => ({ kind: 'category', key: 'c:' + c.name, ...c })));
    } else if (found.results.length) {
      const total = found.results.length;
      add(
        found.partial ? 'Closest matches' : 'Products',
        found.results.slice(0, LIMIT).map((r) => ({ kind: 'product', key: 'p:' + r.product._id, product: r.product })),
        found.partial ? 'No exact match' : `${total} ${total === 1 ? 'match' : 'matches'}`
      );
      if (total > 1) {
        add('', [{
          kind: 'action', key: 'all', label: `Show all ${total} in the shop`,
          sub: total > LIMIT ? `${total - LIMIT} more than shown here` : 'See them in the product grid',
        }]);
      }
    } else {
      asIdeas();
    }
    return { sections: out, flat: out.flatMap((s) => s.items) };
  }, [ready, parsed.empty, found, recent, suggestions, categories]);

  const active = Math.min(cursor, Math.max(flat.length - 1, 0));
  const activeItem = flat[active];

  const run = (item, mode) => {
    if (!item) return;
    if (item.kind === 'product') {
      if (mode === 'enter') addProduct(item.product); else reveal(item.product);
    } else if (item.kind === 'action') {
      showAll();
    } else if (item.kind === 'category') {
      goCategory(item.name);
    } else {
      // recent search or suggestion: fill the box and keep going
      setQuery(item.text);
      setCursor(0);
      inputRef.current?.focus();
    }
  };

  // keep the highlighted row visible when moving with the arrow keys
  useEffect(() => {
    if (!keyboardMove.current) return;
    keyboardMove.current = false;
    document.getElementById(`sp-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flat.length) return;
      keyboardMove.current = true;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setCursor((active + step + flat.length) % flat.length);
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      if (event.target.tagName === 'BUTTON') return; // let the focused button do its own thing
      if (activeItem) {
        event.preventDefault();
        run(activeItem, event.metaKey || event.ctrlKey ? 'mod' : 'enter');
      }
    } else if (event.key === 'Tab') {
      // keep focus inside the dialog
      const nodes = [...(panelRef.current?.querySelectorAll('input, button:not([tabindex="-1"])') || [])].filter((n) => !n.disabled && n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  /* ----- voice ----- */
  const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const toggleVoice = () => {
    if (!Recognition) return;
    if (listening) { stopVoice(); return; }
    const recorder = new Recognition();
    recorder.lang = 'en-ZA';
    recorder.interimResults = true;
    recorder.continuous = false;
    recorder.onresult = (event) => {
      const text = Array.from(event.results).map((r) => r[0].transcript).join(' ').trim();
      setQuery(text);
      setCursor(0);
    };
    recorder.onend = () => {
      recognition.current = null;
      setListening(false);
      inputRef.current?.focus();
    };
    recorder.onerror = () => {
      recognition.current = null;
      setListening(false);
    };
    recognition.current = recorder;
    setListening(true);
    try { recorder.start(); } catch { setListening(false); }
  };

  if (!open) return null;

  const examples = suggestions.length ? suggestions : FALLBACK_EXAMPLES;

  return (
    <SpotlightView
      closing={closing}
      query={query}
      onQuery={(value) => { setQuery(value); setCursor(0); }}
      onClear={() => { setQuery(''); setCursor(0); inputRef.current?.focus(); }}
      inputRef={inputRef}
      panelRef={panelRef}
      placeholder={`Try “${examples[phase % examples.length]}”`}
      phase={phase}
      listening={listening}
      canVoice={!!Recognition}
      onVoice={toggleVoice}
      onClose={() => hide()}
      onKeyDown={onKeyDown}
      chips={parsed.chips}
      onChip={(chip) => { setQuery(removeChip(query, chip)); setCursor(0); inputRef.current?.focus(); }}
      sections={sections}
      cursor={active}
      onCursor={setCursor}
      onRun={run}
      onAdd={addProduct}
      onRemoveOne={removeOne}
      qtyOf={qtyOf}
      url={url}
      tokens={parsed.tokens}
      ready={ready}
      cart={cart}
      onCart={goCart}
      activeItem={activeItem}
      mod={modifierKey()}
      notice={notice}
      emptyFor={!parsed.empty && ready && found.results.length === 0 ? query.trim() : ''}
      onClearRecent={clearRecent}
    />
  );
};

export default Spotlight;
