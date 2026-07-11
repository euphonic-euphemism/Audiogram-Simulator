import React, { useState } from 'react';
import { FREQUENCIES, getWrsPresentationLevel, evaluateSpeechMaskingNeeds } from '../utils/maskingSimulator';

export default function PatientAudiogram({ patient, transducer, unmaskedAudiogram }) {
  const [show, setShow] = useState(false);

  const getLargestAbgSpeech = (ear) => {
    let maxAbg = 0;
    [500, 1000, 2000].forEach(f => {
      const ac = unmaskedAudiogram[ear].ac[f];
      const rightBc = unmaskedAudiogram.right.bc[f] !== undefined ? unmaskedAudiogram.right.bc[f] : Infinity;
      const leftBc = unmaskedAudiogram.left.bc[f] !== undefined ? unmaskedAudiogram.left.bc[f] : Infinity;
      let bestBc = Math.min(rightBc, leftBc);
      if (bestBc === Infinity) bestBc = ac;

      if (ac !== undefined) {
        maxAbg = Math.max(maxAbg, ac - bestBc);
      }
    });
    return maxAbg;
  };

  const ia = transducer === 'INSERTS' ? 55 : (transducer === 'HEADPHONES' ? 40 : 0);
  const needsMasking = evaluateSpeechMaskingNeeds(patient, transducer || 'HEADPHONES', unmaskedAudiogram);

  const getSrtIml = (ear) => {
    if (!needsMasking.srt[ear]) return 'Not Req';
    const nte = ear === 'right' ? 'left' : 'right';
    return (unmaskedAudiogram[ear].srt - ia + getLargestAbgSpeech(nte) + 5) + ' dB';
  };

  const getWrsIml = (ear) => {
    if (!needsMasking.wrs[ear]) return 'Not Req';
    const nte = ear === 'right' ? 'left' : 'right';
    const level = getWrsPresentationLevel(patient, ear);
    return (level - ia + getLargestAbgSpeech(nte) + 5) + ' dB';
  };

  return (
    <div className="bg-secondary/20 p-6 rounded-xl border border-secondary text-sm space-y-4">
      <div 
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setShow(!show)}
      >
        <h3 className="font-bold text-lg text-foreground m-0">True (Masked) Thresholds (Cheat Sheet)</h3>
        <span className="text-muted-foreground">{show ? '▲ Hide' : '▼ Show'}</span>
      </div>
      
      {show && (
        <div className="pt-4 space-y-4 border-t border-secondary">
          <div className="flex flex-col mb-2 gap-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Interaural Attenuation (IA) Summary:</span>
            <span>Inserts (Speech): {patient.iaInsertsSpeech} dB</span>
            <span>Headphones (Speech): {patient.iaHeadphonesSpeech} dB</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-secondary/50 text-muted-foreground uppercase">
                <tr>
                  <th className="px-2 py-2 text-left rounded-tl-lg">Freq (Hz)</th>
                  {FREQUENCIES.map(f => <th key={f} className="px-2 py-2">{f}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-secondary/50">
                  <td className="px-2 py-3 text-left font-bold text-red-500">Right AC (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{patient.right.ac[f] !== undefined ? patient.right.ac[f] : '-'}</td>)}
                </tr>
                <tr className="border-b border-secondary/50">
                  <td className="px-2 py-3 text-left font-bold text-red-500">Right BC (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{patient.right.bc[f] !== undefined ? patient.right.bc[f] : '-'}</td>)}
                </tr>
                <tr className="border-b border-secondary/50">
                  <td className="px-2 py-3 text-left font-bold text-blue-500">Left AC (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{patient.left.ac[f] !== undefined ? patient.left.ac[f] : '-'}</td>)}
                </tr>
                <tr className="border-b border-secondary/50">
                  <td className="px-2 py-3 text-left font-bold text-blue-500">Left BC (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-3">{patient.left.bc[f] !== undefined ? patient.left.bc[f] : '-'}</td>)}
                </tr>
                <tr className="border-b border-secondary/50 bg-secondary/10">
                  <td className="px-2 py-2 text-left font-bold">Headphones IA (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-2">{patient.iaHeadphonesPureTones[f]}</td>)}
                </tr>
                <tr className="border-b border-secondary/50 bg-secondary/10">
                  <td className="px-2 py-2 text-left font-bold">Inserts IA (dB)</td>
                  {FREQUENCIES.map(f => <td key={f} className="px-2 py-2">{patient.iaInsertsPureTones[f]}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center mt-4">
            <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-lg">
              <h4 className="font-bold text-red-500 mb-1">Right Ear Speech</h4>
              <p className="text-muted-foreground">SRT: {patient.right.srt} dB HL</p>
              <p className="text-red-700 font-semibold text-xs mb-2">Masking IML: {getSrtIml('right')}</p>
              <p className="text-muted-foreground">WRS Level: {getWrsPresentationLevel(patient, 'right')} dB HL</p>
              <p className="text-red-700 font-semibold text-xs mb-2">Masking IML: {getWrsIml('right')}</p>
              <p className="text-muted-foreground">Max WRS: {patient.right.maxWrs}%</p>
            </div>
            <div className="p-3 border border-blue-500/30 bg-blue-500/10 rounded-lg">
              <h4 className="font-bold text-blue-500 mb-1">Left Ear Speech</h4>
              <p className="text-muted-foreground">SRT: {patient.left.srt} dB HL</p>
              <p className="text-blue-700 font-semibold text-xs mb-2">Masking IML: {getSrtIml('left')}</p>
              <p className="text-muted-foreground">WRS Level: {getWrsPresentationLevel(patient, 'left')} dB HL</p>
              <p className="text-blue-700 font-semibold text-xs mb-2">Masking IML: {getWrsIml('left')}</p>
              <p className="text-muted-foreground">Max WRS: {patient.left.maxWrs}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
