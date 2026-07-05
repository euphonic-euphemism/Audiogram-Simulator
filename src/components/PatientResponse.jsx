import React from 'react';

export default function PatientResponse({ hasResponded, responseValue, testMode }) {
  // responseValue is boolean for TONE/SRT, and a number (percentage) for WRS

  if (testMode === 'WRS') {
    const showScore = responseValue !== null;
    return (
      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <h2 className="text-xl font-bold mb-6">Patient Response (WRS)</h2>
        
        <div 
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            showScore 
              ? 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)] scale-110 text-white' 
              : 'bg-secondary'
          }`}
        >
          <span className="text-4xl font-bold">
            {showScore ? `${responseValue}%` : '👂'}
          </span>
        </div>
        <div className="mt-6 text-lg font-medium text-muted-foreground">
          {showScore ? `Patient scored ${responseValue}% on the word list.` : 'Waiting for word list...'}
        </div>
      </div>
    );
  }

  // Pure Tone or SRT mode
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center min-h-[200px]">
      <h2 className="text-xl font-bold mb-6">Patient Response</h2>
      
      <div 
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          hasResponded 
            ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)] scale-110' 
            : 'bg-secondary'
        }`}
      >
        <span className="text-4xl font-bold">
          {hasResponded ? '✋' : '👂'}
        </span>
      </div>
      <div className="mt-6 text-lg font-medium text-muted-foreground">
        {hasResponded ? 'Patient responded!' : 'Waiting for stimulus...'}
      </div>
    </div>
  );
}
