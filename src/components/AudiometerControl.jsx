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
  showFormulas
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
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-muted-foreground">Transducer</label>
            <span className="text-[10px] font-medium text-muted-foreground/80">Min IA: Headphones 40dB, Inserts 55dB</span>
          </div>
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
              return (
                <option key={key} value={key}>
                  {TRANSDUCERS[key].name} (IA: {TRANSDUCERS[key].defaultIA === 0 ? '0' : 'Var'})
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
            <li><strong>NTE Largest ABG:</strong> The largest Air-Bone Gap in the non-test ear from the speech frequencies (500, 1000, and 2000 Hz).</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Tone/Speech Level */}
        <div className="flex flex-col items-center bg-secondary/30 p-4 rounded-lg">
          <span className="text-sm font-semibold text-muted-foreground mb-2">Test Ear Level (dB HL)</span>
          <div className="text-4xl font-bold mb-4 w-24 text-center">{toneLevel}</div>
          <div className="flex gap-2">
            <button onClick={() => handleToneChange(-5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">-5</button>
            <button onClick={() => handleToneChange(5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">+5</button>
          </div>
        </div>

        {/* Masking Level */}
        <div className="flex flex-col items-center bg-secondary/30 p-4 rounded-lg">
          <span className="text-sm font-semibold text-muted-foreground mb-2">Non-Test Ear Masking (dB EM)</span>
          <div className="text-4xl font-bold mb-4 w-24 text-center">{maskingLevel}</div>
          <div className="flex gap-2">
            <button onClick={() => handleMaskingChange(-5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">-5</button>
            <button onClick={() => handleMaskingChange(5)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">+5</button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onMouseDown={() => setIsPresenting(true)}
          onMouseUp={() => setIsPresenting(false)}
          onMouseLeave={() => setIsPresenting(false)}
          onTouchStart={() => setIsPresenting(true)}
          onTouchEnd={() => setIsPresenting(false)}
          className={`w-full py-4 text-xl font-bold rounded-lg transition-colors duration-150 ${isPresenting ? 'bg-primary text-primary-foreground scale-[0.98]' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
        >
          {testMode === 'WRS' ? 'Present Word List' : (testMode === 'SRT' ? 'Present Spondee' : 'Present Tone')}
        </button>
        
        {testMode === 'TONE' && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              className="w-full py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
              onClick={() => onSaveThreshold(true, 'OK')}
            >
              Save Masked Threshold
            </button>
            <div className="flex gap-2">
              <button 
                className="flex-1 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 active:bg-slate-400 transition-colors"
                onClick={() => onSaveThreshold(true, 'NO_RESPONSE')}
              >
                Save No Response
              </button>
              <button 
                className="flex-1 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 active:bg-slate-400 transition-colors"
                onClick={() => onSaveThreshold(true, 'CNT')}
              >
                Save Could Not Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
