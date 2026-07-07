import React from 'react';

const MARGIN = { top: 40, right: 40, bottom: 50, left: 60 };
const WIDTH = 600;
const HEIGHT = 400;
const GRAPH_W = WIDTH - MARGIN.left - MARGIN.right;
const GRAPH_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const MIN_DB = 0;
const MAX_DB = 120;
const DB_RANGE = MAX_DB - MIN_DB;

// Helper to get X coordinate (Masking Level)
const getX = (db) => {
  return MARGIN.left + ((db - MIN_DB) / DB_RANGE) * GRAPH_W;
};

// Helper to get Y coordinate (Tone Level) - 0 is at the bottom
const getY = (db) => {
  return MARGIN.top + GRAPH_H - ((db - MIN_DB) / DB_RANGE) * GRAPH_H;
};

export default function MaskingProfileGraph({ history, frequency, testEar, transducer, testMode, patient }) {
  if (testMode !== 'TONE') {
    return null;
  }

  // Filter history for current conditions and positive responses
  const relevantHistory = history.filter(h => 
    h.mode === 'TONE' &&
    h.frequency === frequency &&
    h.testEar === testEar &&
    h.transducer === transducer &&
    h.response === true
  );

  // To draw the plateau line, we find the minimum tone level (threshold) for each masking level
  const maskingLevels = [...new Set(relevantHistory.map(h => h.maskingLevel))].sort((a, b) => a - b);
  const plateauPoints = maskingLevels.map(ml => {
    const tonesAtMl = relevantHistory.filter(h => h.maskingLevel === ml).map(h => h.toneLevel);
    const threshold = Math.min(...tonesAtMl);
    return { x: getX(ml), y: getY(threshold) };
  });

  const rawPoints = maskingLevels.map(ml => {
    const tonesAtMl = relevantHistory.filter(h => h.maskingLevel === ml).map(h => h.toneLevel);
    return { ml, th: Math.min(...tonesAtMl) };
  });

  let hasPlateau = false;
  const maskByTone = {};
  rawPoints.forEach(p => {
    if (!maskByTone[p.th]) maskByTone[p.th] = [];
    maskByTone[p.th].push(p.ml);
  });
  for (const th in maskByTone) {
    const masks = maskByTone[th];
    if (Math.max(...masks) - Math.min(...masks) >= 15) {
      hasPlateau = true;
    }
  }

  let showOvermaskingWarning = false;
  
  if (!hasPlateau && rawPoints.length >= 3 && patient && patient[testEar]) {
    const p1 = rawPoints[rawPoints.length - 3];
    const p2 = rawPoints[rawPoints.length - 2];
    const p3 = rawPoints[rawPoints.length - 1];

    const isLinear1 = (p2.th > p1.th) && (p2.ml > p1.ml) && ((p2.th - p1.th) / (p2.ml - p1.ml) >= 0.8);
    const isLinear2 = (p3.th > p2.th) && (p3.ml > p2.ml) && ((p3.th - p2.th) / (p3.ml - p2.ml) >= 0.8);

    if (isLinear1 && isLinear2) {
      const teBestBc = patient[testEar].bc[frequency] !== undefined ? patient[testEar].bc[frequency] : patient[testEar].ac[frequency];
      
      let ia = 0;
      if (transducer === 'HEADPHONES') {
        ia = patient.iaHeadphonesPureTones[frequency] || 40;
      } else if (transducer === 'INSERTS') {
        ia = patient.iaInsertsPureTones[frequency] || 55;
      } else if (transducer === 'BONE') {
        ia = patient.iaBone || 0;
      }

      const overmaskingThreshold = teBestBc + ia;
      const currentMaskingLevel = rawPoints[rawPoints.length - 1].ml;

      if (currentMaskingLevel >= overmaskingThreshold) {
        showOvermaskingWarning = true;
      }
    }
  }

  const renderGrid = () => {
    const lines = [];
    // Y-axis grid lines (Tone Level)
    for (let db = MIN_DB; db <= MAX_DB; db += 10) {
      const y = getY(db);
      lines.push(
        <line key={`y-${db}`} x1={MARGIN.left} y1={y} x2={WIDTH-MARGIN.right} y2={y} stroke="#e5e7eb" strokeWidth={db===0 ? 2 : 1} />
      );
    }
    // X-axis grid lines (Masking Level)
    for (let db = MIN_DB; db <= MAX_DB; db += 10) {
      const x = getX(db);
      lines.push(
        <line key={`x-${db}`} x1={x} y1={MARGIN.top} x2={x} y2={HEIGHT-MARGIN.bottom} stroke="#e5e7eb" strokeWidth={db===0 ? 2 : 1} />
      );
    }
    return lines;
  };

  const renderYLabels = () => {
    const labels = [];
    for (let db = MIN_DB; db <= MAX_DB; db += 20) {
      labels.push(
        <text key={`l-${db}`} x={MARGIN.left - 10} y={getY(db) + 4} fontSize="12" fill="#6b7280" textAnchor="end">
          {db}
        </text>
      );
    }
    return labels;
  };

  const renderXLabels = () => {
    const labels = [];
    for (let db = MIN_DB; db <= MAX_DB; db += 20) {
      labels.push(
        <text key={`xl-${db}`} x={getX(db)} y={HEIGHT - MARGIN.bottom + 20} fontSize="12" fill="#6b7280" textAnchor="middle">
          {db}
        </text>
      );
    }
    return labels;
  };

  const renderLines = () => {
    if (plateauPoints.length < 2) return null;
    const pathStr = plateauPoints.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
    return (
      <path 
        d={pathStr} 
        stroke="black" 
        strokeWidth={2} 
        fill="none" 
      />
    );
  };

  const renderPoints = () => {
    return relevantHistory.map((h, i) => {
      const x = getX(h.maskingLevel);
      const y = getY(h.toneLevel);
      return (
        <circle key={i} cx={x} cy={y} r={5} fill={h.testEar === 'right' ? 'red' : 'blue'} stroke="white" strokeWidth={1} />
      );
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-secondary shadow-sm w-full flex flex-col items-center mt-8">
      <div className="text-center mb-4">
        <h3 className="font-bold text-lg m-0">Masking Profile Graph</h3>
        <p className="text-sm text-muted-foreground">
          {frequency} Hz {transducer === 'BONE' ? 'BC' : 'AC'} ({testEar.charAt(0).toUpperCase() + testEar.slice(1)} Ear)
        </p>
      </div>
      
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-lg font-sans">
        {renderGrid()}
        {renderYLabels()}
        {renderXLabels()}
        
        <text x="15" y={HEIGHT/2} transform={`rotate(-90 15 ${HEIGHT/2})`} fontSize="14" fill="#374151" textAnchor="middle" fontWeight="bold">
          Tone Level (dB HL)
        </text>
        <text x={WIDTH/2} y={HEIGHT - 10} fontSize="14" fill="#374151" textAnchor="middle" fontWeight="bold">
          Masker Level (dB EM)
        </text>

        {renderLines()}
        {renderPoints()}
      </svg>
      
      {relevantHistory.length === 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          No positive responses recorded yet for this condition.
        </p>
      )}

      {showOvermaskingWarning && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm max-w-lg text-center">
          <strong>Warning:</strong> The masking profile is linear and a plateau is unlikely because overmasking has been reached. A plateau is not possible with the current masking levels.
          {transducer === 'BONE' && (
            <span className="block mt-2 font-semibold">
              Since you are performing Bone Conduction masking, consider removing the occlusion effect correction factor from your initial masking level and trying again.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
