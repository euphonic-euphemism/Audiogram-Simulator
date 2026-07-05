import React from 'react';
import { TRANSDUCERS, FREQUENCIES, TEST_MODES } from '../utils/maskingSimulator';

export default function AudiometerControl({
  toneLevel,
  setToneLevel,
  maskingLevel,
  setMaskingLevel,
  transducer,
  setTransducer,
  testMode,
  setTestMode,
  frequency,
  setFrequency,
  isPresenting,
  setIsPresenting,
  testEar,
  setTestEar,
  onSaveThreshold,
  showFormulas,
  lockedTransducer,
  saveFeedback
}) {
  const handleToneChange = (amount) => {
    setToneLevel((prev) => Math.min(120, Math.max(-10, prev + amount)));
  };

  const handleMaskingChange = (amount) => {
    setMaskingLevel((prev) => Math.min(120, Math.max(-10, prev + amount)));
  };

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col gap-6">
      <h2 className="text-xl font-bold border-b pb-2">Audiometer Controls</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 col-span-2 md:col-span-4">
          <label className="text-sm font-semibold text-muted-foreground">Test Mode</label>
          <div className="flex gap-2">
            {Object.entries(TEST_MODES).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setTestMode(key)}
                className={`flex-1 py-2 px-3 text-sm rounded border transition-colors ${testMode === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-input text-foreground border-input hover:bg-secondary/50'}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {testMode === 'TONE' && (
          <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
            <label className="text-sm font-semibold text-muted-foreground">Frequency (Hz)</label>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="bg-input border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f} disabled={transducer === 'BONE' && f === 8000}>
                  {f} Hz {transducer === 'BONE' && f === 8000 ? '(No BC)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
          <label className="text-sm font-semibold text-muted-foreground">Transducer</label>
          <select 
            value={transducer} 
            onChange={(e) => {
              const val = e.target.value;
              setTransducer(val);
              if (val === 'BONE' && frequency === 8000) {
                setFrequency(4000);
              }
            }}
            className="bg-input border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.keys(TRANSDUCERS).map((key) => {
              // Bone conduction usually isn't used for speech in standard basic simulators, 
              // but we allow it for TONE. Hide for speech if you want, or just leave it.
              const isLockedAc = lockedTransducer && key !== 'BONE' && key !== lockedTransducer;
              return (
                <option key={key} value={key} disabled={isLockedAc}>
                  {TRANSDUCERS[key].name} (IA: {TRANSDUCERS[key].defaultIA === 0 ? '0' : 'Var'}) {isLockedAc ? '(Locked)' : ''}
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
          <label className="text-sm font-semibold text-muted-foreground">Test Ear (TE)</label>
          <select 
            value={testEar} 
            onChange={(e) => setTestEar(e.target.value)}
            className="bg-input border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="right">Right (Red)</option>
            <option value="left">Left (Blue)</option>
          </select>
        </div>
      </div>

      {showFormulas && (testMode === 'SRT' || testMode === 'WRS') && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg mt-2 space-y-2">
          <h4 className="font-bold text-orange-600 text-sm">Speech Masking Formula (Initial Masking Level)</h4>
          <p className="text-sm font-semibold text-foreground">
            IML = TE Presentation Level - IA + NTE Largest ABG
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li><strong>TE Presentation Level:</strong> The dB HL of the speech being presented to the test ear (For SRT, this is your evaluated SRT value; for WRS, it's the fixed presentation level).</li>
            <li><strong>IA:</strong> Interaural Attenuation (40 dB for Headphones, 55 dB for Inserts).</li>
            <li><strong>NTE Largest ABG:</strong> The largest Air-Bone Gap in the non-test ear.</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Tone/Speech Level */}
        <div className="flex flex-col items-center justify-end bg-secondary/30 p-4 rounded-lg">
          <span className="text-sm font-semibold text-muted-foreground mb-2">Test Ear Level (dB HL)</span>
          <div className="text-4xl font-bold mb-4 w-24 text-center">{toneLevel}</div>
          <div className="flex gap-2">
            <button onClick={() => handleToneChange(-5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">-5</button>
            <button onClick={() => handleToneChange(5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">+5</button>
          </div>
        </div>

        {/* Masking Level and Save Button */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {saveFeedback && (
              <div className={`p-2 text-sm font-bold text-center rounded ${saveFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saveFeedback.message}
              </div>
            )}
            <button 
              className="w-full py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
              onClick={() => onSaveThreshold(true)}
            >
              {testMode === 'WRS' ? 'Save WRS Score & Masking Level' : (testMode === 'SRT' ? 'Save Masked SRT' : 'Save Masked Threshold')}
            </button>
          </div>
          
          <div className="flex flex-col items-center bg-secondary/30 p-4 rounded-lg flex-1">
            <span className="text-sm font-semibold text-muted-foreground mb-2">Non-Test Ear Masking (dB EM)</span>
            <div className="text-4xl font-bold mb-4 w-24 text-center">{maskingLevel}</div>
            <div className="flex gap-2">
              <button onClick={() => handleMaskingChange(-5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">-5</button>
              <button onClick={() => handleMaskingChange(5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">+5</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex mt-2">
        <button 
          onMouseDown={() => setIsPresenting(true)}
          onMouseUp={() => setIsPresenting(false)}
          onMouseLeave={() => setIsPresenting(false)}
          onTouchStart={() => setIsPresenting(true)}
          onTouchEnd={() => setIsPresenting(false)}
          className={`w-full py-6 text-2xl font-bold rounded-lg transition-colors duration-150 ${isPresenting ? 'bg-primary text-primary-foreground scale-[0.98]' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
        >
          {testMode === 'WRS' ? 'Present Word List' : (testMode === 'SRT' ? 'Present Spondee' : 'Present Tone')}
        </button>
      </div>
    </div>
  );
}
