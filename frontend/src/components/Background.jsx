import React from 'react';

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gray-900">
      {/* Hexagon Grid Pattern */}
      <svg
        className="w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="hexagons"
            width="50"
            height="43.4"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(2) rotate(0)"
          >
            <path
              d="M25 0L50 14.4v28.8L25 43.4L0 28.8V14.4z"
              strokeLinecap="square"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gray-700"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />

        {/* Gradient overlays for depth */}
        <rect
          width="100%"
          height="100%"
          fill="url(#gradient-overlay)"
          opacity="0.4"
        />
        <defs>
          <linearGradient
            id="gradient-overlay"
            x1="0"
            y1="0"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Background;