import * as React from 'react';
import { SVGProps } from 'react';

const SvgEmojiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.636 12a7.364 7.364 0 1 1 14.728 0 7.364 7.364 0 0 1-14.728 0ZM12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3.764 9.982a.818.818 0 0 1 1.143.16l.004.005.028.034a4.041 4.041 0 0 0 .667.612c.472.343 1.125.661 1.922.661.797 0 1.45-.318 1.922-.661a4.049 4.049 0 0 0 .667-.612l.028-.034.004-.005a.818.818 0 0 1 1.306.985l-.654-.49.654.49v.001l-.002.002-.002.003-.006.007-.017.023a4.59 4.59 0 0 1-.26.296c-.174.18-.427.419-.755.657-.653.475-1.637.975-2.885.975-1.248 0-2.232-.5-2.885-.975a5.677 5.677 0 0 1-.958-.883 3.21 3.21 0 0 1-.057-.07l-.017-.023-.006-.007-.003-.003v-.002l.653-.492-.654.491a.818.818 0 0 1 .163-1.145Zm.491-3.437c0-.451.367-.818.818-.818h.009a.818.818 0 0 1 0 1.637h-.009a.818.818 0 0 1-.818-.819Zm5.727-.818a.818.818 0 0 0 0 1.637h.009a.818.818 0 0 0 0-1.637h-.008Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgEmojiIcon;
