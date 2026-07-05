import React from 'react';
import { FREQUENCIES, evaluateMaskingNeeds, evaluateSpeechMaskingNeeds, getWrsPresentationLevel } from '../utils/maskingSimulator';

export default function MaskingAnswerKey({ patient, transducer, unmaskedAudiogram }) {
  const maskingNeeds = evaluateMaskingNeeds(unmaskedAudiogram, transducer);
  const speechMaskingNeeds = evaluateSpeechMaskingNeeds(patient, transducer, unmaskedAudiogram);

  const anyMaskingNeeded = 
    [...FREQUENCIES].some(f => maskingNeeds.ac.right[f] || maskingNeeds.bc.right[f] || maskingNeeds.ac.left[f] || maskingNeeds.bc.left[f]) ||
    speechMaskingNeeds.srt.right || speechMaskingNeeds.srt.left || speechMaskingNeeds.wrs.right || speechMaskingNeeds.wrs.left;

  const ia = transducer === 'HEADPHONES' ? 40 : (transducer === 'INSERTS' ? 55 : 0);

  const getOE = (freq, nteEar) => {
    const ac = unmaskedAudiogram[nteEar].ac[freq];
    const bc = unmaskedAudiogram[nteEar].bc[freq] !== undefined ? unmaskedAudiogram[nteEar].bc[freq] : ac;
    if (ac === undefined || bc === undefined) return 0;
    
    // If NTE has a conductive component (ABG >= 15), Occlusion Effect is 0
    if (ac - bc >= 15) return 0;

    if (transducer === 'HEADPHONES') {
      if (freq === 250) return 20;
      if (freq === 500) return 15;
      if (freq === 1000) return 5;
    } else if (transducer === 'INSERTS') {
      if (freq === 250 || freq === 500) return 10;
      if (freq === 1000) return 0;
    }
    return 0;
  };

  const getLargestABG = (ear) => {
    let max = 0;
    [500, 1000, 2000].forEach(f => {
      const ac = unmaskedAudiogram[ear].ac[f];
      const bc = unmaskedAudiogram[ear].bc[f];
      if (ac !== undefined && bc !== undefined) {
        const abg = ac - bc;
        if (abg > max) max = abg;
      }
    });
    return max;
  };

  const rightABG = getLargestABG('right');
  const leftABG = getLargestABG('left');

  const imlSrtRight = unmaskedAudiogram.right.srt - ia + leftABG;
  const imlSrtLeft = unmaskedAudiogram.left.srt - ia + rightABG;

  const imlWrsRight = getWrsPresentationLevel(patient, 'right') - ia + leftABG;
  const imlWrsLeft = getWrsPresentationLevel(patient, 'left') - ia + rightABG;

  return (
    <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-3">
      <h3 className="font-bold text-lg text-orange-600 m-0">Masking Required (Answer Key)</h3>
      <p className="text-sm text-muted-foreground">Since you've successfully passed the quizzes, here is the quick-reference answer key for what needs to be masked during your exam.</p>
      
      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground font-medium">
        {FREQUENCIES.map(f => {
          let reqs = [];
          if (maskingNeeds.ac.right[f]) {
            const iml = unmaskedAudiogram.left.ac[f] + 10;
            reqs.push(`Right AC (IML: ${iml} dB EM)`);
          }
          if (maskingNeeds.bc.right[f]) {
            const iml = unmaskedAudiogram.left.ac[f] + getOE(f, 'left') + 10;
            reqs.push(`Right BC (IML: ${iml} dB EM)`);
          }
          if (maskingNeeds.ac.left[f]) {
            const iml = unmaskedAudiogram.right.ac[f] + 10;
            reqs.push(`Left AC (IML: ${iml} dB EM)`);
          }
          if (maskingNeeds.bc.left[f]) {
            const iml = unmaskedAudiogram.right.ac[f] + getOE(f, 'right') + 10;
            reqs.push(`Left BC (IML: ${iml} dB EM)`);
          }
          
          if (reqs.length > 0) {
            return (
              <li key={f} className="flex flex-col mb-1">
                <strong>{f} Hz:</strong> 
                <span className="pl-4">{reqs.join(', ')}</span>
              </li>
            );
          }
          return null;
        })}
        
        {speechMaskingNeeds.srt.right && <li><strong>SRT:</strong> Right Ear (Initial Masking Level: {Math.max(-10, imlSrtRight)} dB EM)</li>}
        {speechMaskingNeeds.srt.left && <li><strong>SRT:</strong> Left Ear (Initial Masking Level: {Math.max(-10, imlSrtLeft)} dB EM)</li>}
        {speechMaskingNeeds.wrs.right && <li><strong>WRS:</strong> Right Ear (Initial Masking Level: {Math.max(-10, imlWrsRight)} dB EM)</li>}
        {speechMaskingNeeds.wrs.left && <li><strong>WRS:</strong> Left Ear (Initial Masking Level: {Math.max(-10, imlWrsLeft)} dB EM)</li>}
        
        {!anyMaskingNeeded && (
          <li>No masking required for any test.</li>
        )}
      </ul>
    </div>
  );
}
