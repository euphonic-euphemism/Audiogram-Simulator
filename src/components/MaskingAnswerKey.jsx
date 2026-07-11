import React from 'react';
import { FREQUENCIES, evaluateMaskingNeeds, evaluateSpeechMaskingNeeds, getWrsPresentationLevel } from '../utils/maskingSimulator';

export default function MaskingAnswerKey({ patient, transducer, unmaskedAudiogram }) {
  const maskingNeeds = evaluateMaskingNeeds(unmaskedAudiogram, transducer);
  const speechMaskingNeeds = evaluateSpeechMaskingNeeds(patient, transducer, unmaskedAudiogram);

  const anyMaskingNeeded = 
    [...FREQUENCIES].some(f => maskingNeeds.ac.right[f] || maskingNeeds.bc.right[f] || maskingNeeds.ac.left[f] || maskingNeeds.bc.left[f]) ||
    speechMaskingNeeds.srt.right || speechMaskingNeeds.srt.left || speechMaskingNeeds.wrs.right || speechMaskingNeeds.wrs.left;

  const ia = transducer === 'HEADPHONES' ? 40 : (transducer === 'INSERTS' ? 55 : 0);

  const getLargestABG = (ear) => {
    let max = 0;
    [500, 1000, 2000].forEach(f => {
      const ac = unmaskedAudiogram[ear].ac[f];
      const rightBc = unmaskedAudiogram.right.bc[f] !== undefined ? unmaskedAudiogram.right.bc[f] : Infinity;
      const leftBc = unmaskedAudiogram.left.bc[f] !== undefined ? unmaskedAudiogram.left.bc[f] : Infinity;
      let bestBc = Math.min(rightBc, leftBc);
      
      // If no BC is measured, fallback to AC (meaning 0 ABG)
      if (bestBc === Infinity) bestBc = ac;

      if (ac !== undefined) {
        const abg = ac - bestBc;
        if (abg > max) max = abg;
      }
    });
    return max;
  };

  const rightABG = getLargestABG('right');
  const leftABG = getLargestABG('left');

  const imlSrtRight = unmaskedAudiogram.right.srt - ia + leftABG + 5;
  const imlSrtLeft = unmaskedAudiogram.left.srt - ia + rightABG + 5;

  const imlWrsRight = getWrsPresentationLevel(patient, 'right') - ia + leftABG + 5;
  const imlWrsLeft = getWrsPresentationLevel(patient, 'left') - ia + rightABG + 5;

  return (
    <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-3">
      <h3 className="font-bold text-lg text-orange-600 m-0">Masking Required (Answer Key)</h3>
      <p className="text-sm text-muted-foreground">Since you've successfully passed the quizzes, here is the quick-reference answer key for what needs to be masked during your exam.</p>
      
      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground font-medium">
        {FREQUENCIES.map(f => {
          let reqs = [];
          if (maskingNeeds.ac.right[f]) reqs.push(`Right AC (IML: ${unmaskedAudiogram.left.ac[f] + 10} dB EM)`);
          if (maskingNeeds.bc.right[f]) {
            let oe = 0;
            if (transducer === 'HEADPHONES') {
              oe = f <= 500 ? 15 : (f === 1000 ? 10 : 0);
            } else if (transducer === 'INSERTS') {
              oe = f <= 500 ? 10 : 0;
            }
            reqs.push(`Right BC (IML: ${unmaskedAudiogram.left.ac[f] + oe + 10} dB EM, includes ${oe}dB OE)`);
          }
          if (maskingNeeds.ac.left[f]) reqs.push(`Left AC (IML: ${unmaskedAudiogram.right.ac[f] + 10} dB EM)`);
          if (maskingNeeds.bc.left[f]) {
            let oe = 0;
            if (transducer === 'HEADPHONES') {
              oe = f <= 500 ? 15 : (f === 1000 ? 10 : 0);
            } else if (transducer === 'INSERTS') {
              oe = f <= 500 ? 10 : 0;
            }
            reqs.push(`Left BC (IML: ${unmaskedAudiogram.right.ac[f] + oe + 10} dB EM, includes ${oe}dB OE)`);
          }

          if (reqs.length > 0) {
            return <li key={f}><strong>{f} Hz:</strong> {reqs.join(' | ')}</li>;
          }
          return null;
        })}
        
        {speechMaskingNeeds.srt.right && <li><strong>SRT:</strong> Right Ear (Initial Masking Level: {Math.max(-10, imlSrtRight)} dB EM)</li>}
        {speechMaskingNeeds.srt.left && <li><strong>SRT:</strong> Left Ear (Initial Masking Level: {Math.max(-10, imlSrtLeft)} dB EM)</li>}
        {speechMaskingNeeds.wrs.right && <li><strong>WRS:</strong> Right Ear (Initial Masking Level: {Math.max(-10, unmaskedAudiogram.right.wrsLevel - ia + leftABG)} dB EM)</li>}
        {speechMaskingNeeds.wrs.left && <li><strong>WRS:</strong> Left Ear (Initial Masking Level: {Math.max(-10, unmaskedAudiogram.left.wrsLevel - ia + rightABG)} dB EM)</li>}
        
        {!anyMaskingNeeded && (
          <li>No masking required for any test.</li>
        )}
      </ul>
    </div>
  );
}
