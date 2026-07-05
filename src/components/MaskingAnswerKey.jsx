import React from 'react';
import { FREQUENCIES, evaluateMaskingNeeds, evaluateSpeechMaskingNeeds, getWrsPresentationLevel } from '../utils/maskingSimulator';

export default function MaskingAnswerKey({ patient, transducer, unmaskedAudiogram, studentThresholds, speechQuizPassed }) {
  const maskingNeeds = evaluateMaskingNeeds(unmaskedAudiogram, transducer);
  const speechMaskingNeeds = evaluateSpeechMaskingNeeds(patient, transducer, unmaskedAudiogram, studentThresholds);

  const anyMaskingNeeded = 
    [...FREQUENCIES].some(f => maskingNeeds.ac.right[f] || maskingNeeds.bc.right[f] || maskingNeeds.ac.left[f] || maskingNeeds.bc.left[f]) ||
    speechMaskingNeeds.srt.right || speechMaskingNeeds.srt.left || speechMaskingNeeds.wrs.right || speechMaskingNeeds.wrs.left;

  const ia = transducer === 'HEADPHONES' ? 40 : (transducer === 'INSERTS' ? 55 : 0);

  const getLargestABG = (ear) => {
    let max = 0;
    [500, 1000, 2000].forEach(f => {
      const ac = unmaskedAudiogram[ear].ac[f];
      
      let bc = unmaskedAudiogram[ear].bc[f];
      if (studentThresholds && studentThresholds[ear] && studentThresholds[ear].bc && studentThresholds[ear].bc[f] !== undefined) {
        const studentVal = studentThresholds[ear].bc[f];
        bc = typeof studentVal === 'object' ? studentVal.level : studentVal;
      }
      
      if (ac !== undefined && bc !== undefined) {
        const abg = ac - bc;
        if (abg > max) max = abg;
      }
    });
    return max;
  };

  // Initial Masking Level for speech relies on a formula: TE Presentation Level - IA + Largest NTE ABG
  // We provide the generic formula so the student has to work it out.

  return (
    <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-3">
      <h3 className="font-bold text-lg text-orange-600 m-0">Masking Required (Answer Key)</h3>
      <p className="text-sm text-muted-foreground">Since you've successfully passed the quizzes, here is the quick-reference answer key for what needs to be masked during your exam.</p>
      
      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground font-medium">
        {FREQUENCIES.map(f => {
          let reqs = [];
          if (maskingNeeds.ac.right[f]) {
            reqs.push(`Right AC (IML Formula: NTE AC + 10)`);
          }
          if (maskingNeeds.bc.right[f]) {
            reqs.push(`Right BC (IML Formula: NTE AC + OE + 10)`);
          }
          if (maskingNeeds.ac.left[f]) {
            reqs.push(`Left AC (IML Formula: NTE AC + 10)`);
          }
          if (maskingNeeds.bc.left[f]) {
            reqs.push(`Left BC (IML Formula: NTE AC + OE + 10)`);
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
        
        {speechQuizPassed && speechMaskingNeeds.srt.right && <li><strong>SRT IML:</strong> Right Ear (Formula: TE Presentation Level - IA + Largest NTE ABG)</li>}
        {speechQuizPassed && speechMaskingNeeds.srt.left && <li><strong>SRT IML:</strong> Left Ear (Formula: TE Presentation Level - IA + Largest NTE ABG)</li>}
        {speechQuizPassed && speechMaskingNeeds.wrs.right && <li><strong>WRS IML:</strong> Right Ear (Formula: TE Presentation Level - IA + Largest NTE ABG)</li>}
        {speechQuizPassed && speechMaskingNeeds.wrs.left && <li><strong>WRS IML:</strong> Left Ear (Formula: TE Presentation Level - IA + Largest NTE ABG)</li>}
        
        {!anyMaskingNeeded && (
          <li>No masking required for any test.</li>
        )}
      </ul>

      <div className="mt-6 border-t border-orange-500/20 pt-4">
        <h4 className="font-bold text-sm text-orange-600 mb-2">Occlusion Effect (OE) Table</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Note: If the Non-Test Ear has an Air-Bone Gap &ge; 15 dB, the Occlusion Effect is 0 dB because the middle ear pathology already occludes the pathway.
        </p>
        <div className="overflow-hidden rounded border border-orange-500/20">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-orange-500/10">
              <tr>
                <th className="px-3 py-2 font-bold text-orange-700">Transducer</th>
                <th className="px-3 py-2 font-bold text-orange-700">250 Hz</th>
                <th className="px-3 py-2 font-bold text-orange-700">500 Hz</th>
                <th className="px-3 py-2 font-bold text-orange-700">1000 Hz</th>
                <th className="px-3 py-2 font-bold text-orange-700">&ge;2000 Hz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-500/10 bg-white/50">
              <tr className={transducer === 'HEADPHONES' ? 'bg-orange-500/10 font-bold' : ''}>
                <td className="px-3 py-2">Headphones</td>
                <td className="px-3 py-2">20 dB</td>
                <td className="px-3 py-2">15 dB</td>
                <td className="px-3 py-2">5 dB</td>
                <td className="px-3 py-2">0 dB</td>
              </tr>
              <tr className={transducer === 'INSERTS' ? 'bg-orange-500/10 font-bold' : ''}>
                <td className="px-3 py-2">Inserts</td>
                <td className="px-3 py-2">10 dB</td>
                <td className="px-3 py-2">10 dB</td>
                <td className="px-3 py-2">0 dB</td>
                <td className="px-3 py-2">0 dB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
