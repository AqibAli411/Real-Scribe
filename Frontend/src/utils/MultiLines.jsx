function MultiLines({ color }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        stroke={color}
        strokeWidth="2.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default MultiLines;
