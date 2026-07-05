import React, { useState, useEffect } from 'react';
import { FREQUENCIES, evaluateMaskingNeeds, calculateUnmaskedAudiogram } from '../utils/maskingSimulator';

export default function MaskingQuiz({ patient, transducer, onQuizPassed }) {
  const [needsMaskingOverall, setNeedsMaskingOverall] = useState({ ac: null, bc: null });
  const [selectedMasking, setSelectedMasking] = useState({
    ac: { right: {}, left: {} },
    bc: { right: {}, left: {} }
  });
  const [feedback, setFeedback] = useState(null);

  const unmaskedAudiogram = calculateUnmaskedAudiogram(patient, transducer);
  const trueMaskingNeeds = evaluateMaskingNeeds(unmaskedAudiogram, transducer);
  
  const hasAnyMaskingNeedAc = Object.values(trueMaskingNeeds.ac.right).some(v => v) || 
                              Object.values(trueMaskingNeeds.ac.left).some(v => v);
  const hasAnyMaskingNeedBc = Object.values(trueMaskingNeeds.bc.right).some(v => v) || 
                              Object.values(trueMaskingNeeds.bc.left).some(v => v);

  // Reset quiz when patient or transducer changes
  useEffect(() => {
    setNeedsMaskingOverall({ ac: null, bc: null });
    setSelectedMasking({
      ac: { right: {}, left: {} },
      bc: { right: {}, left: {} }
    });
    setFeedback(null);
  }, [patient, transducer]);

  const toggleSelection = (type, ear, freq) => {
    setSelectedMasking(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [ear]: {
          ...prev[type][ear],
          [freq]: !prev[type][ear][freq]
        }
      }
    }));
  };

  const setOverall = (type, val) => {
    setNeedsMaskingOverall(prev => ({ ...prev, [type]: val }));
  };

  const handleSubmit = () => {
    let isPerfect = true;
    const errors = [];

    // Evaluate AC
    if (needsMaskingOverall.ac === false && hasAnyMaskingNeedAc) {
      isPerfect = false;
      errors.push("[AC] Actually, AC masking IS required based on the clinical rules.");
    } else if (needsMaskingOverall.ac === true && !hasAnyMaskingNeedAc) {
      isPerfect = false;
      errors.push("[AC] Actually, NO AC masking is required based on the clinical rules.");
    }
    if (needsMaskingOverall.ac === true) {
      FREQUENCIES.forEach(freq => {
        ['right', 'left'].forEach(ear => {
          const expected = !!trueMaskingNeeds.ac[ear][freq];
          const selected = !!selectedMasking.ac[ear][freq];
          if (expected !== selected) {
            isPerfect = false;
            if (expected) errors.push(`[AC] Missed: ${ear === 'right' ? 'Right' : 'Left'} Ear at ${freq} Hz requires masking.`);
            else errors.push(`[AC] False Positive: ${ear === 'right' ? 'Right' : 'Left'} Ear at ${freq} Hz does NOT require masking.`);
          }
        });
      });
    }

    // Evaluate BC
    if (needsMaskingOverall.bc === false && hasAnyMaskingNeedBc) {
      isPerfect = false;
      errors.push("[BC] Actually, BC masking IS required (Air-Bone Gap > 10 dB).");
    } else if (needsMaskingOverall.bc === true && !hasAnyMaskingNeedBc) {
      isPerfect = false;
      errors.push("[BC] Actually, NO BC masking is required based on the clinical rules.");
    }
    if (needsMaskingOverall.bc === true) {
      FREQUENCIES.forEach(freq => {
        ['right', 'left'].forEach(ear => {
          const expected = !!trueMaskingNeeds.bc[ear][freq];
          const selected = !!selectedMasking.bc[ear][freq];
          if (expected !== selected) {
            isPerfect = false;
            if (expected) errors.push(`[BC] Missed: ${ear === 'right' ? 'Right' : 'Left'} Ear at ${freq} Hz requires masking.`);
            else errors.push(`[BC] False Positive: ${ear === 'right' ? 'Right' : 'Left'} Ear at ${freq} Hz does NOT require masking.`);
          }
        });
      });
    }

    if (isPerfect) {
      setFeedback({ success: true, message: "Perfect! Your masking plan is clinically correct." });
      if (onQuizPassed) onQuizPassed();
    } else {
      setFeedback({ success: false, message: "Incorrect. See details below:", errors });
    }
  };

  const renderSelectionTable = (type) => (
    <div className="pt-4 border-t border-secondary animate-in fade-in slide-in-from-top-2">
      <p className="text-sm font-semibold mb-3">Select the specific ears and frequencies where the Test Ear (TE) needs {type.toUpperCase()} masking:</p>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-2 py-2 text-left rounded-tl-lg">Test Ear</th>
              {FREQUENCIES.map(f => <th key={f} className="px-2 py-2">{f}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-secondary/50">
              <td className="px-2 py-3 text-left font-bold text-red-500">Right</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="px-2 py-3">
                  {type === 'bc' && f === 8000 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-red-500 cursor-pointer"
                      checked={!!selectedMasking[type].right[f]}
                      onChange={() => toggleSelection(type, 'right', f)}
                    />
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-3 text-left font-bold text-blue-500">Left</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="px-2 py-3">
                  {type === 'bc' && f === 8000 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-blue-500 cursor-pointer"
                      checked={!!selectedMasking[type].left[f]}
                      onChange={() => toggleSelection(type, 'left', f)}
                    />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-blue-500/30 shadow-sm space-y-6">
      <div>
        <h3 className="font-bold text-lg m-0 text-blue-600">Clinical Decision: Masking Quiz</h3>
        <p className="text-sm text-muted-foreground">
          Review the initial unmasked audiogram above. Make sure to evaluate both Air Conduction and Bone Conduction.
        </p>
      </div>

      <div className="space-y-4">
        {/* AC Quiz */}
        <div className="space-y-4">
          <p className="font-semibold text-sm">1. Using the {transducer} rules, do you need to mask for <span className="text-primary font-bold">Air Conduction</span>?</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setOverall('ac', true)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.ac === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              Yes, AC masking is required
            </button>
            <button 
              onClick={() => setOverall('ac', false)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.ac === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              No, AC masking is not required
            </button>
          </div>
          {needsMaskingOverall.ac === true && renderSelectionTable('ac')}
        </div>

        {/* BC Quiz */}
        <div className="space-y-4 pt-4 border-t">
          <p className="font-semibold text-sm">2. Do you need to mask for <span className="text-primary font-bold">Bone Conduction</span> (ABG {'>'} 10 dB)?</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setOverall('bc', true)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.bc === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              Yes, BC masking is required
            </button>
            <button 
              onClick={() => setOverall('bc', false)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.bc === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              No, BC masking is not required
            </button>
          </div>
          {needsMaskingOverall.bc === true && renderSelectionTable('bc')}
        </div>
      </div>

      {/* Submit button */}
      {needsMaskingOverall.ac !== null && needsMaskingOverall.bc !== null && (
        <button 
          onClick={handleSubmit}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm mt-4"
        >
          Submit Answers
        </button>
      )}

      {/* Feedback Display */}
      {feedback && (
        <div className={`p-4 rounded-lg border mt-4 ${feedback.success ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'}`}>
          <p className="font-bold">{feedback.message}</p>
          {!feedback.success && feedback.errors && (
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              {feedback.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
