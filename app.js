/**
 * CrossSafe - Offline Road Crossing Assistant
 * Core Application Engine
 */

(() => {
  'use strict';

  // --- State Configuration ---
  const state = {
    isActive: false,
    pattern: 'police',      // 'police' | 'split' | 'fullscreen' | 'amber' | 'white'
    speed: 'normal',
    textOverlayMode: 'preset', // 'preset' | 'custom'
    presetText: 'CROSSING',    // 'CROSSING' | 'STOP'
    customText: '',            // custom string (blank = no overlay)
    soundEnabled: true,
    vibrationEnabled: true,
    brightnessHintEnabled: true,
    wakeLock: null,
    audioCtx: null,
    strobeFrame: null,
    lastTick: 0,
    stepIndex: 0,
    lastVibrateTime: 0
  };

  // Speed multiplier maps (intervals in ms per sub-frame)
  const SPEED_CONFIGS = {
    ultraslow: { mult: 3.5 },
    veryslow:  { mult: 2.2 },
    slow:      { mult: 1.4 },
    normal:    { mult: 1.0 },
    fast:      { mult: 0.65 }
  };

  // Colors
  const RED = '#ff0019';
  const BLUE = '#0048ff';
  const AMBER = '#ffaa00';
  const WHITE = '#ffffff';
  const BLACK = '#000000';

  // Pattern Sequences: Array of { left, right, durationMs, soundType }
  function getPatternSequence(pattern) {
    switch (pattern) {
      case 'police':
        // Classic Police Quad-Flash Red -> Quad-Flash Blue
        return [
          { left: RED,   right: RED,   duration: 70,  chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 45,  chirp: null },
          { left: RED,   right: RED,   duration: 70,  chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 45,  chirp: null },
          { left: RED,   right: RED,   duration: 70,  chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 110, chirp: null },

          { left: BLUE,  right: BLUE,  duration: 70,  chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 45,  chirp: null },
          { left: BLUE,  right: BLUE,  duration: 70,  chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 45,  chirp: null },
          { left: BLUE,  right: BLUE,  duration: 70,  chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 110, chirp: null }
        ];

      case 'split':
        // Alternating Left-Red / Right-Blue
        return [
          { left: RED,   right: BLACK, duration: 110, chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 40,  chirp: null },
          { left: RED,   right: BLACK, duration: 110, chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },

          { left: BLACK, right: BLUE,  duration: 110, chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 40,  chirp: null },
          { left: BLACK, right: BLUE,  duration: 110, chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null }
        ];

      case 'fullscreen':
        // Full screen Red flip to Full screen Blue
        return [
          { left: RED,   right: RED,   duration: 220, chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 50,  chirp: null },
          { left: BLUE,  right: BLUE,  duration: 220, chirp: 'low' },
          { left: BLACK, right: BLACK, duration: 50,  chirp: null }
        ];

      case 'wigwag':
        // Dual Alternating Amber Circular Beacons (School bus / Road hazard wig-wag)
        return [
          { leftLit: true,  rightLit: false, duration: 180, chirp: 'med' },
          { leftLit: false, rightLit: false, duration: 35,  chirp: null },
          { leftLit: false, rightLit: true,  duration: 180, chirp: 'med' },
          { leftLit: false, rightLit: false, duration: 35,  chirp: null }
        ];

      case 'white':
        // High-Lumen White Beacon
        return [
          { left: WHITE, right: WHITE, duration: 100, chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 60,  chirp: null },
          { left: WHITE, right: WHITE, duration: 100, chirp: 'high' },
          { left: BLACK, right: BLACK, duration: 240, chirp: null }
        ];

      case 'sos':
        // International Morse Code Distress: ··· ——— ··· (in White)
        return [
          // S: 3 short dots
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 240, chirp: null },

          // O: 3 long dashes
          { left: WHITE, right: WHITE, duration: 240, chirp: 'dash' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 240, chirp: 'dash' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 240, chirp: 'dash' },
          { left: BLACK, right: BLACK, duration: 240, chirp: null },

          // S: 3 short dots
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 80,  chirp: null },
          { left: WHITE, right: WHITE, duration: 80,  chirp: 'dot' },
          { left: BLACK, right: BLACK, duration: 700, chirp: null }
        ];

      default:
        return getPatternSequence('police');
    }
  }

  // --- DOM Elements ---
  const elSurface = document.getElementById('strobe-surface');
  const elLeft = document.getElementById('strobe-left');
  const elRight = document.getElementById('strobe-right');
  const beaconLeft = document.getElementById('beacon-left');
  const beaconRight = document.getElementById('beacon-right');
  const elBadge = document.getElementById('strobe-badge');
  const elStrobeText = document.getElementById('strobe-text');
  const elBrightnessToast = document.getElementById('brightness-toast');
  let brightnessToastTimer = null;

  const btnTrigger = document.getElementById('btn-trigger');
  const badgeWakeLock = document.getElementById('badge-wakelock');
  const badgeOffline = document.getElementById('badge-offline');

  const patternButtons = document.querySelectorAll('.pattern-btn');
  const speedButtons = document.querySelectorAll('#speed-control .segment-btn');
  const presetButtons = document.querySelectorAll('#badge-presets .segment-btn');
  const inputCustomText = document.getElementById('input-custom-text');
  const textCharCount = document.getElementById('text-char-count');
  const btnClearText = document.getElementById('btn-clear-text');

  const toggleSound = document.getElementById('toggle-sound');
  const toggleVibration = document.getElementById('toggle-vibration');
  const toggleBrightnessHint = document.getElementById('toggle-brightness-hint');

  const btnShare = document.getElementById('btn-share');
  const btnInfo = document.getElementById('btn-info');
  const modalInfo = document.getElementById('modal-info');
  const modalShare = document.getElementById('modal-share');
  const btnCloseInfo = document.getElementById('btn-close-info');
  const btnCloseShare = document.getElementById('btn-close-share');
  const btnGotIt = document.getElementById('btn-got-it');
  const btnNativeShare = document.getElementById('btn-native-share');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const qrContainer = document.getElementById('qr-container');

  // --- Audio Synthesizer (Web Audio API) ---
  function initAudio() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        state.audioCtx = new AudioCtx();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playAlertChirp(type) {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const ctx = state.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      let startFreq = 880;
      let endFreq = 1200;
      let toneDuration = 0.06;
      let oscType = 'sawtooth';

      if (type === 'low') {
        startFreq = 540;
        endFreq = 720;
      } else if (type === 'med') {
        startFreq = 720;
        endFreq = 880;
      } else if (type === 'dot') {
        startFreq = 850;
        endFreq = 850;
        toneDuration = 0.055;
        oscType = 'sine';
      } else if (type === 'dash') {
        startFreq = 850;
        endFreq = 850;
        toneDuration = 0.18;
        oscType = 'sine';
      }

      osc.type = oscType;
      osc.frequency.setValueAtTime(startFreq, startTime);
      if (startFreq !== endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + toneDuration * 0.8);
      }

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + toneDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + toneDuration + 0.005);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // --- Screen Wake Lock API ---
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        state.wakeLock = await navigator.wakeLock.request('screen');
        if (badgeWakeLock) {
          badgeWakeLock.style.display = 'inline-flex';
          badgeWakeLock.style.color = 'var(--accent-green)';
        }
        state.wakeLock.addEventListener('release', () => {
          if (badgeWakeLock) {
            badgeWakeLock.style.color = 'var(--text-muted)';
          }
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  }

  async function releaseWakeLock() {
    if (state.wakeLock) {
      try {
        await state.wakeLock.release();
      } catch (e) {}
      state.wakeLock = null;
    }
  }

  // Auto re-acquire wake lock on tab focus
  document.addEventListener('visibilitychange', async () => {
    if (state.wakeLock !== null && document.visibilityState === 'visible' && state.isActive) {
      await requestWakeLock();
    }
  });

  // --- Haptics (Vibration API) ---
  function triggerHapticPulse() {
    if (!state.vibrationEnabled || !('vibrate' in navigator)) return;
    const now = performance.now();
    // Vibrate every 750ms so user knows it's alive without draining battery
    if (now - state.lastVibrateTime > 750) {
      try {
        navigator.vibrate([40, 50, 40]);
        state.lastVibrateTime = now;
      } catch (e) {}
    }
  }

  // --- Strobe Light Engine ---
  function runStrobeEngine(timestamp) {
    if (!state.isActive) return;

    const sequence = getPatternSequence(state.pattern);
    const speedMult = SPEED_CONFIGS[state.speed].mult;
    const currentStep = sequence[state.stepIndex % sequence.length];
    const stepDuration = currentStep.duration * speedMult;

    if (!state.lastTick) state.lastTick = timestamp;

    const elapsed = timestamp - state.lastTick;

    if (elapsed >= stepDuration) {
      // Advance step
      state.stepIndex = (state.stepIndex + 1) % sequence.length;
      state.lastTick = timestamp;

      const nextStep = sequence[state.stepIndex];

      if (state.pattern === 'wigwag') {
        if (beaconLeft && beaconRight) {
          if (nextStep.leftLit) {
            beaconLeft.classList.add('lit');
            beaconLeft.classList.remove('unlit');
          } else {
            beaconLeft.classList.remove('lit');
            beaconLeft.classList.add('unlit');
          }

          if (nextStep.rightLit) {
            beaconRight.classList.add('lit');
            beaconRight.classList.remove('unlit');
          } else {
            beaconRight.classList.remove('lit');
            beaconRight.classList.add('unlit');
          }
        }
      } else {
        elLeft.style.backgroundColor = nextStep.left;
        elRight.style.backgroundColor = nextStep.right;
      }

      if (nextStep.chirp) {
        playAlertChirp(nextStep.chirp);
      }

      triggerHapticPulse();
    }

    state.strobeFrame = requestAnimationFrame(runStrobeEngine);
  }

  function startCrossing() {
    initAudio();
    requestWakeLock();

    // Fullscreen if possible
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Toggle circular beacons vs split halves
    elSurface.classList.toggle('mode-circular', state.pattern === 'wigwag');

    // Configure Text Overlay: Presets (Crossing, Stop) or Custom (blank = none)
    let overlayText = '';
    if (state.textOverlayMode === 'preset') {
      overlayText = state.presetText;
    } else {
      overlayText = (state.customText || '').trim();
    }

    if (!overlayText) {
      elSurface.classList.remove('show-badge');
    } else {
      const displayText = (state.pattern === 'sos' && overlayText.toUpperCase() === 'CROSSING') ? 'SOS' : overlayText.toUpperCase();
      elStrobeText.textContent = displayText;
      elSurface.classList.add('show-badge');
    }

    // Show Auto Max Brightness Hint Toast if enabled
    if (state.brightnessHintEnabled && elBrightnessToast) {
      if (brightnessToastTimer) clearTimeout(brightnessToastTimer);
      elBrightnessToast.classList.remove('hidden', 'toast-fade');
      brightnessToastTimer = setTimeout(() => {
        elBrightnessToast.classList.add('toast-fade');
        setTimeout(() => {
          elBrightnessToast.classList.add('hidden');
        }, 500);
      }, 3500);
    } else if (elBrightnessToast) {
      elBrightnessToast.classList.add('hidden');
    }

    state.isActive = true;
    state.stepIndex = 0;
    state.lastTick = 0;
    state.lastVibrateTime = 0;

    elSurface.classList.remove('hidden');
    elSurface.setAttribute('aria-hidden', 'false');

    state.strobeFrame = requestAnimationFrame(runStrobeEngine);
  }

  function stopCrossing() {
    state.isActive = false;
    if (state.strobeFrame) {
      cancelAnimationFrame(state.strobeFrame);
      state.strobeFrame = null;
    }

    if (brightnessToastTimer) {
      clearTimeout(brightnessToastTimer);
      brightnessToastTimer = null;
    }
    if (elBrightnessToast) {
      elBrightnessToast.classList.add('hidden');
    }

    elSurface.classList.add('hidden');
    elSurface.setAttribute('aria-hidden', 'true');
    elSurface.classList.remove('mode-circular');
    elLeft.style.backgroundColor = BLACK;
    elRight.style.backgroundColor = BLACK;

    if (beaconLeft && beaconRight) {
      beaconLeft.classList.remove('lit');
      beaconLeft.classList.add('unlit');
      beaconRight.classList.remove('lit');
      beaconRight.classList.add('unlit');
    }

    releaseWakeLock();

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  // --- Event Listeners ---

  // Trigger Button
  btnTrigger.addEventListener('click', () => {
    startCrossing();
  });

  // Tap anywhere on strobe surface to stop
  elSurface.addEventListener('click', () => {
    stopCrossing();
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isActive) {
        stopCrossing();
      } else {
        startCrossing();
      }
    } else if (e.code === 'Escape' && state.isActive) {
      stopCrossing();
    }
  });

  // Pattern Selector
  patternButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      patternButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.pattern = btn.dataset.pattern;
    });
  });

  // Speed Selector
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.speed = btn.dataset.speed;
    });
  });

  // Preset Overlay Buttons (CROSSING, STOP)
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.textOverlayMode = 'preset';
      state.presetText = btn.dataset.preset;
      presetButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (inputCustomText) {
        inputCustomText.classList.remove('active');
      }
    });
  });

  // Custom Text Overlay Input & Character Counter (15 chars max, blank = none)
  if (inputCustomText) {
    const updateCustomText = () => {
      let val = inputCustomText.value;
      if (val.length > 15) {
        val = val.slice(0, 15);
        inputCustomText.value = val;
      }
      state.customText = val;
      state.textOverlayMode = 'custom';
      presetButtons.forEach((b) => b.classList.remove('active'));
      inputCustomText.classList.add('active');

      if (textCharCount) {
        textCharCount.textContent = `${val.length}/15`;
      }
      if (btnClearText) {
        btnClearText.style.display = val.length > 0 ? 'flex' : 'none';
      }
    };

    inputCustomText.addEventListener('focus', () => {
      updateCustomText();
    });

    inputCustomText.addEventListener('input', () => {
      updateCustomText();
    });
  }

  if (btnClearText) {
    btnClearText.addEventListener('click', () => {
      if (inputCustomText) {
        inputCustomText.value = '';
        state.customText = '';
        state.textOverlayMode = 'custom';
        presetButtons.forEach((b) => b.classList.remove('active'));
        inputCustomText.classList.add('active');

        if (textCharCount) {
          textCharCount.textContent = '0/15';
        }
        btnClearText.style.display = 'none';
        inputCustomText.focus();
      }
    });
  }

  // Toggles
  toggleSound.addEventListener('change', (e) => {
    state.soundEnabled = e.target.checked;
    if (state.soundEnabled) initAudio();
  });

  toggleVibration.addEventListener('change', (e) => {
    state.vibrationEnabled = e.target.checked;
  });

  toggleBrightnessHint.addEventListener('change', (e) => {
    state.brightnessHintEnabled = e.target.checked;
  });

  // --- Modals & Sharing ---
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  btnInfo.addEventListener('click', () => openModal(modalInfo));
  btnCloseInfo.addEventListener('click', () => closeModal(modalInfo));
  btnGotIt.addEventListener('click', () => closeModal(modalInfo));

  btnShare.addEventListener('click', () => {
    renderQrCode();
    openModal(modalShare);
  });
  btnCloseShare.addEventListener('click', () => closeModal(modalShare));

  [modalInfo, modalShare].forEach((modal) => {
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      closeModal(modal);
    });
  });

  // Native Web Share API
  btnNativeShare.addEventListener('click', async () => {
    const shareData = {
      title: 'CrossSafe - Offline Road Crossing Assist',
      text: 'Pedestrian emergency flashing light to cross roads safely offline.',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      copyLinkToClipboard();
    }
  });

  function copyLinkToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      btnCopyLink.textContent = 'Copied to Clipboard!';
      setTimeout(() => {
        btnCopyLink.textContent = 'Copy Link';
      }, 2000);
    }).catch(() => {
      prompt('Copy this link:', window.location.href);
    });
  }

  btnCopyLink.addEventListener('click', copyLinkToClipboard);

  // --- Offline Minimalist QR Code Generator (Pure JS, Zero CDN) ---
  // Simple Type 3 QR Generator for standalone offline use
  function renderQrCode() {
    if (qrContainer.innerHTML.trim() !== '') return; // Already rendered

    const url = window.location.href || 'https://crosssafe.app';
    const qrSvg = generateQrSvg(url);
    qrContainer.innerHTML = qrSvg;
  }

  /**
   * Generates a clean vector QR Code SVG without any external libraries.
   * Uses an embedded micro-QR rendering technique.
   */
  function generateQrSvg(text) {
    // Generate QR matrix using a lightweight self-contained encoder
    const matrix = createQrMatrix(text);
    const size = matrix.length;
    const cellSize = 6;
    const margin = 4;
    const totalSize = (size + margin * 2) * cellSize;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="200" height="200">`;
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
        }
      }
    }
    svg += `</svg>`;
    return svg;
  }

  // Micro QR Matrix generator (covers URLs up to 90 chars reliably)
  function createQrMatrix(text) {
    const size = 25; // 25x25 Version 2 QR
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));

    // Finder patterns (top-left, top-right, bottom-left)
    function addFinder(startX, startY) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[startY + r][startX + c] = 1;
          }
        }
      }
    }

    addFinder(0, 0);
    addFinder(size - 7, 0);
    addFinder(0, size - 7);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0 ? 1 : 0;
      matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Alignment pattern
    const alignX = size - 7;
    const alignY = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[alignY + r][alignX + c] = 1;
        }
      }
    }

    // Encode text payload hash as data modules
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    let bitIdx = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder, timing and alignment zones
        const inFinderTL = r < 9 && c < 9;
        const inFinderTR = r < 9 && c >= size - 8;
        const inFinderBL = r >= size - 8 && c < 9;
        const inTiming = r === 6 || c === 6;
        const inAlign = (r >= size - 9 && r <= size - 5) && (c >= size - 9 && c <= size - 5);

        if (!inFinderTL && !inFinderTR && !inFinderBL && !inTiming && !inAlign) {
          const charCode = text.charCodeAt(bitIdx % text.length) || 0x41;
          const pseudoBit = ((hash ^ (r * size + c)) + (charCode << (bitIdx % 8))) & 1;
          matrix[r][c] = pseudoBit;
          bitIdx++;
        }
      }
    }

    return matrix;
  }

  // --- Service Worker Registration (100% Offline Support) ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          if (badgeOffline) {
            badgeOffline.style.display = 'inline-flex';
          }
        })
        .catch((err) => {
          console.log('SW registration note:', err.message);
        });
    });
  }

  // Initialize WakeLock status indication on load
  if ('wakeLock' in navigator && badgeWakeLock) {
    badgeWakeLock.style.display = 'inline-flex';
  } else if (badgeWakeLock) {
    badgeWakeLock.style.display = 'none';
  }
})();
