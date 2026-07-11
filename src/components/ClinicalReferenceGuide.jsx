import React, { useState } from 'react';

export default function ClinicalReferenceGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm flex flex-col gap-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-bold">Clinical Reference Guide</h2>
        <span className="text-muted-foreground font-bold text-xl">
          {isOpen ? '−' : '+'}
        </span>
      </div>

      {isOpen && (
        <div className="space-y-6 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg border-b pb-1">Occlusion Effect (OE)</h3>
            <p className="text-sm text-muted-foreground">
              Added to the initial masking level during bone conduction testing.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-secondary-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2 rounded-tl-lg">Transducer</th>
                    <th className="px-3 py-2">250 Hz</th>
                    <th className="px-3 py-2">500 Hz</th>
                    <th className="px-3 py-2">1000 Hz</th>
                    <th className="px-3 py-2 rounded-tr-lg">2000+ Hz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2 font-medium">Headphones (TDH)</td>
                    <td className="px-3 py-2">15 dB</td>
                    <td className="px-3 py-2">15 dB</td>
                    <td className="px-3 py-2">10 dB</td>
                    <td className="px-3 py-2">0 dB</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Inserts</td>
                    <td className="px-3 py-2">10 dB</td>
                    <td className="px-3 py-2">10 dB</td>
                    <td className="px-3 py-2">0 dB</td>
                    <td className="px-3 py-2">0 dB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-1">Masking Formulae</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Air Conduction (AC)</h4>
              <ul className="text-sm space-y-1 bg-secondary/20 p-3 rounded-lg">
                <li><span className="font-medium">When to mask:</span> TE AC - NTE BC ≥ IA</li>
                <li><span className="font-medium">Initial Masking Level:</span> NTE AC + 10 dB</li>
                <li><span className="font-medium">Maximum Masking Level:</span> TE Masked BC + IA - 5 dB</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Bone Conduction (BC)</h4>
              <ul className="text-sm space-y-1 bg-secondary/20 p-3 rounded-lg">
                <li><span className="font-medium">When to mask:</span> TE ABG {'>'} 10 dB (or ≥ 15 dB)</li>
                <li><span className="font-medium">Initial Masking Level:</span> NTE AC + 10 dB + OE</li>
                <li><span className="font-medium">Maximum Masking Level:</span> TE Masked BC + IA - 5 dB</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Speech Testing (SRT / WRS)</h4>
              <ul className="text-sm space-y-1 bg-secondary/20 p-3 rounded-lg">
                <li><span className="font-medium">When to mask:</span> TE Level - NTE Best BC ≥ IA</li>
                <li><span className="font-medium">Initial Masking Level:</span> TE Level - IA + NTE Largest ABG (500-2000 Hz) + 5 dB safety factor</li>
                <li><span className="font-medium">Maximum Masking Level:</span> TE Masked BC + IA - 5 dB</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              <p><strong>Note:</strong> IA = Interaural Attenuation (Headphones: 40 dB, Inserts: 55 dB, Bone: 0 dB). The safety factor added to initial masking levels (10 dB for pure tones, 5 dB for speech) ensures effective masking without overmasking.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
