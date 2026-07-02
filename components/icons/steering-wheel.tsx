import type { SVGProps } from "react";

/**
 * Steering wheel icon — vector equivalente ao fa-solid fa-steering-wheel.
 * Usa currentColor para herdar a cor do texto, funcionando em dark/light mode.
 */
export function SteeringWheelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/*
        Outer ring: annulus via evenodd fill-rule.
        Outer circle r=240, inner circle r=192. Both paths clockwise → evenodd pops the hole.
      */}
      <path
        fillRule="evenodd"
        d="
          M256 16
          C124.3 16 16 124.3 16 256
          C16 387.7 124.3 496 256 496
          C387.7 496 496 387.7 496 256
          C496 124.3 387.7 16 256 16Z
          M256 72
          C355 72 440 157 440 256
          C440 355 355 440 256 440
          C157 440 72 355 72 256
          C72 157 157 72 256 72Z
        "
      />

      {/* Spoke 1 — pointing down (6 o'clock) */}
      <rect x="244" y="302" width="24" height="136" rx="12" />

      {/* Spoke 2 — pointing upper-left (10 o'clock, rotate -120°) */}
      <g transform="rotate(-120 256 256)">
        <rect x="244" y="302" width="24" height="136" rx="12" />
      </g>

      {/* Spoke 3 — pointing upper-right (2 o'clock, rotate +120°) */}
      <g transform="rotate(120 256 256)">
        <rect x="244" y="302" width="24" height="136" rx="12" />
      </g>

      {/* Central hub */}
      <circle cx="256" cy="256" r="46" />
    </svg>
  );
}
