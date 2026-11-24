import React from 'react';

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

const icon = (children, extra = {}) => (props) => (
  <svg {...base} {...extra} {...props}>{children}</svg>
);

export const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);

export const CartIcon = icon(
  <>
    <path d="M3 4h2.2l2 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.78L19.5 8H6" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </>
);

export const ChevronIcon = icon(<path d="m6 9 6 6 6-6" />, { width: 16, height: 16 });

export const HomeIcon = icon(
  <>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1v-9" />
  </>
);

export const GridIcon = icon(
  <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  </>
);

export const UserIcon = icon(
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" />
  </>
);

export const PackageIcon = icon(
  <>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
    <path d="m4 7 8 4 8-4M12 11v10" />
  </>
);

export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = icon(<path d="M5 12h14" />);
export const CheckIcon = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const CloseIcon = icon(<path d="M6 6l12 12M18 6 6 18" />);
export const ArrowRightIcon = icon(<path d="M5 12h14M13 6l6 6-6 6" />);

export const TruckIcon = icon(
  <>
    <path d="M3 6.5h10.5V16H3zM13.5 10h4l3 3v3h-7" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
  </>
);

export const ClockIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>
);

export const ShieldIcon = icon(
  <>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </>
);

export const MicIcon = icon(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </>
);

export const SparklesIcon = icon(
  <>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </>
);

export const EnterIcon = icon(<path d="M20 5v6a3 3 0 0 1-3 3H5m0 0 4-4m-4 4 4 4" />);

// outline by default; WishlistButton fills it with CSS when the product is saved
export const HeartIcon = icon(
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
);

export const TagIcon = icon(
  <>
    <path d="M3 3h8l9.5 9.5a2 2 0 0 1 0 2.8l-5.2 5.2a2 2 0 0 1-2.8 0L3 11z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </>
);
