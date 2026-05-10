import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/* Optique (on ne touche pas) */
export function EyeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LensIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3.5c5.2 0 9.5 3.6 9.5 8.5S17.2 20.5 12 20.5 2.5 16.9 2.5 12 6.8 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.5 12c0-2 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5S8.5 14 8.5 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8.6v6.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/* Audio : TEST AUDITIF = vraie oreille (plus “oreille” visuellement) */
export function EarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {/* Contour oreille (très lisible) */}
      <path
        d="M7.5 12.2V10.4A6.1 6.1 0 0 1 13.6 4.3c3.4 0 6.1 2.7 6.1 6.1v2.6c0 3.2-1.8 5.3-4.3 6.3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 12.2v3.3A5.1 5.1 0 0 0 12.6 20.6c2 0 3.7-1.6 3.7-3.6 0-1.4-.8-2.5-2-3.1l-1.1-.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Détail intérieur (donne l'effet “oreille”) */}
      <path
        d="M11 12.2c0-1.4 1.1-2.5 2.5-2.5S16 10.8 16 12.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/* Audio : APPAREILLAGE = appareil auditif simple (BTE) */
export function HearingAidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {/* Corps principal (intra) */}
      <path
        d="M14.8 4.3c3.3.6 5.6 3.7 5.6 7.6 0 5.2-3.9 9.4-8.7 8.6-2.6-.4-4.3-2.4-4.3-4.9 0-1.8.9-3.3 2.3-4.3l2-1.4c1.1-.8 1.6-1.6 1.6-2.9V6.2c0-1 .6-1.9 1.5-1.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Faceplate / panneau */}
      <path
        d="M13.4 8.2h3.3c.7 0 1.3.6 1.3 1.3v6c0 .7-.6 1.3-1.3 1.3h-3.3c-.7 0-1.3-.6-1.3-1.3v-6c0-.7.6-1.3 1.3-1.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Petit trou / micro */}
      <circle
        cx="15.1"
        cy="17.4"
        r="0.7"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* "Fil" + boule (outil de retrait) */}
      <path
        d="M11.8 11.7L6.9 10.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="6.1"
        cy="9.9"
        r="0.9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M16.5 19.2c0-2.1-2-3.7-4.5-3.7s-4.5 1.6-4.5 3.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 12.7a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9 7.2V6.6c0-1.2.9-2.1 2.1-2.1h1.8c1.2 0 2.1.9 2.1 2.1v.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 8.2h11c1.3 0 2.3 1 2.3 2.3v7c0 1.3-1 2.3-2.3 2.3h-11c-1.3 0-2.3-1-2.3-2.3v-7c0-1.3 1-2.3 2.3-2.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.2 13h15.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
