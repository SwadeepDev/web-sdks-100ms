import * as React from 'react';

function SvgRefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.546 3c.451 0 .818.366.818.818v4.91a.818.818 0 01-.819.817h-4.909a.818.818 0 110-1.636h4.091V3.82c0-.453.367-.819.819-.819z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.191 5.54A6.545 6.545 0 005.636 12 .818.818 0 114 12a8.182 8.182 0 0113.636-6.092l.002.002 2.455 2.21a.818.818 0 11-1.095 1.215l-2.453-2.207a6.546 6.546 0 00-3.354-1.589zM4 15.273c0-.452.366-.818.818-.818h4.91a.818.818 0 010 1.636H5.635v4.09a.818.818 0 01-1.636 0v-4.908z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.546 11.182c.452 0 .818.367.818.819a8.181 8.181 0 01-13.637 6.09l-.002-.001-2.454-2.21a.818.818 0 111.095-1.215l2.452 2.207h.001A6.546 6.546 0 0018.727 12c0-.452.367-.818.82-.817z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgRefreshIcon;
