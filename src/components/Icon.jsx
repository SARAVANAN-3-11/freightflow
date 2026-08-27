const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3z" />
      <path d="M14 9h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4L12 3Z" />
      <path d="M4 7.4 12 12l8-4.6M12 12v9" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.2 16.8c5.4-1.1 1.2-8.5 7.6-9.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  arrowUp: (
    <>
      <path d="m18 15-6-6-6 6" />
      <path d="M12 9v12" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  fuel: (
    <>
      <path d="M5 4h9v16H5z" />
      <path d="M7.5 7h4M14 8h2l2 2v5a2 2 0 0 0 2 2h1" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4.7L3 9" />
      <path d="M3 4v5h5M4 13a8 8 0 0 0 14.5 4.7L21 15" />
      <path d="M21 20v-5h-5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3V1m0 22v-2M3 12H1m22 0h-2" />
    </>
  ),
  check: <path d="m5 12 4.3 4.3L19 6.5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  stroke = 1.8,
  className = "",
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}
