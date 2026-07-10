import React, { useState, useEffect } from 'react';
import { FREQUENCIES, evaluateMaskingNeeds } from '../utils/maskingSimulator';

export default function MaskingQuiz({ patient, transducer, unmaskedAudiogram, onQuizPassed }) {
  const [needsMaskingOverall, setNeedsMaskingOverall] = useState({ ac: null, bc: null });
  const [selectedMasking, setSelectedMasking] = useState({
    ac: { right: {}, left: {} },
    bc: { right: {}, left: {} }
  });
  const [feedback, setFeedback] = useState(null);

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

  const renderSelectionCheckboxes = (type) => (
    <div className="pt-4 border-t border-secondary animate-in fade-in slide-in-from-top-2 space-y-3">
      <p className="text-sm font-semibold mb-2">Select the specific ears and frequencies where the Test Ear (TE) needs {type.toUpperCase()} masking:</p>
      
      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
        <h4 className="font-bold text-red-600 mb-2 text-sm">Right Ear</h4>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map(f => {
            if (type === 'bc' && f === 8000) return null;
            return (
              <label key={f} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm text-xs font-semibold cursor-pointer border hover:border-red-400 transition-colors">
                <input 
                  type="checkbox" 
                  className="accent-red-500"
                  checked={!!selectedMasking[type].right[f]}
                  onChange={() => toggleSelection(type, 'right', f)}
                />
                {f}
              </label>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
        <h4 className="font-bold text-blue-600 mb-2 text-sm">Left Ear</h4>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map(f => {
            if (type === 'bc' && f === 8000) return null;
            return (
              <label key={f} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm text-xs font-semibold cursor-pointer border hover:border-blue-400 transition-colors">
                <input 
                  type="checkbox" 
                  className="accent-blue-500"
                  checked={!!selectedMasking[type].left[f]}
                  onChange={() => toggleSelection(type, 'left', f)}
                />
                {f}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg m-0 text-blue-600">Clinical Decision: Pure-Tone Audiometry Quiz</h3>
        <span className="text-sm font-semibold text-blue-600 bg-blue-500/20 px-3 py-1 rounded-full">
          Pre-test
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">
          Review the initial unmasked audiogram above. Make sure to evaluate both Air Conduction and Bone Conduction.
        </p>
        <div className="mt-3 p-3 bg-blue-500/10 rounded-lg inline-block border border-blue-500/20">
          <p className="text-sm font-semibold text-blue-800 m-0">
            Current Transducer: <span className="font-bold">{transducer === 'INSERTS' ? 'Insert Earphones' : 'Headphones'}</span><br/>
            Minimum IA: <span className="font-bold">{transducer === 'INSERTS' ? '55 dB' : '40 dB'}</span>
          </p>
        </div>
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
          {needsMaskingOverall.ac === true && renderSelectionCheckboxes('ac')}
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
          {needsMaskingOverall.bc === true && renderSelectionCheckboxes('bc')}
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
