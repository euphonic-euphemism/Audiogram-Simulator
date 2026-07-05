import React from 'react';
import { FREQUENCIES } from '../utils/maskingSimulator';

export default function StudentAudiogram({ thresholds }) {
  // thresholds is an object matching the true patient structure:
  // { right: { ac: {}, bc: {} }, left: { ac: {}, bc: {} } }
  
  const renderCell = (ear, type, freq) => {
    const data = thresholds[ear]?.[type]?.[freq];
    if (data === undefined || data === null) return '-';
    // Support both old format (number) and new format {level, isMasked}
    const level = typeof data === 'object' ? data.level : data;
    const isMasked = typeof data === 'object' ? data.isMasked : false;
    return `${isMasked ? 'M' : 'U'}: ${level}`;
  };

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-green-500/30 shadow-sm space-y-4">
      <h3 className="font-bold text-lg m-0 text-green-600">Saved Masked Thresholds</h3>
      <p className="text-sm text-muted-foreground">
        Use the "Save Masked Threshold" button while presenting tones to record your masked results here. (M = Masked)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-green-500/10 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-2 py-2 text-left rounded-tl-lg">Freq (Hz)</th>
              {FREQUENCIES.map(f => <th key={f} className="px-2 py-2">{f}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-green-500/20">
              <td className="px-2 py-3 text-left font-bold text-red-500">Right AC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3 font-semibold">{renderCell('right', 'ac', f)}</td>)}
            </tr>
            <tr className="border-b border-green-500/20">
              <td className="px-2 py-3 text-left font-bold text-red-500">Right BC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3 font-semibold">{renderCell('right', 'bc', f)}</td>)}
            </tr>
            <tr className="border-b border-green-500/20">
              <td className="px-2 py-3 text-left font-bold text-blue-500">Left AC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3 font-semibold">{renderCell('left', 'ac', f)}</td>)}
            </tr>
            <tr className="border-b border-green-500/20">
              <td className="px-2 py-3 text-left font-bold text-blue-500">Left BC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3 font-semibold">{renderCell('left', 'bc', f)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
