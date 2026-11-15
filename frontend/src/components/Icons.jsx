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
