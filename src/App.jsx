import React, { useState, useEffect, useMemo } from 'react';
import AudiometerControl from './components/AudiometerControl';
import PatientResponse from './components/PatientResponse';
import MaskingWorksheet from './components/MaskingWorksheet';
import PatientAudiogram from './components/PatientAudiogram';
import UnmaskedAudiogram from './components/UnmaskedAudiogram';
import MaskingQuiz from './components/MaskingQuiz';
import SpeechMaskingQuiz from './components/SpeechMaskingQuiz';
import StudentAudiogram from './components/StudentAudiogram';
import AudiogramGraph from './components/AudiogramGraph';
import MaskingProfileGraph from './components/MaskingProfileGraph';
import MaskingAnswerKey from './components/MaskingAnswerKey';
import { 
  generateRandomPatient, 
  getIA, 
  checkThresholdResponse, 
  checkWrsResponse,
  calculateUnmaskedAudiogram
} from './utils/maskingSimulator';

function App() {
  // Simulator State
  const [testMode, setTestMode] = useState('TONE');
  const [transducer, setTransducer] = useState('HEADPHONES');
  const [testEar, setTestEar] = useState('right');
  const [frequency, setFrequency] = useState(1000);
  
  // Current Audiometer Settings
  const [toneLevel, setToneLevel] = useState(0);
  const [maskingLevel, setMaskingLevel] = useState(0);
  const [baseAcTransducer, setBaseAcTransducer] = useState('HEADPHONES');
  
  useEffect(() => {
    if (transducer !== 'BONE') {
      setBaseAcTransducer(transducer);
    }
  }, [transducer]);
  
  // Interaction State
  const [isPresenting, setIsPresenting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseValue, setResponseValue] = useState(null); // Used for WRS score
  const [history, setHistory] = useState([]);
  const [toneQuizPassed, setToneQuizPassed] = useState(false);
  const [speechQuizPassed, setSpeechQuizPassed] = useState(false);
  const [lockedTransducer, setLockedTransducer] = useState(null);

  // Student saved thresholds
  const emptyStudentThresholds = () => ({
    right: { ac: {}, bc: {}, srt: null },
    left: { ac: {}, bc: {}, srt: null }
  });
  const [studentThresholds, setStudentThresholds] = useState(emptyStudentThresholds());

  // Virtual Patient
  const [patient, setPatient] = useState(() => generateRandomPatient());

  // Compute Unmasked Audiogram Once per patient/transducer change to prevent non-deterministic renders
  const effectiveAcTransducer = lockedTransducer || baseAcTransducer;
  const unmaskedAudiogram = useMemo(() => calculateUnmaskedAudiogram(patient, effectiveAcTransducer), [patient, effectiveAcTransducer]);

  const handleNewPatient = () => {
    setPatient(generateRandomPatient());
    setHistory([]);
    setStudentThresholds(emptyStudentThresholds());
    setHasResponded(false);
    setResponseValue(null);
    setToneQuizPassed(false);
    setSpeechQuizPassed(false);
    setLockedTransducer(null);
  };

  const handleQuizPassed = (quizType) => {
    if (!lockedTransducer) {
      setLockedTransducer(baseAcTransducer);
    }
    if (quizType === 'tone') setToneQuizPassed(true);
    if (quizType === 'speech') setSpeechQuizPassed(true);
  };

  const handleSaveThreshold = (isMasked = false) => {
    if (testMode === 'WRS') return;
    
    setStudentThresholds(prev => {
      const next = { ...prev };
      // Deep copy the ear we are changing
      const earKey = testEar;
      next[earKey] = { ...next[earKey] };
      
      if (testMode === 'TONE') {
        const typeKey = transducer === 'BONE' ? 'bc' : 'ac';
        next[earKey][typeKey] = { ...next[earKey][typeKey] };
        next[earKey][typeKey][frequency] = { level: toneLevel, isMasked };
      } else if (testMode === 'SRT') {
        next[earKey].srt = { level: toneLevel, isMasked };
      }
      return next;
    });
  };

  useEffect(() => {
    if (isPresenting) {
      const ia = getIA(transducer, patient, testMode, frequency);
      
      let responded = false;
      let score = null;

      if (testMode === 'TONE') {
        // Pure Tone Logic
        const isRight = testEar === 'right';
        const teTrueThreshold = transducer === 'BONE' ? 
          (isRight ? patient.right.bc[frequency] : patient.left.bc[frequency]) : 
          (isRight ? patient.right.ac[frequency] : patient.left.ac[frequency]);
        const teBestBc = isRight ? patient.right.bc[frequency] : patient.left.bc[frequency];
        // Cross hearing goes to the best bone conduction of the NTE
        const nteBestBc = isRight ? patient.left.bc[frequency] : patient.right.bc[frequency];
        
        const maskingIA = getIA(baseAcTransducer, patient, testMode, frequency);

        responded = checkThresholdResponse({
          teTrueThreshold,
          teBestBc,
          nteBestBc,
          tePresentationLevel: toneLevel,
          nteMaskingLevel: maskingLevel,
          ia,
          maskingIA
        });
      } else if (testMode === 'SRT') {
        // SRT Logic (similar to tone but using SRT values)
        const isRight = testEar === 'right';
        const teSrt = isRight ? patient.right.srt : patient.left.srt;
        // For crossover, we approximate by comparing to NTE SRT as the crossover threshold
        const nteSrt = isRight ? patient.left.srt : patient.right.srt;
        
        const maskingIA = getIA(baseAcTransducer, patient, testMode, frequency);
        
        responded = checkThresholdResponse({
          teTrueThreshold: teSrt,
          teBestBc: teSrt,
          nteBestBc: nteSrt, 
          tePresentationLevel: toneLevel,
          nteMaskingLevel: maskingLevel,
          ia,
          maskingIA
        });
      } else if (testMode === 'WRS') {
        // WRS Logic
        const isRight = testEar === 'right';
        const teSrt = isRight ? patient.right.srt : patient.left.srt;
        const teMaxWrs = isRight ? patient.right.maxWrs : patient.left.maxWrs;
        const nteSrt = isRight ? patient.left.srt : patient.right.srt;

        const maskingIA = getIA(baseAcTransducer, patient, testMode, frequency);

        score = checkWrsResponse({
          teSrt,
          teMaxWrs,
          nteSrt,
          nteBestBc: nteSrt, // Approximation for speech crossover
          tePresentationLevel: toneLevel,
          nteMaskingLevel: maskingLevel,
          ia,
          maskingIA
        });
        responded = true; // For WRS, patient always "responds" with a score
      }
      
      setHasResponded(responded);
      setResponseValue(score);
      
      setHistory(prev => {
        const last = prev[prev.length - 1];
        const val = testMode === 'WRS' ? score : responded;
        
        if (last && 
            last.mode === testMode &&
            last.frequency === frequency &&
            last.toneLevel === toneLevel && 
            last.maskingLevel === maskingLevel && 
            last.testEar === testEar &&
            last.transducer === transducer &&
            last.response === val) {
          return prev;
        }
        
        return [...prev, { 
          mode: testMode,
          frequency,
          toneLevel, 
          maskingLevel, 
          testEar,
          transducer,
          response: val
        }];
      });
    } else {
      setHasResponded(false);
      setResponseValue(null);
    }
  }, [isPresenting, toneLevel, maskingLevel, transducer, testEar, testMode, frequency, patient]);

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Clinical Masking Simulator
            </h1>
            <p className="text-muted-foreground">
              Practice PTA, SRT, and WRS testing with realistic crossover.
            </p>
          </div>
          <button 
            onClick={handleNewPatient}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Generate New Patient
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <AudiogramGraph 
              patient={patient} 
              transducer={transducer} 
              studentThresholds={studentThresholds}
              unmaskedAudiogram={unmaskedAudiogram} 
              quizCompleted={toneQuizPassed && speechQuizPassed}
              lockedTransducer={lockedTransducer}
            />

            <AudiometerControl 
              toneLevel={toneLevel}
              setToneLevel={setToneLevel}
              maskingLevel={maskingLevel}
              setMaskingLevel={setMaskingLevel}
              transducer={transducer}
              setTransducer={setTransducer}
              testMode={testMode}
              setTestMode={setTestMode}
              frequency={frequency}
              setFrequency={setFrequency}
              isPresenting={isPresenting}
              setIsPresenting={setIsPresenting}
              testEar={testEar}
              setTestEar={setTestEar}
              onSaveThreshold={handleSaveThreshold}
              showFormulas={toneQuizPassed && speechQuizPassed}
            />
            
            <PatientResponse 
              hasResponded={hasResponded} 
              responseValue={responseValue}
              testMode={testMode} 
            />

            <MaskingProfileGraph 
              history={history}
              frequency={frequency}
              testEar={testEar}
              transducer={transducer}
              testMode={testMode}
            />
          </div>

          <div className="space-y-8">
            <UnmaskedAudiogram patient={patient} transducer={transducer} unmaskedAudiogram={unmaskedAudiogram} />
            
            {!(toneQuizPassed && speechQuizPassed) ? (
              <>
                {!toneQuizPassed && (
                  <MaskingQuiz 
                    patient={patient} 
                    transducer={effectiveAcTransducer} 
                    unmaskedAudiogram={unmaskedAudiogram}
                    onQuizPassed={() => handleQuizPassed('tone')} 
                  />
                )}
                {!speechQuizPassed && (
                  <SpeechMaskingQuiz 
                    patient={patient} 
                    transducer={effectiveAcTransducer} 
                    unmaskedAudiogram={unmaskedAudiogram}
                    onQuizPassed={() => handleQuizPassed('speech')} 
                  />
                )}
              </>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 text-green-700 p-4 rounded-xl font-bold flex items-center gap-3">
                <span className="text-xl">✅</span>
                <span>Both clinical decision quizzes passed! Proceed with the masking worksheet.</span>
              </div>
            )}

            <StudentAudiogram thresholds={studentThresholds} />

            <MaskingWorksheet 
              history={history}
              onClear={clearHistory}
            />
            
            <PatientAudiogram patient={patient} />
            
            {(toneQuizPassed && speechQuizPassed) && (
              <MaskingAnswerKey 
                patient={patient} 
                transducer={effectiveAcTransducer} 
                unmaskedAudiogram={unmaskedAudiogram} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
