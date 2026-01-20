import { SVGProps } from "react";

export const PawIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Main pad - heart-shaped bottom */}
    <path d="M12 20c-3.5 0-6-2.5-6-5.5 0-2 1.5-3.5 3-4.5 1-.7 2-1 3-1s2 .3 3 1c1.5 1 3 2.5 3 4.5 0 3-2.5 5.5-6 5.5z" />
    {/* Top toe beans - more rounded and cute */}
    <ellipse cx="8" cy="8" rx="2.2" ry="2.5" />
    <ellipse cx="16" cy="8" rx="2.2" ry="2.5" />
    {/* Side toe beans */}
    <ellipse cx="4.5" cy="12.5" rx="1.8" ry="2.2" transform="rotate(-15 4.5 12.5)" />
    <ellipse cx="19.5" cy="12.5" rx="1.8" ry="2.2" transform="rotate(15 19.5 12.5)" />
  </svg>
);

export const BoneIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M19.5 4.5a3 3 0 0 0-4.24 0l-.26.26-.26-.26a3 3 0 0 0-4.24 4.24l.26.26-5 5-.26-.26a3 3 0 0 0-4.24 4.24l.26.26-.26.26a3 3 0 1 0 4.24 4.24l.26-.26.26.26a3 3 0 0 0 4.24-4.24l-.26-.26 5-5 .26.26a3 3 0 0 0 4.24-4.24l-.26-.26.26-.26a3 3 0 0 0 0-4.24Z" />
  </svg>
);
