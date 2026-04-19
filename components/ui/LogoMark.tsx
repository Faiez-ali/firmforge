interface Props {
  size?: number;
  className?: string;
}

/**
 * FirmForge Layer Stack mark — inline SVG, dark-background variant.
 * Uses brand-400 (#5291ff) bars and brand-300 (#8ab8ff) nodes
 * so it reads clearly on the app's #060610 background.
 * Pass `size` to control width/height (default 22).
 */
export function LogoMark({ size = 22, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Bars — brand-400 #5291ff */}
      <rect x="8"  y="11" width="54" height="5" rx="2" fill="#5291ff" />
      <rect x="8"  y="26" width="42" height="5" rx="2" fill="#5291ff" />
      <rect x="8"  y="41" width="30" height="5" rx="2" fill="#5291ff" />
      <rect x="8"  y="56" width="18" height="5" rx="2" fill="#5291ff" />

      {/* Diagonal trace — brand-300 #8ab8ff @ 0.35 opacity */}
      <polyline
        points="62,13.5 50,28.5 38,43.5 26,58.5"
        stroke="#8ab8ff"
        strokeWidth="1"
        strokeOpacity="0.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Node halos — white at low opacity */}
      <circle cx="62" cy="13.5" r="6"   fill="#ffffff" fillOpacity="0.12" />
      <circle cx="50" cy="28.5" r="6"   fill="#ffffff" fillOpacity="0.12" />
      <circle cx="38" cy="43.5" r="6"   fill="#ffffff" fillOpacity="0.12" />
      <circle cx="26" cy="58.5" r="6"   fill="#ffffff" fillOpacity="0.12" />

      {/* Node dots — brand-300 #8ab8ff */}
      <circle cx="62" cy="13.5" r="3.5" fill="#8ab8ff" />
      <circle cx="50" cy="28.5" r="3.5" fill="#8ab8ff" />
      <circle cx="38" cy="43.5" r="3.5" fill="#8ab8ff" />
      <circle cx="26" cy="58.5" r="3.5" fill="#8ab8ff" />
    </svg>
  );
}
