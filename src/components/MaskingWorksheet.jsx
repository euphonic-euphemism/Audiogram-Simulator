import React from 'react';
import { checkPlateau } from '../utils/maskingSimulator';

export default function MaskingWorksheet({ history, onClear }) {
  const isPlateauReaches = checkPlateau(history);

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-bold">Masking History</h2>
        <button 
          onClick={onClear}
          className="px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded text-sm font-medium transition-colors"
        >
          Clear History
        </button>
      </div>

      {isPlateauReaches && (
        <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-3 rounded-lg flex items-center justify-center font-bold">
          🎉 15 dB Plateau Reached! True Threshold Found.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Mode/Freq</th>
              <th className="px-4 py-3">Tone (dB HL)</th>
              <th className="px-4 py-3">Masking (dB EM)</th>
              <th className="px-4 py-3 rounded-tr-lg">Response</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">
                  No attempts recorded yet. Present a stimulus to start.
                </td>
              </tr>
            ) : (
              history.map((record, index) => {
                const earColor = record.testEar === 'right' ? 'text-red-600' : 'text-blue-600';
                return (
                  <tr key={index} className={`border-b border-secondary/50 last:border-0 hover:bg-secondary/20 ${earColor}`}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <span className="text-xs font-bold uppercase opacity-80">({record.testEar === 'right' ? 'R' : 'L'})</span>
                      <span>{record.mode} {record.mode === 'TONE' ? `${record.frequency}Hz` : ''}</span>
                    </td>
                  <td className="px-4 py-3">{record.toneLevel}</td>
                  <td className="px-4 py-3">{record.maskingLevel}</td>
                  <td className="px-4 py-3">
                    {typeof record.response === 'boolean' ? (
                      record.response ? (
                        <span className="inline-flex items-center gap-1 text-green-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          No
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-500 font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {record.response}%
                      </span>
                    )}
                  </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
