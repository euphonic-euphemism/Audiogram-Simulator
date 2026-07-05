import React from 'react';
import { FREQUENCIES, calculateUnmaskedAudiogram } from '../utils/maskingSimulator';

export default function UnmaskedAudiogram({ patient, transducer }) {
  // We only recalculate if patient or transducer changes
  const unmasked = calculateUnmaskedAudiogram(patient, transducer);

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm space-y-4">
      <h3 className="font-bold text-lg m-0">Initial Unmasked Audiogram</h3>
      <p className="text-sm text-muted-foreground">
        These are the thresholds you would measure before applying any masking. 
        Analyze them to determine where masking is needed based on your transducer ({transducer}).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-2 py-2 text-left rounded-tl-lg">Freq (Hz)</th>
              {FREQUENCIES.map(f => <th key={f} className="px-2 py-2">{f}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-secondary/50">
              <td className="px-2 py-3 text-left font-bold text-red-500">Right AC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{unmasked.right.ac[f] !== undefined ? unmasked.right.ac[f] : '-'}</td>)}
            </tr>
            <tr className="border-b border-secondary/50">
              <td className="px-2 py-3 text-left font-bold text-red-500">Right BC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{unmasked.right.bc[f] !== undefined ? unmasked.right.bc[f] : '-'}</td>)}
            </tr>
            <tr className="border-b border-secondary/50">
              <td className="px-2 py-3 text-left font-bold text-blue-500">Left AC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{unmasked.left.ac[f] !== undefined ? unmasked.left.ac[f] : '-'}</td>)}
            </tr>
            <tr className="border-b border-secondary/50">
              <td className="px-2 py-3 text-left font-bold text-blue-500">Left BC (dB)</td>
              {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{unmasked.left.bc[f] !== undefined ? unmasked.left.bc[f] : '-'}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mt-2">
        <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-lg">
          <h4 className="font-bold text-red-500 mb-1">Right Ear Speech</h4>
          <p className="text-sm font-semibold">Unmasked SRT: {unmasked.right.srt} dB HL</p>
          <p className="text-xs text-white font-medium bg-red-500/80 rounded px-2 py-1 inline-block mt-2">Recommended WRS Level: {unmasked.right.wrsLevel} dB HL</p>
        </div>
        <div className="p-3 border border-blue-500/30 bg-blue-500/10 rounded-lg">
          <h4 className="font-bold text-blue-500 mb-1">Left Ear Speech</h4>
          <p className="text-sm font-semibold">Unmasked SRT: {unmasked.left.srt} dB HL</p>
          <p className="text-xs text-white font-medium bg-blue-500/80 rounded px-2 py-1 inline-block mt-2">Recommended WRS Level: {unmasked.left.wrsLevel} dB HL</p>
        </div>
      </div>
    </div>
  );
}
