const NigeriaMapSVG = ({ getStateColor, getStateData, onStateClick, selectedState }) => {
  const states = [
    // Each state as a simplified rectangle/polygon for hackathon demo
    // Arranged in approximate geographic position
    // Northern states
    { name: 'Sokoto', x: 60, y: 30, w: 80, h: 60 },
    { name: 'Kebbi', x: 60, y: 90, w: 80, h: 60 },
    { name: 'Zamfara', x: 140, y: 30, w: 80, h: 60 },
    { name: 'Katsina', x: 220, y: 20, w: 80, h: 70 },
    { name: 'Kano', x: 300, y: 30, w: 90, h: 70 },
    { name: 'Jigawa', x: 390, y: 20, w: 80, h: 70 },
    { name: 'Yobe', x: 470, y: 20, w: 90, h: 70 },
    { name: 'Borno', x: 530, y: 20, w: 110, h: 120 },
    // Middle belt
    { name: 'Niger', x: 100, y: 170, w: 120, h: 90 },
    { name: 'Kaduna', x: 220, y: 90, w: 100, h: 100 },
    { name: 'Bauchi', x: 390, y: 90, w: 100, h: 80 },
    { name: 'Gombe', x: 450, y: 130, w: 80, h: 70 },
    { name: 'Adamawa', x: 500, y: 150, w: 90, h: 120 },
    { name: 'Taraba', x: 430, y: 210, w: 90, h: 100 },
    { name: 'Plateau', x: 330, y: 160, w: 90, h: 90 },
    { name: 'Nasarawa', x: 270, y: 200, w: 80, h: 70 },
    { name: 'Benue', x: 310, y: 250, w: 110, h: 90 },
    { name: 'Kogi', x: 220, y: 270, w: 100, h: 80 },
    { name: 'Kwara', x: 130, y: 250, w: 100, h: 80 },
    { name: 'Abuja', x: 270, y: 195, w: 50, h: 50 },
    // Southwest
    { name: 'Oyo', x: 100, y: 340, w: 100, h: 80 },
    { name: 'Osun', x: 160, y: 370, w: 80, h: 70 },
    { name: 'Ekiti', x: 220, y: 360, w: 70, h: 70 },
    { name: 'Ondo', x: 180, y: 400, w: 90, h: 80 },
    { name: 'Ogun', x: 100, y: 420, w: 90, h: 70 },
    { name: 'Lagos', x: 80, y: 460, w: 80, h: 50 },
    // Southeast and South-south
    { name: 'Edo', x: 220, y: 380, w: 90, h: 80 },
    { name: 'Delta', x: 210, y: 440, w: 90, h: 70 },
    { name: 'Anambra', x: 290, y: 380, w: 80, h: 70 },
    { name: 'Enugu', x: 330, y: 310, w: 80, h: 80 },
    { name: 'Ebonyi', x: 370, y: 350, w: 70, h: 70 },
    { name: 'Imo', x: 290, y: 430, w: 80, h: 70 },
    { name: 'Abia', x: 350, y: 400, w: 70, h: 70 },
    { name: 'Cross River', x: 400, y: 320, w: 90, h: 120 },
    { name: 'Akwa Ibom', x: 360, y: 440, w: 90, h: 70 },
    { name: 'Rivers', x: 280, y: 470, w: 90, h: 70 },
    { name: 'Bayelsa', x: 240, y: 490, w: 70, h: 50 },
  ];

  const getStateLabel = (stateName) => {
    if (stateName === 'Abuja') return 'FCT';
    if (stateName.length > 8) return stateName.substring(0, 7) + '.';
    return stateName;
  };

  return (
    <svg
      viewBox="0 0 660 560"
      className="w-full h-auto"
      style={{ background: 'transparent' }}
    >
      {states.map(state => (
        <g key={state.name} onClick={() => onStateClick(state.name)}
          className="cursor-pointer">
          <rect
            x={state.x}
            y={state.y}
            width={state.w}
            height={state.h}
            rx="4"
            fill={getStateColor(state.name)}
            stroke={selectedState === state.name ? '#FFFFFF' : '#0F172A'}
            strokeWidth={selectedState === state.name ? 2 : 1}
            opacity={0.85}
          />
          {state.w > 60 && (
            <text
              x={state.x + state.w / 2}
              y={state.y + state.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={state.name === 'Abuja' ? 7 : 9}
              fontWeight="600"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {getStateLabel(state.name)}
            </text>
          )}
          {getStateData(state.name) && (
            <text
              x={state.x + state.w / 2}
              y={state.y + state.h / 2 + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FCA5A5"
              fontSize={8}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {getStateData(state.name).count}
            </text>
          )}
        </g>
      ))}

      {/* Nigeria label */}
      <text x="330" y="540" textAnchor="middle"
        fill="#475569" fontSize={12} fontWeight="500">
        Federal Republic of Nigeria
      </text>
    </svg>
  );
};

export default NigeriaMapSVG;