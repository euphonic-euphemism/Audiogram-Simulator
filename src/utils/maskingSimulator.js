export const TRANSDUCERS = {
  HEADPHONES: { name: 'Headphones', defaultIA: 'Var' },
  INSERTS: { name: 'Insert Earphones', defaultIA: 55 },
  BONE: { name: 'Bone Oscillator', defaultIA: 0 } // IA is 0 for bone conduction
};

export const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];
export const TEST_MODES = {
  TONE: 'Pure Tone (PTA)',
  SRT: 'Speech Recognition Threshold (SRT)',
  WRS: 'Word Recognition Score (WRS)'
};

// Helper for 5 dB steps
const rand5 = (min, max) => Math.floor(Math.random() * ((max - min) / 5 + 1)) * 5 + min;

function generateEarConfiguration() {
  const shapeRand = Math.random();
  let shape;
  if (shapeRand < 0.4) shape = 'FLAT';
  else if (shapeRand < 0.8) shape = 'SLOPING';
  else if (shapeRand < 0.9) shape = 'RISING';
  else shape = 'TROUGH';
  
  const ac = {};
  const baseLine = rand5(0, 60); 
  
  if (shape === 'FLAT') {
    FREQUENCIES.forEach(f => {
      ac[f] = Math.max(0, Math.min(90, baseLine + rand5(-5, 5)));
    });
  } else if (shape === 'SLOPING') {
    let current = baseLine;
    FREQUENCIES.forEach(f => {
      ac[f] = Math.max(0, Math.min(90, current));
      current += rand5(0, 15);
    });
  } else if (shape === 'RISING') {
    let current = rand5(40, 80);
    FREQUENCIES.forEach(f => {
      ac[f] = Math.max(0, Math.min(90, current));
      current -= rand5(0, 15);
    });
  } else if (shape === 'TROUGH') {
    ac[250] = rand5(0, 20);
    ac[500] = ac[250] + rand5(5, 15);
    ac[1000] = ac[500] + rand5(10, 20);
    ac[2000] = ac[1000] + rand5(0, 10);
    ac[4000] = Math.max(0, ac[2000] - rand5(10, 20));
    ac[8000] = Math.max(0, ac[4000] - rand5(10, 20));
    FREQUENCIES.forEach(f => { ac[f] = Math.min(90, ac[f]); });
  }

  // Generate ABG profile
  const abgRand = Math.random();
  let abgProfile = abgRand < 0.6 ? 'SNHL' : (abgRand < 0.9 ? 'CONDUCTIVE' : 'MIXED');

  const bc = {};
  FREQUENCIES.forEach(f => {
    if (f === 8000) return; // BC is not tested at 8000 Hz
    let gap = 0;
    if (abgProfile === 'CONDUCTIVE') gap = rand5(15, 45);
    else if (abgProfile === 'MIXED') gap = rand5(10, 30);
    else gap = rand5(0, 5); 

    bc[f] = Math.max(0, ac[f] - gap);
  });

  return { ac, bc };
}

/**
 * Generates a fully randomized virtual patient.
 */
export function generateRandomPatient() {
  const tHeadphones = Math.random(); // interpolation factor for headphones IA trend
  const minIAHeadphones = { 250: 45, 500: 45, 1000: 30, 2000: 40, 4000: 40, 8000: 40 };
  const maxIAHeadphones = { 250: 80, 500: 80, 1000: 85, 2000: 80, 4000: 90, 8000: 90 };

  const tInserts = Math.random(); // interpolation factor for inserts IA trend
  const minIAInserts = { 250: 64, 500: 50, 1000: 56, 2000: 54, 4000: 64, 8000: 54 };
  const maxIAInserts = { 250: 95, 500: 94, 1000: 92, 2000: 72, 4000: 88, 8000: 80 };

  const hpSpeech = Math.floor(Math.random() * (60 - 45 + 1)) + 45;
  const inSpeech = Math.floor(Math.random() * (75 - 60 + 1)) + 60;

  const patient = {
    iaHeadphonesPureTones: {},
    iaHeadphonesSpeech: hpSpeech,
    iaInsertsPureTones: {},
    iaInsertsSpeech: Math.max(hpSpeech + 10, inSpeech),
    iaBone: 0,
    right: { ac: {}, bc: {} },
    left: { ac: {}, bc: {} }
  };

  FREQUENCIES.forEach(freq => {
    const interpolatedHP = minIAHeadphones[freq] + tHeadphones * (maxIAHeadphones[freq] - minIAHeadphones[freq]);
    const hpVal = Math.round(interpolatedHP / 5) * 5;
    patient.iaHeadphonesPureTones[freq] = hpVal;

    const interpolatedInserts = minIAInserts[freq] + tInserts * (maxIAInserts[freq] - minIAInserts[freq]);
    let inVal = Math.round(interpolatedInserts / 5) * 5;
    
    // Ensure Inserts IA is clinically higher than Headphones IA for the same patient
    patient.iaInsertsPureTones[freq] = Math.max(hpVal + 10, inVal);
  });

  const rightConfig = generateEarConfiguration();
  let leftConfig;
  
  if (Math.random() < 0.7) {
    // 70% Symmetrical
    leftConfig = { ac: {}, bc: {} };
    FREQUENCIES.forEach(f => {
      leftConfig.ac[f] = Math.max(0, Math.min(90, rightConfig.ac[f] + rand5(-10, 10)));
      if (f !== 8000) {
        leftConfig.bc[f] = Math.max(0, Math.min(90, rightConfig.bc[f] + rand5(-10, 10)));
        leftConfig.bc[f] = Math.min(leftConfig.ac[f], leftConfig.bc[f]);
      }
    });
  } else {
    // 30% Asymmetrical
    leftConfig = generateEarConfiguration();
  }

  patient.right.ac = rightConfig.ac;
  patient.right.bc = rightConfig.bc;
  patient.left.ac = leftConfig.ac;
  patient.left.bc = leftConfig.bc;

  // Calculate PTA (Pure Tone Average at 500, 1000, 2000)
  const rightPTA = (patient.right.ac[500] + patient.right.ac[1000] + patient.right.ac[2000]) / 3;
  const leftPTA = (patient.left.ac[500] + patient.left.ac[1000] + patient.left.ac[2000]) / 3;

  // SRT is typically within +/- 5 dB of PTA
  // We round it to nearest 5
  patient.right.srt = Math.round(rightPTA / 5) * 5 + (Math.random() > 0.5 ? 5 : -5);
  patient.left.srt = Math.round(leftPTA / 5) * 5 + (Math.random() > 0.5 ? 5 : -5);
  
  // Keep SRT >= 0
  patient.right.srt = Math.max(0, patient.right.srt);
  patient.left.srt = Math.max(0, patient.left.srt);

  // Max WRS Score (percentage). Randomly assign a true max score (e.g. 60 - 100%)
  patient.right.maxWrs = Math.floor(Math.random() * 9) * 5 + 60; // 60, 65... 100
  patient.left.maxWrs = Math.floor(Math.random() * 9) * 5 + 60;

  return patient;
}

/**
 * Calculates the unmasked thresholds (what the clinician would measure before masking)
 * which may include shadow curves due to crossover.
 */
export function calculateUnmaskedAudiogram(patient, transducer = 'HEADPHONES') {
  const unmasked = {
    right: { ac: {}, bc: {}, srt: null, wrsLevel: null },
    left: { ac: {}, bc: {}, srt: null, wrsLevel: null }
  };

  FREQUENCIES.forEach(freq => {
    let ia;
    if (transducer === 'HEADPHONES') {
      ia = patient.iaHeadphonesPureTones[freq];
    } else if (transducer === 'INSERTS') {
      ia = patient.iaInsertsPureTones[freq];
    } else {
      ia = 0;
    }

    // Unmasked Right AC: Patient responds at True Right AC, or when crossover reaches Left BC
    const leftBcCross = patient.left.bc[freq] !== undefined ? patient.left.bc[freq] : patient.left.ac[freq];
    unmasked.right.ac[freq] = Math.min(patient.right.ac[freq], leftBcCross + ia);
    
    // Unmasked Left AC
    const rightBcCross = patient.right.bc[freq] !== undefined ? patient.right.bc[freq] : patient.right.ac[freq];
    unmasked.left.ac[freq] = Math.min(patient.left.ac[freq], rightBcCross + ia);

    // Unmasked BC is just the best cochlea, but realistically there can be a 5 dB difference
    // depending on mastoid placement/calibration. We simulate this by randomly adding 5 dB to one side.
    if (freq !== 8000) {
      const bestBc = Math.min(patient.right.bc[freq], patient.left.bc[freq]);
      let rightBcMeasured = bestBc;
      let leftBcMeasured = bestBc;
      
      // ~40% chance to have a 5 dB difference
      if (Math.random() > 0.6) {
        if (Math.random() > 0.5) {
          rightBcMeasured += 5;
        } else {
          leftBcMeasured += 5;
        }
      }
      
      unmasked.right.bc[freq] = rightBcMeasured;
      unmasked.left.bc[freq] = leftBcMeasured;
    }
  });

  const iaSpeech = transducer === 'HEADPHONES' ? patient.iaHeadphonesSpeech : (transducer === 'INSERTS' ? patient.iaInsertsSpeech : 0);
  unmasked.right.srt = Math.min(patient.right.srt, patient.left.srt + iaSpeech);
  unmasked.left.srt = Math.min(patient.left.srt, patient.right.srt + iaSpeech);

  unmasked.right.wrsLevel = getWrsPresentationLevel(unmasked, 'right');
  unmasked.left.wrsLevel = getWrsPresentationLevel(unmasked, 'left');

  return unmasked;
}

/**
 * Dynamically calculates the WRS presentation level based on 2000 Hz threshold and type of loss.
 * Works with both true patient data and unmasked data objects.
 */
export function getWrsPresentationLevel(data, ear) {
  const srt = data[ear].srt;
  const ac2000 = data[ear].ac[2000];
  const bc2000 = data[ear].bc[2000] !== undefined ? data[ear].bc[2000] : ac2000;
  
  // Normal or Conductive logic
  const isNormal = ac2000 <= 25;
  const isConductive = bc2000 <= 25 && ac2000 > 25;
  
  let level;
  if (isNormal || isConductive) {
    level = srt + 40;
  } else {
    // Sensorineural or Mixed (BC > 25)
    if (ac2000 <= 50) level = ac2000 + 25;
    else if (ac2000 === 55) level = ac2000 + 20;
    else if (ac2000 >= 60 && ac2000 <= 65) level = ac2000 + 15;
    else if (ac2000 >= 70 && ac2000 <= 75) level = ac2000 + 10;
    else if (ac2000 >= 80) level = ac2000 + 5;
    else level = srt + 40; // Fallback
  }
  
  return Math.min(105, level);
}

/**
 * Gets the applicable Interaural Attenuation for the given transducer, patient, mode, and frequency.
 */
export function getIA(transducer, patient, mode, freq = 1000) {
  if (transducer === 'HEADPHONES') {
    if (mode === 'TONE') return patient.iaHeadphonesPureTones[freq];
    return patient.iaHeadphonesSpeech;
  }
  if (transducer === 'INSERTS') {
    if (mode === 'TONE') return patient.iaInsertsPureTones[freq];
    return patient.iaInsertsSpeech;
  }
  return 0; // BONE
}

/**
 * Calculates whether the patient responds to a pure tone or SRT stimulus.
 *
 * @param {Object} params
 * @param {number} params.teTrueThreshold True threshold of Test Ear for the current mode/freq (dB HL)
 * @param {number} params.nteBestBc NTE best bone conduction (cross-hearing always goes to the cochlea, which is BC)
 * @param {number} params.tePresentationLevel Current presentation level in TE (dB HL)
 * @param {number} params.nteMaskingLevel Current masking level in NTE (dB EM)
 * @param {number} params.ia Interaural Attenuation for the selected transducer (dB)
 * @returns {boolean} True if patient responds
 */
export function checkThresholdResponse({
  teTrueThreshold,
  nteBestBc,
  tePresentationLevel,
  nteMaskingLevel,
  toneIA,
  maskerIA,
  teBestBc
}) {
  // Crossover of masker to TE cochlea
  const crossoverMaskerToTE = nteMaskingLevel - maskerIA;
  
  // The threshold of the TE is shifted if the crossover masker exceeds its BC threshold
  const thresholdShift = Math.max(0, crossoverMaskerToTE - teBestBc);
  const maskedTeThreshold = teTrueThreshold + thresholdShift;

  // Can they hear it in the Test Ear?
  const hearsInTE = tePresentationLevel >= maskedTeThreshold;

  // Crossover reaches the NTE cochlea
  const crossoverLevel = tePresentationLevel - toneIA;
  
  // Can they hear it in the Non-Test Ear?
  // They hear it if crossover >= their NTE BC threshold AND crossover > masking noise
  const hearsInNTE = crossoverLevel >= nteBestBc && crossoverLevel > nteMaskingLevel;

  return hearsInTE || hearsInNTE;
}

/**
 * Calculates the WRS score based on presentation level and masking.
 * WRS is a suprathreshold test. The score improves as level increases above SRT, up to maxWrs.
 */
export function checkWrsResponse({
  teSrt,
  teMaxWrs,
  nteSrt, // For speech crossover, we often compare to NTE best BC or NTE SRT depending on the exact clinical rules, let's use NTE SRT for speech crossover detection threshold for simplicity, or NTE best BC for pure sensory response.
  nteBestBc,
  tePresentationLevel,
  nteMaskingLevel,
  toneIA,
  maskerIA,
  teBestBc
}) {
  // A sigmoidal (logistic) model for WRS based on presentation level above SRT
  const calculateScore = (presentationLevel, srt, maxWrs) => {
    const sensationLevel = presentationLevel - srt;
    if (sensationLevel <= 0) return 0;
    
    // Performance-Intensity (PI-PB) curve parameters
    const k = 0.15; // Steepness
    const x0 = 15;  // Midpoint (50% of maxWrs) in dB SL
    
    const score = maxWrs / (1 + Math.exp(-k * (sensationLevel - x0)));
    return Math.round(score);
  };

  // Crossover of masker to TE cochlea
  const crossoverMaskerToTE = nteMaskingLevel - maskerIA;
  const thresholdShift = Math.max(0, crossoverMaskerToTE - teBestBc);
  const maskedTeSrt = teSrt + thresholdShift;

  // TE score calculation
  const teScore = calculateScore(tePresentationLevel, maskedTeSrt, teMaxWrs);

  // NTE speech threshold is approximated as NTE SRT
  // Non-Test Ear Contribution (Crossover)
  // Masking reduces the effective crossover level
  const crossoverLevel = tePresentationLevel - toneIA;
  // If masking is present, the effective signal reaching the NTE is reduced.
  // We approximate the masked crossover level as crossoverLevel - effective masking.
  // Effective masking roughly shifts the NTE threshold by the masking amount (if masking > threshold).
  let maskedCrossoverLevel = crossoverLevel;
  if (nteMaskingLevel > nteBestBc) {
    maskedCrossoverLevel -= (nteMaskingLevel - nteBestBc);
  }

  // NTE speech threshold is approximated as NTE SRT
  const nteScore = calculateScore(maskedCrossoverLevel, nteSrt, 100); // NTE could theoretically score 100%

  // The patient reports whichever ear gave them the better clarity
  const finalScore = Math.max(teScore, nteScore);
  
  // Cap at 100%
  return Math.min(100, finalScore);
}

/**
 * Checks if a plateau has been reached based on history.
 */
export function checkPlateau(history) {
  const byTone = history.reduce((acc, point) => {
    // Only positive threshold responses contribute to a plateau
    if (point.response === true) {
      if (!acc[point.toneLevel]) acc[point.toneLevel] = [];
      acc[point.toneLevel].push(point.maskingLevel);
    }
    return acc;
  }, {});

  for (const toneLevel in byTone) {
    const masks = byTone[toneLevel].sort((a, b) => a - b);
    if (masks.length >= 2) {
      const diff = masks[masks.length - 1] - masks[0];
      if (diff >= 15) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Evaluates whether masking is needed based on the unmasked audiogram and standard clinical rules.
 * Rule: Mask if TE(AC) - NTE(AC) >= IA threshold OR TE(AC) - NTE(BC) >= IA threshold.
 * IA threshold: Headphones = 40, Inserts = 55.
 */
export function evaluateMaskingNeeds(unmasked, transducer) {
  const needsMasking = {
    ac: {
      right: {},
      left: {}
    },
    bc: {
      right: {},
      left: {}
    }
  };

  const iaThreshold = transducer === 'HEADPHONES' ? 40 : 55;

  FREQUENCIES.forEach(freq => {
    // AC Masking Evaluation
    // Check if Right Ear needs masking
    const rightAc = unmasked.right.ac[freq];
    const leftAc = unmasked.left.ac[freq];
    const leftBc = unmasked.left.bc[freq] !== undefined ? unmasked.left.bc[freq] : leftAc;
    needsMasking.ac.right[freq] = (rightAc - leftAc >= iaThreshold) || (rightAc - leftBc >= iaThreshold);

    // Check if Left Ear needs masking
    const leftAcVal = unmasked.left.ac[freq];
    const rightAcVal = unmasked.right.ac[freq];
    const rightBcVal = unmasked.right.bc[freq] !== undefined ? unmasked.right.bc[freq] : rightAcVal;
    needsMasking.ac.left[freq] = (leftAcVal - rightAcVal >= iaThreshold) || (leftAcVal - rightBcVal >= iaThreshold);

    // BC Masking Evaluation
    // Rule: ABG > 10 dB (i.e. >= 15 dB) in the Test Ear
    // Use the unmasked BC of the specific ear being tested to calculate the ABG
    if (freq !== 8000) {
      const rightUnmaskedBc = unmasked.right.bc[freq] !== undefined ? unmasked.right.bc[freq] : Infinity;
      const leftUnmaskedBc = unmasked.left.bc[freq] !== undefined ? unmasked.left.bc[freq] : Infinity;

      if (rightUnmaskedBc !== Infinity) {
        needsMasking.bc.right[freq] = (rightAc - rightUnmaskedBc >= 15);
      } else {
        needsMasking.bc.right[freq] = false;
      }

      if (leftUnmaskedBc !== Infinity) {
        needsMasking.bc.left[freq] = (leftAcVal - leftUnmaskedBc >= 15);
      } else {
        needsMasking.bc.left[freq] = false;
      }
    }
  });

  return needsMasking;
}

/**
 * Evaluates whether masking is needed for Speech Audiometry (SRT and WRS).
 * Rules:
 * SRT: Mask if TE(SRT) - NTE(Best BC) >= IA OR TE(SRT) - NTE(SRT) >= IA
 * WRS: Mask if TE(Presentation Level) - NTE(Best BC) >= IA OR TE(Presentation Level) - NTE(SRT) >= IA
 */
export function evaluateSpeechMaskingNeeds(patient, transducer = 'HEADPHONES', unmasked) {
  const iaThreshold = transducer === 'HEADPHONES' ? 40 : (transducer === 'INSERTS' ? 55 : 0);
  
  const needsMasking = {
    srt: { right: false, left: false },
    wrs: { right: false, left: false }
  };

  if (!unmasked) {
    unmasked = calculateUnmaskedAudiogram(patient, transducer);
  }

  // Find best unmasked BC in speech frequencies (250 - 4000) for the given ear
  const getBestUnmaskedBc = (ear) => {
    let best = 120;
    [250, 500, 1000, 2000, 4000].forEach(f => {
      if (unmasked[ear].bc[f] !== undefined && unmasked[ear].bc[f] < best) {
        best = unmasked[ear].bc[f];
      }
    });
    // Fallback to unmasked SRT or AC if BC is somehow missing entirely, though rare
    return best < 120 ? best : unmasked[ear].srt;
  };
  
  const rightBestBc = getBestUnmaskedBc('right');
  const leftBestBc = getBestUnmaskedBc('left');

  // SRT Masking: Compare against both NTE Unmasked SRT and NTE Unmasked Best BC
  needsMasking.srt.right = (unmasked.right.srt - leftBestBc) >= iaThreshold || (unmasked.right.srt - unmasked.left.srt) >= iaThreshold;
  needsMasking.srt.left = (unmasked.left.srt - rightBestBc) >= iaThreshold || (unmasked.left.srt - unmasked.right.srt) >= iaThreshold;

  // WRS Masking
  // WRS is evaluated against the NTE Unmasked Best BC and NTE Unmasked SRT
  const rightWrsLevel = unmasked.right.wrsLevel;
  const leftWrsLevel = unmasked.left.wrsLevel;

  needsMasking.wrs.right = (rightWrsLevel - leftBestBc) >= iaThreshold || (rightWrsLevel - unmasked.left.srt) >= iaThreshold;
  needsMasking.wrs.left = (leftWrsLevel - rightBestBc) >= iaThreshold || (leftWrsLevel - unmasked.right.srt) >= iaThreshold;

  return needsMasking;
}
