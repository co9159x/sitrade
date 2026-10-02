export function DeskArt() {
  return (
    <figure className="rise-late relative">
      <svg viewBox="0 0 640 460" className="w-full" role="img" aria-label="Illustration of a trading desk. It is not a live price chart.">
        <rect width="640" height="460" rx="16" fill="#141b2a" />
        <rect x="1" y="1" width="638" height="458" rx="15" fill="none" stroke="#3a4a66" />
        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={index}
            x1="28"
            x2="612"
            y1={70 + index * 42}
            y2={70 + index * 42}
            stroke="#2c3a52"
          />
        ))}
        <g fill="#7c6cff">
          <rect x="48" y="210" width="16" height="70" />
          <rect x="46" y="188" width="4" height="110" />
          <rect x="98" y="180" width="16" height="90" />
          <rect x="96" y="160" width="4" height="130" />
          <rect x="148" y="150" width="16" height="120" />
          <rect x="146" y="132" width="4" height="156" />
        </g>
        <g fill="#2fce8f">
          <rect x="198" y="168" width="16" height="84" />
          <rect x="196" y="150" width="4" height="120" />
          <rect x="248" y="190" width="16" height="70" />
          <rect x="246" y="176" width="4" height="100" />
          <rect x="298" y="140" width="16" height="110" />
          <rect x="296" y="124" width="4" height="142" />
          <rect x="348" y="118" width="16" height="96" />
          <rect x="346" y="104" width="4" height="128" />
        </g>
        <g fill="#ff5c6a">
          <rect x="398" y="150" width="16" height="88" />
          <rect x="396" y="136" width="4" height="118" />
          <rect x="448" y="176" width="16" height="74" />
          <rect x="446" y="160" width="4" height="108" />
        </g>
        <polyline
          className="draw-line"
          points="56,248 106,214 156,196 206,188 256,214 306,168 356,150 406,182 456,198 540,132"
          fill="none"
          stroke="#edf2f7"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g fill="#243049">
          {[18, 28, 14, 36, 22, 40, 16, 30, 24, 12].map((height, index) => (
            <rect key={height + index} x={48 + index * 50} y={390 - height} width="22" height={height} />
          ))}
        </g>
        <text x="28" y="36" fill="#93a0b5" fontFamily="Barlow Condensed, sans-serif" fontSize="16" letterSpacing="2">
          DESK FRAME
        </text>
        <text x="430" y="36" fill="#e7b15a" fontFamily="Barlow Condensed, sans-serif" fontSize="16" letterSpacing="2">
          NOT A LIVE QUOTE
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-muted">
        Original desk illustration. Candle shapes are drawn for the layout and are not market prices.
      </figcaption>
    </figure>
  )
}
