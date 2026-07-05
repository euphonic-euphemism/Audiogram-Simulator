import React from 'react';
import { FREQUENCIES, evaluateMaskingNeeds } from '../utils/maskingSimulator';

const MARGIN = { top: 60, right: 40, bottom: 40, left: 50 };
const WIDTH = 600;
const HEIGHT = 600;
const GRAPH_W = WIDTH - MARGIN.left - MARGIN.right;
const GRAPH_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const MIN_DB = -10;
const MAX_DB = 120;
const DB_RANGE = MAX_DB - MIN_DB;

// Helper to get X coordinate
const getX = (freq) => {
  const index = FREQUENCIES.indexOf(freq);
  return MARGIN.left + (index / (FREQUENCIES.length - 1)) * GRAPH_W;
};

// Helper to get Y coordinate
const getY = (db) => {
  if (db === undefined || db === null) return null;
  return MARGIN.top + ((db - MIN_DB) / DB_RANGE) * GRAPH_H;
};

// SVG components for symbols
const SymbolRightAcUnmasked = ({ cx, cy, opacity=1 }) => (
  <circle cx={cx} cy={cy} r={6} stroke="red" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolRightAcMasked = ({ cx, cy, opacity=1 }) => (
  <polygon points={`${cx},${cy-7} ${cx-7},${cy+5} ${cx+7},${cy+5}`} stroke="red" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolLeftAcUnmasked = ({ cx, cy, opacity=1 }) => (
  <g stroke="blue" strokeWidth={2} opacity={opacity}>
    <line x1={cx-5} y1={cy-5} x2={cx+5} y2={cy+5} />
    <line x1={cx+5} y1={cy-5} x2={cx-5} y2={cy+5} />
  </g>
);

const SymbolLeftAcMasked = ({ cx, cy, opacity=1 }) => (
  <rect x={cx-5} y={cy-5} width={10} height={10} stroke="blue" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolRightBcUnmasked = ({ cx, cy, opacity=1 }) => (
  <path d={`M${cx-3},${cy-6} L${cx-10},${cy} L${cx-3},${cy+6}`} stroke="red" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolRightBcMasked = ({ cx, cy, opacity=1 }) => (
  <path d={`M${cx-4},${cy-6} L${cx-10},${cy-6} L${cx-10},${cy+6} L${cx-4},${cy+6}`} stroke="red" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolLeftBcUnmasked = ({ cx, cy, opacity=1 }) => (
  <path d={`M${cx+3},${cy-6} L${cx+10},${cy} L${cx+3},${cy+6}`} stroke="blue" strokeWidth={2} fill="none" opacity={opacity} />
);

const SymbolLeftBcMasked = ({ cx, cy, opacity=1 }) => (
  <path d={`M${cx+4},${cy-6} L${cx+10},${cy-6} L${cx+10},${cy+6} L${cx+4},${cy+6}`} stroke="blue" strokeWidth={2} fill="none" opacity={opacity} />
);

export default function AudiogramGraph({ patient, transducer, studentThresholds, unmaskedAudiogram: unmasked, quizCompleted }) {

  const needsMasking = evaluateMaskingNeeds(unmasked, transducer);

  const getPta = (ear) => {
    const freqs = [500, 1000, 2000];
    let sum = 0;
    for (let f of freqs) {
      const studentVal = studentThresholds[ear].ac[f];
      if (studentVal !== undefined && studentVal !== null) {
        sum += typeof studentVal === 'object' ? studentVal.level : studentVal;
      } else {
        sum += unmasked[ear].ac[f];
      }
    }
    return Math.round(sum / 3);
  };

  const rightPta = getPta('right');
  const leftPta = getPta('left');

  // Generates array of points for connecting lines
  const getLinePoints = (ear, type, dataSource, isStudent=false) => {
    const points = [];
    FREQUENCIES.forEach(f => {
      let val;
      if (isStudent) {
        const data = dataSource[ear][type][f];
        val = typeof data === 'object' ? data.level : data;
      } else {
        val = dataSource[ear][type][f];
      }
      if (val !== undefined && val !== null) {
        points.push({ x: getX(f), y: getY(val) });
      }
    });
    return points;
  };

  const renderLines = (points, color, isDashed=false, opacity=1) => {
    if (points.length < 2) return null;
    const pathStr = points.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
    return (
      <path 
        d={pathStr} 
        stroke={color} 
        strokeWidth={2} 
        fill="none" 
        strokeDasharray={isDashed ? "4 4" : "none"} 
        opacity={opacity} 
      />
    );
  };

  const renderStudentSymbols = (ear, type) => {
    return FREQUENCIES.map(f => {
      const data = studentThresholds[ear][type][f];
      if (data === undefined || data === null) return null;
      
      const val = typeof data === 'object' ? data.level : data;
      const isMasked = typeof data === 'object' ? data.isMasked : false;
      const x = getX(f);
      const y = getY(val);

      if (ear === 'right' && type === 'ac' && !isMasked) return <SymbolRightAcUnmasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'right' && type === 'ac' && isMasked) return <SymbolRightAcMasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'left' && type === 'ac' && !isMasked) return <SymbolLeftAcUnmasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'left' && type === 'ac' && isMasked) return <SymbolLeftAcMasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      
      if (ear === 'right' && type === 'bc' && !isMasked) return <SymbolRightBcUnmasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'right' && type === 'bc' && isMasked) return <SymbolRightBcMasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'left' && type === 'bc' && !isMasked) return <SymbolLeftBcUnmasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      if (ear === 'left' && type === 'bc' && isMasked) return <SymbolLeftBcMasked key={`${ear}-${type}-${f}`} cx={x} cy={y} />;
      
      return null;
    });
  };

  const renderUnmaskedSymbols = (ear, type) => {
    return FREQUENCIES.map(f => {
      const val = unmasked[ear][type][f];
      if (val === undefined || val === null) return null;
      
      const x = getX(f);
      const y = getY(val);
      let opacity = 0.25;
      
      if (quizCompleted) {
        const studentData = studentThresholds[ear][type][f];
        const hasMaskedThreshold = studentData && typeof studentData === 'object' && studentData.isMasked;
        
        if (hasMaskedThreshold) {
          return null; // hide unmasked symbol
        }
        
        const needsIt = needsMasking[type][ear][f];
        if (!needsIt) {
          opacity = 1.0; // "darken" (make fully opaque) if it doesn't need masking
        }
      }

      if (ear === 'right' && type === 'ac') return <SymbolRightAcUnmasked key={`u-${ear}-${type}-${f}`} cx={x} cy={y} opacity={opacity} />;
      if (ear === 'left' && type === 'ac') return <SymbolLeftAcUnmasked key={`u-${ear}-${type}-${f}`} cx={x} cy={y} opacity={opacity} />;
      if (ear === 'right' && type === 'bc') return <SymbolRightBcUnmasked key={`u-${ear}-${type}-${f}`} cx={x} cy={y} opacity={opacity} />;
      if (ear === 'left' && type === 'bc') return <SymbolLeftBcUnmasked key={`u-${ear}-${type}-${f}`} cx={x} cy={y} opacity={opacity} />;
      
      return null;
    });
  };

  const rightAcStudentLines = getLinePoints('right', 'ac', studentThresholds, true);
  const leftAcStudentLines = getLinePoints('left', 'ac', studentThresholds, true);

  // Background Grid Lines
  const renderGrid = () => {
    const yLines = [];
    for (let db = MIN_DB; db <= MAX_DB; db += 10) {
      const y = getY(db);
      yLines.push(
        <line key={`y-${db}`} x1={MARGIN.left} y1={y} x2={WIDTH-MARGIN.right} y2={y} stroke="#e5e7eb" strokeWidth={db===0 ? 2 : 1} />
      );
    }
    const xLines = FREQUENCIES.map(f => {
      const x = getX(f);
      return <line key={`x-${f}`} x1={x} y1={MARGIN.top} x2={x} y2={HEIGHT-MARGIN.bottom} stroke="#e5e7eb" strokeWidth={1} />;
    });
    return [...yLines, ...xLines];
  };

  const renderYLabels = () => {
    const labels = [];
    for (let db = MIN_DB; db <= MAX_DB; db += 10) {
      labels.push(
        <text key={`l-${db}`} x={MARGIN.left - 10} y={getY(db) + 4} fontSize="12" fill="#6b7280" textAnchor="end">
          {db}
        </text>
      );
    }
    return labels;
  };

  const renderXLabels = () => {
    return FREQUENCIES.map(f => (
      <text key={`xl-${f}`} x={getX(f)} y={MARGIN.top - 15} fontSize="12" fill="#6b7280" textAnchor="middle">
        {f}
      </text>
    ));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-secondary shadow-sm w-full flex flex-col items-center">
      <h3 className="font-bold text-lg mb-2">Visual Audiogram</h3>
      
      <div className="flex justify-between w-full max-w-lg mb-2 px-4 text-sm">
        <div className="flex flex-col gap-1">
          <div className="text-red-600 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20 shadow-sm text-center">Right PTA: {rightPta} dB HL</div>
          <div className="text-red-600 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20 shadow-sm text-center">
            Right SRT: {studentThresholds.right.srt !== null ? `${studentThresholds.right.srt.level} dB HL${studentThresholds.right.srt.isMasked ? ' (M)' : ''}` : `${unmasked.right.srt} dB HL`}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-blue-600 font-bold bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20 shadow-sm text-center">Left PTA: {leftPta} dB HL</div>
          <div className="text-blue-600 font-bold bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20 shadow-sm text-center">
            Left SRT: {studentThresholds.left.srt !== null ? `${studentThresholds.left.srt.level} dB HL${studentThresholds.left.srt.isMasked ? ' (M)' : ''}` : `${unmasked.left.srt} dB HL`}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-lg font-sans">
        {/* Grid and Labels */}
        {renderGrid()}
        {renderYLabels()}
        {renderXLabels()}
        
        <text x="15" y={HEIGHT/2} transform={`rotate(-90 15 ${HEIGHT/2})`} fontSize="14" fill="#374151" textAnchor="middle" fontWeight="bold">
          Hearing Level (dB HL)
        </text>
        <text x={WIDTH/2} y="20" fontSize="14" fill="#374151" textAnchor="middle" fontWeight="bold">
          Frequency (Hz)
        </text>

        {/* Unmasked Background Reference */}
        {renderUnmaskedSymbols('right', 'ac')}
        {renderUnmaskedSymbols('left', 'ac')}
        {renderUnmaskedSymbols('right', 'bc')}
        {renderUnmaskedSymbols('left', 'bc')}

        {/* Student Connecting Lines */}
        {renderLines(rightAcStudentLines, 'red', false, 1)}
        {renderLines(leftAcStudentLines, 'blue', false, 1)}

        {/* Student Symbols */}
        {renderStudentSymbols('right', 'ac')}
        {renderStudentSymbols('left', 'ac')}
        {renderStudentSymbols('right', 'bc')}
        {renderStudentSymbols('left', 'bc')}
      </svg>
      
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">O</span> Right Unmasked AC</div>
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">△</span> Right Masked AC</div>
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">&lt;</span> Right Unmasked BC</div>
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">[</span> Right Masked BC</div>
        <div className="flex items-center gap-1"><span className="text-blue-500 font-bold">X</span> Left Unmasked AC</div>
        <div className="flex items-center gap-1"><span className="text-blue-500 font-bold">☐</span> Left Masked AC</div>
        <div className="flex items-center gap-1"><span className="text-blue-500 font-bold">&gt;</span> Left Unmasked BC</div>
        <div className="flex items-center gap-1"><span className="text-blue-500 font-bold">]</span> Left Masked BC</div>
      </div>
    </div>
  );
}
