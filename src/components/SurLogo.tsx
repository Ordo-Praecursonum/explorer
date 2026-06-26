import React from 'react'

interface SurLogoProps {
  size?: number
  className?: string
  /** Unique gradient id when multiple logos render on one page. */
  idSuffix?: string
}

/**
 * Sur Scanner logomark — a rounded-square in the Sur flame gradient with a
 * minimalist white "S" ribbon. Crisp at any size and works on light/dark.
 */
const SurLogo: React.FC<SurLogoProps> = ({
  size = 32,
  className,
  idSuffix = '',
}) => {
  const gid = `sur-grad${idSuffix}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Sur Scanner"
    >
      <defs>
        <linearGradient
          id={gid}
          x1="6"
          y1="4"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D9461E" />
          <stop offset="0.55" stopColor="#F26419" />
          <stop offset="1" stopColor="#FF9E40" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gid})`} />
      {/* Two interleaving white ribbons forming an S. */}
      <path
        d="M34 16.5C34 12.5 29.5 10.8 24.5 11.6C18.8 12.5 15.5 16 17.2 19.8"
        stroke="#fff"
        strokeWidth="4.4"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M14 31.5C14 35.5 18.5 37.2 23.5 36.4C29.2 35.5 32.5 32 30.8 28.2"
        stroke="#fff"
        strokeWidth="4.4"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M30.8 28.2C29.4 25 24.5 24.2 20 23.4C16 22.7 17.2 19.8 17.2 19.8"
        stroke="#fff"
        strokeWidth="4.4"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  )
}

export default SurLogo
