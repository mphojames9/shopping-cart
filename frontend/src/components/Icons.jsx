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

export const SearchIcon = (props) => (
  <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const CartIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 4h2.2l2 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.78L19.5 8H6" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </svg>
);

export const ChevronIcon = (props) => (
  <svg {...base} width={16} height={16} {...props}><path d="m6 9 6 6 6-6" /></svg>
);
