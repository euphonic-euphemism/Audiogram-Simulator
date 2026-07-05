import React, { useState } from 'react';
import { FREQUENCIES } from '../utils/maskingSimulator';

export default function StudentAudiogram({ thresholds }) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="bg-card text-card-foreground rounded-xl border border-green-500/30 shadow-sm overflow-hidden">
      <div 
        className="p-6 cursor-pointer hover:bg-green-500/5 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="font-bold text-lg m-0 text-green-600">Saved Masked Thresholds</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use the "Save Masked Threshold" button while presenting tones to record your masked results here. (M = Masked)
          </p>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 space-y-4">
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

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
          <h4 className="font-bold text-red-500 text-sm mb-1">Right SRT</h4>
          <p className="font-semibold text-sm mb-2">{thresholds.right.srt ? `${thresholds.right.srt.level} dB HL (${thresholds.right.srt.isMasked ? 'Masked' : 'Unmasked'})` : '-'}</p>
          <h4 className="font-bold text-red-500 text-sm mb-1 border-t border-red-500/20 pt-2">Right WRS</h4>
          <p className="font-semibold text-sm">{thresholds.right.wrs ? `${thresholds.right.wrs.score}% @ ${thresholds.right.wrs.presentationLevel} dB HL (${thresholds.right.wrs.maskingLevel !== null ? `${thresholds.right.wrs.maskingLevel} dB EM Masking` : 'Unmasked'})` : '-'}</p>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
          <h4 className="font-bold text-blue-500 text-sm mb-1">Left SRT</h4>
          <p className="font-semibold text-sm mb-2">{thresholds.left.srt ? `${thresholds.left.srt.level} dB HL (${thresholds.left.srt.isMasked ? 'Masked' : 'Unmasked'})` : '-'}</p>
          <h4 className="font-bold text-blue-500 text-sm mb-1 border-t border-blue-500/20 pt-2">Left WRS</h4>
          <p className="font-semibold text-sm">{thresholds.left.wrs ? `${thresholds.left.wrs.score}% @ ${thresholds.left.wrs.presentationLevel} dB HL (${thresholds.left.wrs.maskingLevel !== null ? `${thresholds.left.wrs.maskingLevel} dB EM Masking` : 'Unmasked'})` : '-'}</p>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
