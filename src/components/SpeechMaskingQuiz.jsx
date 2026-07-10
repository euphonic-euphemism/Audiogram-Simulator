import React, { useState, useEffect } from 'react';
import { evaluateSpeechMaskingNeeds } from '../utils/maskingSimulator';

export default function SpeechMaskingQuiz({ patient, transducer, unmaskedAudiogram, onQuizPassed }) {
  const [needsMaskingOverall, setNeedsMaskingOverall] = useState({ srt: null, wrs: null });
  const [selectedMasking, setSelectedMasking] = useState({
    srt: { right: false, left: false },
    wrs: { right: false, left: false }
  });
  const [feedback, setFeedback] = useState(null);

  const trueMaskingNeeds = evaluateSpeechMaskingNeeds(patient, transducer, unmaskedAudiogram);
  
  const hasAnyMaskingNeedSrt = trueMaskingNeeds.srt.right || trueMaskingNeeds.srt.left;
  const hasAnyMaskingNeedWrs = trueMaskingNeeds.wrs.right || trueMaskingNeeds.wrs.left;

  // Reset quiz when patient or transducer changes
  useEffect(() => {
    setNeedsMaskingOverall({ srt: null, wrs: null });
    setSelectedMasking({
      srt: { right: false, left: false },
      wrs: { right: false, left: false }
    });
    setFeedback(null);
  }, [patient, transducer]);

  const toggleSelection = (type, ear) => {
    setSelectedMasking(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [ear]: !prev[type][ear]
      }
    }));
  };

  const setOverall = (type, val) => {
    setNeedsMaskingOverall(prev => ({ ...prev, [type]: val }));
  };

  const handleSubmit = () => {
    let isPerfect = true;
    const errors = [];

    // Evaluate SRT
    if (needsMaskingOverall.srt === false && hasAnyMaskingNeedSrt) {
      isPerfect = false;
      errors.push("[SRT] Actually, SRT masking IS required. TE(SRT) - NTE(Best BC) OR TE(SRT) - NTE(SRT) exceeds the IA threshold.");
    } else if (needsMaskingOverall.srt === true && !hasAnyMaskingNeedSrt) {
      isPerfect = false;
      errors.push("[SRT] Actually, NO SRT masking is required based on the clinical rules.");
    }
    if (needsMaskingOverall.srt === true) {
      ['right', 'left'].forEach(ear => {
        const expected = !!trueMaskingNeeds.srt[ear];
        const selected = !!selectedMasking.srt[ear];
        if (expected !== selected) {
          isPerfect = false;
          if (expected) errors.push(`[SRT] Missed: ${ear === 'right' ? 'Right' : 'Left'} Ear requires masking for SRT.`);
          else errors.push(`[SRT] False Positive: ${ear === 'right' ? 'Right' : 'Left'} Ear does NOT require masking for SRT.`);
        }
      });
    }

    // Evaluate WRS
    if (needsMaskingOverall.wrs === false && hasAnyMaskingNeedWrs) {
      isPerfect = false;
      errors.push("[WRS] Actually, WRS masking IS required at the recommended presentation level.");
    } else if (needsMaskingOverall.wrs === true && !hasAnyMaskingNeedWrs) {
      isPerfect = false;
      errors.push("[WRS] Actually, NO WRS masking is required based on the clinical rules.");
    }
    if (needsMaskingOverall.wrs === true) {
      ['right', 'left'].forEach(ear => {
        const expected = !!trueMaskingNeeds.wrs[ear];
        const selected = !!selectedMasking.wrs[ear];
        if (expected !== selected) {
          isPerfect = false;
          if (expected) errors.push(`[WRS] Missed: ${ear === 'right' ? 'Right' : 'Left'} Ear requires masking for WRS.`);
          else errors.push(`[WRS] False Positive: ${ear === 'right' ? 'Right' : 'Left'} Ear does NOT require masking for WRS.`);
        }
      });
    }

    if (isPerfect) {
      setFeedback({ success: true, message: "Perfect! Your speech masking plan is clinically correct." });
      if (onQuizPassed) onQuizPassed();
    } else {
      setFeedback({ success: false, message: "Incorrect. See details below:", errors });
    }
  };

  const renderSelection = (type) => (
    <div className="pt-4 border-t border-secondary animate-in fade-in slide-in-from-top-2 flex gap-4 justify-center">
      <label className="flex items-center gap-2 cursor-pointer font-bold text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
        <input 
          type="checkbox" 
          className="w-5 h-5 accent-red-500"
          checked={selectedMasking[type].right}
          onChange={() => toggleSelection(type, 'right')}
        />
        Right Ear (TE)
      </label>
      <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-500 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
        <input 
          type="checkbox" 
          className="w-5 h-5 accent-blue-500"
          checked={selectedMasking[type].left}
          onChange={() => toggleSelection(type, 'left')}
        />
        Left Ear (TE)
      </label>
    </div>
  );

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-orange-500/30 shadow-sm space-y-6 mt-8">
      <div>
        <h3 className="font-bold text-lg m-0 text-orange-600">Clinical Decision: Speech Masking Quiz</h3>
        <p className="text-sm text-muted-foreground">
          Review the initial unmasked SRTs above. Note: The rules for SRT masking use the Best Bone Conduction threshold in the non-test ear at 500, 1000, and 2000 Hz (or the NTE SRT). For WRS, the Best BC across all speech frequencies (250-4000 Hz) is used.
        </p>
        <div className="mt-3 p-3 bg-orange-500/10 rounded-lg inline-block border border-orange-500/20">
          <p className="text-sm font-semibold text-orange-800 m-0">
            Current Transducer: <span className="font-bold">{transducer === 'INSERTS' ? 'Insert Earphones' : 'Headphones'}</span><br/>
            Minimum IA: <span className="font-bold">{transducer === 'INSERTS' ? '55 dB' : '40 dB'}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* SRT Quiz */}
        <div className="space-y-4">
          <p className="font-semibold text-sm">1. Using the {transducer} rules, do you need to mask for <span className="text-primary font-bold">SRT</span>?</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setOverall('srt', true)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.srt === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              Yes, SRT masking is required
            </button>
            <button 
              onClick={() => setOverall('srt', false)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.srt === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              No, SRT masking is not required
            </button>
          </div>
          {needsMaskingOverall.srt === true && renderSelection('srt')}
        </div>

        {/* WRS Quiz */}
        <div className="space-y-4 pt-4 border-t">
          <p className="font-semibold text-sm">2. Assuming you present <span className="text-primary font-bold">Word Recognition (WRS)</span> at the Recommended WRS Level listed above, do you need to mask?</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setOverall('wrs', true)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.wrs === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              Yes, WRS masking is required
            </button>
            <button 
              onClick={() => setOverall('wrs', false)}
              className={`flex-1 py-2 px-4 rounded border transition-colors font-medium ${needsMaskingOverall.wrs === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              No, WRS masking is not required
            </button>
          </div>
          {needsMaskingOverall.wrs === true && renderSelection('wrs')}
        </div>
      </div>

      {/* Submit button */}
      {needsMaskingOverall.srt !== null && needsMaskingOverall.wrs !== null && (
        <button 
          onClick={handleSubmit}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm mt-4"
        >
          Submit Speech Answers
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
