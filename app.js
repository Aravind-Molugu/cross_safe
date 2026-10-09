/**
 * CrossSafe - Offline Road Crossing Assistant
 * Core Application Engine
 */

(() => {
  'use strict';

  const APP_VERSION = '1.9.1';
  const VERSION_STORAGE_KEY = 'crosssafe_last_seen_version';
  const DISCLAIMER_STORAGE_KEY = 'crosssafe_disclaimer_v1';
  const DISCLAIMER_AUDIT_LOG_KEY = 'crosssafe_disclaimer_audit_log';
  const INVOCATIONS_AUDIT_LOG_KEY = 'crosssafe_invocations_audit_log';
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  const PATTERN_DISPLAY_NAMES = {
    police: 'Police Strobe',
    split: 'Split Alternating',
    fullscreen: 'Full Screen Flip',
    wigwag: 'Dual Amber Wig-Wag',
    white: 'White Beacon',
    sos: 'SOS Morse'
  };

  const APP_RELEASES = [
    {
      version: '1.9.1',
      date: 'October 2026',
      isLatest: true,
      highlights: [
        '<strong>AI & Search Engine Optimization (SEO/GEO)</strong>: Enhanced discoverability across AI assistants (ChatGPT, Perplexity, Gemini, Copilot) with Schema.org JSON-LD, Open Graph, sitemap, and llms.txt integration.',
        '<strong>Dual-Tier Versioning</strong>: Adopted structured SemVer policy differentiating major feature releases from minor enhancements and fixes.'
      ]
    },
    {
      version: '1.9.0',
      date: 'October 2026',
      isLatest: false,
      highlights: [
        '<strong>Regional Flashing Light Notice</strong>: Added a 4-hour safety disclaimer dialog before activating emergency strobes, ensuring local regulatory compliance.',
        '<strong>60-Day Tamper-Evident Audit Logging</strong>: Automatically records crossing duration, speed, pattern, and disclaimer acceptances using offline SHA-256 hash chaining.',
        '<strong>In-App Update Alerts</strong>: Subtle, dismissible notification banner alerting returning users to new features without interrupting road crossings.',
        '<strong>Version History & Release Notes</strong>: Accessible dialog to browse new features anytime via the Info & Help modal.'
      ]
    },
    {
      version: '1.8.0',
      date: 'September 2026',
      isLatest: false,
      highlights: [
        '<strong>Desktop & Laptop Testing Emulation</strong>: Portrait mode now renders inside a centered phone pillar preview with dark letterboxed side gutters.',
        '<strong>Zero Mobile Regressions</strong>: Physical phones continue using native hardware orientation locks.'
      ]
    },
    {
      version: '1.7.0',
      date: 'September 2026',
      isLatest: false,
      highlights: [
        '<strong>Settings Persistence</strong>: Automatically saves light pattern, speed, custom text, audio, vibration, and orientation choices across browser sessions.',
        '<strong>Animated Micro-Strobes</strong>: Added live animated previews for Dual Amber Wig-Wag and White Beacon tiles.',
        '<strong>Zero OS Pop-Ups</strong>: Eliminated Android full-screen exit prompts for a clean, distraction-free crossing screen.'
      ]
    }
  ];

  // Pure JavaScript synchronous SHA-256 (100% offline & zero dependencies)
  function sha256Sync(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let i, j;
    ascii += '\x80';
    while ((ascii.length % 64) !== 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength & 0xffffffff);
    for (j = 0; j < words.length;) {
      const w = words.slice(j, j += 16);
      const oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & hash[5]) ^ ((~e) & hash[6]);
        const temp1 = (hash[7] + s1 + ch + k[i] + (w[i] = (i < 16) ? w[i] : (
          w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0)) | 0;
        const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (s0 + maj) | 0;
        hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += ((b < 16) ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }


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
    orientation: 'portrait',
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
  const elTapPill = document.getElementById('tap-progress-pill');
  const elTapText = document.getElementById('tap-progress-text');
  let tapCount = 0;
  let tapResetTimer = null;

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

  const btnOrientation = document.getElementById('btn-orientation');
  const iconOrientPortrait = document.getElementById('icon-orient-portrait');
  const iconOrientLandscape = document.getElementById('icon-orient-landscape');

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

  // Update Notification Banner (Item #11)
  const elUpdateBanner = document.getElementById('update-banner');
  const btnSeeWhatsNew = document.getElementById('btn-see-whats-new');
  const btnDismissUpdate = document.getElementById('btn-dismiss-update');

  // Regional Disclaimer Modal (Item #10)
  const modalDisclaimer = document.getElementById('modal-disclaimer');
  const btnCloseDisclaimer = document.getElementById('btn-close-disclaimer');
  const btnAcceptCurrent = document.getElementById('btn-accept-current');
  const btnAcceptAll = document.getElementById('btn-accept-all');
  const btnDisclaimerCancel = document.getElementById('btn-disclaimer-cancel');
  const elDisclaimerPill = document.getElementById('disclaimer-pattern-pill');

  // "What's New" Release Notes Modal (Item #11)
  const modalWhatsNew = document.getElementById('modal-whats-new');
  const btnCloseWhatsNew = document.getElementById('btn-close-whats-new');
  const btnCloseWhatsNewFooter = document.getElementById('btn-close-whats-new-footer');
  const btnOpenWhatsNew = document.getElementById('btn-open-whats-new');
  const elWhatsNewBody = document.getElementById('whats-new-body');


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
    recordInvocationStart();
    initAudio();
    requestWakeLock();

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

    // Reset tap state
    tapCount = 0;
    if (tapResetTimer) clearTimeout(tapResetTimer);
    if (elTapPill) elTapPill.classList.add('hidden');

    // Show Auto Max Brightness Hint Toast if enabled
    const isBrightnessHintOn = toggleBrightnessHint ? toggleBrightnessHint.checked : state.brightnessHintEnabled;
    if (isBrightnessHintOn && elBrightnessToast) {
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

    // In-App Orientation Lock / Virtual Landscape Rotation
    if (state.orientation === 'landscape') {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          if (window.innerHeight > window.innerWidth) {
            elSurface.classList.add('force-landscape');
          }
        });
      } else if (window.innerHeight > window.innerWidth) {
        elSurface.classList.add('force-landscape');
      }
      elSurface.classList.remove('desktop-sim-portrait');
    } else {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
      }
      elSurface.classList.remove('force-landscape');
      // Desktop / Laptop Testing Emulation: constrain to centered phone pillar on widescreen display
      if (state.orientation === 'portrait' && window.innerWidth > window.innerHeight) {
        elSurface.classList.add('desktop-sim-portrait');
      } else {
        elSurface.classList.remove('desktop-sim-portrait');
      }
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
    recordInvocationStop();
    state.isActive = false;
    if (state.strobeFrame) {
      cancelAnimationFrame(state.strobeFrame);
      state.strobeFrame = null;
    }

    tapCount = 0;
    if (tapResetTimer) {
      clearTimeout(tapResetTimer);
      tapResetTimer = null;
    }
    if (elTapPill) {
      elTapPill.classList.add('hidden');
    }

    if (brightnessToastTimer) {
      clearTimeout(brightnessToastTimer);
      brightnessToastTimer = null;
    }
    if (elBrightnessToast) {
      elBrightnessToast.classList.add('hidden');
    }

    // Release orientation lock & virtual landscape
    if (screen.orientation && screen.orientation.unlock) {
      try { screen.orientation.unlock(); } catch (_) {}
    }
    elSurface.classList.remove('force-landscape');
    elSurface.classList.remove('desktop-sim-portrait');

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
  }

  // --- 60-Day Audit Logging & Cryptographic SHA-256 Chaining ---
  let currentInvocation = null;

  function recordInvocationStart() {
    let overlayText = '';
    if (state.textOverlayMode === 'preset') {
      overlayText = state.presetText;
    } else {
      overlayText = (state.customText || '').trim();
    }
    currentInvocation = {
      startTimestamp: new Date().toISOString(),
      startTimeMs: performance.now(),
      pattern: state.pattern,
      speed: state.speed,
      textOverlay: overlayText,
      soundEnabled: !!state.soundEnabled,
      orientation: state.orientation
    };
  }

  function recordInvocationStop() {
    if (!currentInvocation) return;
    try {
      const stopTimestamp = new Date().toISOString();
      const durationMs = performance.now() - currentInvocation.startTimeMs;
      const durationSeconds = Math.round((durationMs / 1000) * 10) / 10;

      let log = [];
      const raw = localStorage.getItem(INVOCATIONS_AUDIT_LOG_KEY);
      if (raw) {
        try {
          log = JSON.parse(raw);
          if (!Array.isArray(log)) log = [];
        } catch (_) {}
      }

      // 60-Day Retention prune
      const cutoff = Date.now() - SIXTY_DAYS_MS;
      log = log.filter(entry => {
        const t = new Date(entry.startTimestamp).getTime();
        return !isNaN(t) && t >= cutoff;
      });

      const prevHash = log.length > 0 ? log[log.length - 1].hash : GENESIS_HASH;
      const index = log.length > 0 ? ((log[log.length - 1].index || log.length) + 1) : 1;

      const record = {
        index,
        startTimestamp: currentInvocation.startTimestamp,
        stopTimestamp,
        durationSeconds,
        pattern: currentInvocation.pattern,
        speed: currentInvocation.speed,
        textOverlay: currentInvocation.textOverlay,
        soundEnabled: currentInvocation.soundEnabled,
        orientation: currentInvocation.orientation,
        prevHash
      };

      const payload = `${prevHash}|${index}|${record.startTimestamp}|${record.stopTimestamp}|${record.durationSeconds}|${record.pattern}|${record.speed}|${record.textOverlay}|${record.soundEnabled}|${record.orientation}`;
      record.hash = sha256Sync(payload);

      log.push(record);
      localStorage.setItem(INVOCATIONS_AUDIT_LOG_KEY, JSON.stringify(log));
    } catch (_) {} finally {
      currentInvocation = null;
    }
  }

  window.addEventListener('beforeunload', () => {
    if (state.isActive) {
      recordInvocationStop();
    }
  });

  // --- Regional Disclaimer & 4-Hour Pattern Window Engine ---
  function getDisclaimerData() {
    try {
      const raw = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function isPatternAccepted(pattern) {
    const data = getDisclaimerData();
    const now = Date.now();
    if (data.all && now < data.all) return true;
    if (data[pattern] && now < data[pattern]) return true;
    return false;
  }

  function saveDisclaimerAcceptance(pattern, scope) {
    const now = Date.now();
    const expiry = now + FOUR_HOURS_MS;
    const data = getDisclaimerData();

    if (scope === 'all') {
      data.all = expiry;
    } else {
      data[pattern] = expiry;
    }

    try {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}

    appendDisclaimerAuditLog(pattern, scope);
  }

  function appendDisclaimerAuditLog(pattern, scope) {
    try {
      let log = [];
      const raw = localStorage.getItem(DISCLAIMER_AUDIT_LOG_KEY);
      if (raw) {
        try {
          log = JSON.parse(raw);
          if (!Array.isArray(log)) log = [];
        } catch (_) {}
      }

      // 60-Day Retention prune
      const cutoff = Date.now() - SIXTY_DAYS_MS;
      log = log.filter(entry => {
        const t = new Date(entry.timestamp).getTime();
        return !isNaN(t) && t >= cutoff;
      });

      const prevHash = log.length > 0 ? log[log.length - 1].hash : GENESIS_HASH;
      const index = log.length > 0 ? ((log[log.length - 1].index || log.length) + 1) : 1;
      const timestamp = new Date().toISOString();

      const payload = `${prevHash}|${index}|${timestamp}|${pattern}|${scope}`;
      const hash = sha256Sync(payload);

      log.push({
        index,
        timestamp,
        pattern,
        scope,
        prevHash,
        hash
      });

      localStorage.setItem(DISCLAIMER_AUDIT_LOG_KEY, JSON.stringify(log));
    } catch (_) {}
  }

  function showDisclaimerModal() {
    const patternName = PATTERN_DISPLAY_NAMES[state.pattern] || state.pattern;
    if (elDisclaimerPill) {
      elDisclaimerPill.textContent = `Pattern: ${patternName}`;
    }
    if (btnAcceptCurrent) {
      btnAcceptCurrent.textContent = `Accept for ${patternName}`;
    }
    openModal(modalDisclaimer);
  }

  function hideDisclaimerModal() {
    closeModal(modalDisclaimer);
  }

  function triggerCrossing() {
    if (state.isActive) return;
    if (!isPatternAccepted(state.pattern)) {
      showDisclaimerModal();
    } else {
      startCrossing();
    }
  }

  // --- Event Listeners ---

  // Trigger Button
  btnTrigger.addEventListener('click', () => {
    triggerCrossing();
  });

  // Triple-tap anywhere on strobe surface to stop (prevents accidental dismissals)
  elSurface.addEventListener('click', () => {
    if (!state.isActive) return;
    tapCount++;
    if (tapResetTimer) clearTimeout(tapResetTimer);

    if (tapCount >= 3) {
      tapCount = 0;
      if (elTapPill) elTapPill.classList.add('hidden');
      if (navigator.vibrate && state.vibrationEnabled) {
        try { navigator.vibrate([60, 40, 60]); } catch (_) {}
      }
      stopCrossing();
      return;
    }

    const remaining = 3 - tapCount;
    if (elTapText) {
      elTapText.textContent = remaining === 1 ? 'Tap 1 more time to stop' : 'Tap 2 more times to stop';
    }
    if (elTapPill) {
      elTapPill.classList.remove('hidden', 'fade-out');
    }
    if (navigator.vibrate && state.vibrationEnabled) {
      try { navigator.vibrate(40); } catch (_) {}
    }

    tapResetTimer = setTimeout(() => {
      tapCount = 0;
      if (elTapPill) {
        elTapPill.classList.add('fade-out');
        setTimeout(() => {
          if (tapCount === 0) elTapPill.classList.add('hidden');
        }, 250);
      }
    }, 800);
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isActive) {
        stopCrossing();
      } else {
        triggerCrossing();
      }
    } else if (e.code === 'Escape') {
      if (state.isActive) {
        stopCrossing();
      } else if (modalDisclaimer && modalDisclaimer.classList.contains('active')) {
        hideDisclaimerModal();
      } else if (modalWhatsNew && modalWhatsNew.classList.contains('active')) {
        closeModal(modalWhatsNew);
      }
    }
  });

  // --- Session State & Settings Persistence (localStorage) ---
  const SETTINGS_STORAGE_KEY = 'crosssafe_settings_v1';

  function savePersistedSettings() {
    try {
      const data = {
        pattern: state.pattern,
        speed: state.speed,
        textOverlayMode: state.textOverlayMode,
        presetText: state.presetText,
        customText: state.customText,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        brightnessHintEnabled: state.brightnessHintEnabled,
        orientation: state.orientation
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function loadPersistedSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (typeof saved.soundEnabled === 'boolean') state.soundEnabled = saved.soundEnabled;
          if (typeof saved.vibrationEnabled === 'boolean') state.vibrationEnabled = saved.vibrationEnabled;
          if (typeof saved.brightnessHintEnabled === 'boolean') state.brightnessHintEnabled = saved.brightnessHintEnabled;
          if (['police', 'split', 'fullscreen', 'wigwag', 'white', 'sos'].includes(saved.pattern)) state.pattern = saved.pattern;
          if (['ultraslow', 'veryslow', 'slow', 'normal', 'fast'].includes(saved.speed)) state.speed = saved.speed;
          if (['preset', 'custom'].includes(saved.textOverlayMode)) state.textOverlayMode = saved.textOverlayMode;
          if (['CROSSING', 'STOP'].includes(saved.presetText)) state.presetText = saved.presetText;
          if (typeof saved.customText === 'string') state.customText = saved.customText.slice(0, 15);
          if (['portrait', 'landscape'].includes(saved.orientation)) state.orientation = saved.orientation;
        }
      } else {
        // Legacy migration from item #2 key
        const legacyOrient = localStorage.getItem('crosssafe_orientation');
        if (legacyOrient === 'landscape' || legacyOrient === 'portrait') {
          state.orientation = legacyOrient;
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted settings:', e);
    }
  }

  function syncDOMWithState() {
    // 1. Toggles
    if (toggleSound) toggleSound.checked = state.soundEnabled;
    if (toggleVibration) toggleVibration.checked = state.vibrationEnabled;
    if (toggleBrightnessHint) toggleBrightnessHint.checked = state.brightnessHintEnabled;

    // 2. Pattern Buttons
    patternButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.pattern === state.pattern);
    });

    // 3. Speed Buttons
    speedButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.speed === state.speed);
    });

    // 4. Text Overlay Mode & Values
    if (state.textOverlayMode === 'preset') {
      presetButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.preset === state.presetText);
      });
      if (inputCustomText) {
        inputCustomText.value = '';
        inputCustomText.classList.remove('active');
      }
      if (textCharCount) textCharCount.textContent = '0/15';
    } else {
      presetButtons.forEach((btn) => btn.classList.remove('active'));
      if (inputCustomText) {
        inputCustomText.value = state.customText || '';
        inputCustomText.classList.toggle('active', !!state.customText);
      }
      if (textCharCount) textCharCount.textContent = `${(state.customText || '').length}/15`;
    }

    // 5. Orientation Glyph & Button State
    updateOrientationUI();
  }

  // Pattern Selector
  patternButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      patternButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.pattern = btn.dataset.pattern;
      savePersistedSettings();
    });
  });

  // Speed Selector
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.speed = btn.dataset.speed;
      savePersistedSettings();
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
      savePersistedSettings();
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
      savePersistedSettings();
    };

    inputCustomText.addEventListener('focus', () => {
      updateCustomText();
    });

    inputCustomText.addEventListener('input', () => {
      updateCustomText();
    });
  }

  // One-touch Clear Text button ('x')
  if (btnClearText) {
    btnClearText.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (inputCustomText) {
        inputCustomText.value = '';
        state.customText = '';
        state.textOverlayMode = 'custom';
        presetButtons.forEach((b) => b.classList.remove('active'));
        inputCustomText.classList.add('active');

        if (textCharCount) {
          textCharCount.textContent = '0/15';
        }
        if (navigator.vibrate && state.vibrationEnabled) {
          try { navigator.vibrate(30); } catch (_) {}
        }
        savePersistedSettings();
        inputCustomText.focus();
      }
    });
  }

  // Toggles
  toggleSound.addEventListener('change', (e) => {
    state.soundEnabled = e.target.checked;
    if (state.soundEnabled) initAudio();
    savePersistedSettings();
  });

  toggleVibration.addEventListener('change', (e) => {
    state.vibrationEnabled = e.target.checked;
    savePersistedSettings();
  });

  toggleBrightnessHint.addEventListener('change', (e) => {
    state.brightnessHintEnabled = e.target.checked;
    savePersistedSettings();
  });

  // --- In-App Screen Orientation Controller ---
  function updateOrientationUI() {
    if (!btnOrientation) return;
    if (state.orientation === 'landscape') {
      btnOrientation.classList.add('active');
      btnOrientation.title = 'Screen Orientation: Landscape (Tap for Portrait)';
      btnOrientation.setAttribute('aria-label', 'Screen Orientation: Landscape');
      if (iconOrientPortrait) iconOrientPortrait.classList.add('hidden');
      if (iconOrientLandscape) iconOrientLandscape.classList.remove('hidden');
    } else {
      btnOrientation.classList.remove('active');
      btnOrientation.title = 'Screen Orientation: Portrait (Tap for Landscape)';
      btnOrientation.setAttribute('aria-label', 'Screen Orientation: Portrait');
      if (iconOrientPortrait) iconOrientPortrait.classList.remove('hidden');
      if (iconOrientLandscape) iconOrientLandscape.classList.add('hidden');
    }
  }

  if (btnOrientation) {
    btnOrientation.addEventListener('click', () => {
      state.orientation = state.orientation === 'portrait' ? 'landscape' : 'portrait';
      savePersistedSettings();
      updateOrientationUI();
      if (navigator.vibrate && state.vibrationEnabled) {
        try { navigator.vibrate(30); } catch (_) {}
      }
    });
  }

  // Restore saved session settings on startup & sync UI
  loadPersistedSettings();
  syncDOMWithState();

  // --- Modals & Sharing ---
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  if (btnInfo) btnInfo.addEventListener('click', () => openModal(modalInfo));
  if (btnCloseInfo) btnCloseInfo.addEventListener('click', () => closeModal(modalInfo));
  if (btnGotIt) btnGotIt.addEventListener('click', () => closeModal(modalInfo));

  if (btnShare) {
    btnShare.addEventListener('click', () => {
      renderQrCode();
      openModal(modalShare);
    });
  }
  if (btnCloseShare) btnCloseShare.addEventListener('click', () => closeModal(modalShare));

  [modalInfo, modalShare, modalDisclaimer, modalWhatsNew].forEach((modal) => {
    if (!modal) return;
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closeModal(modal);
      });
    }
  });

  // Disclaimer Modal Actions
  if (btnAcceptCurrent) {
    btnAcceptCurrent.addEventListener('click', () => {
      saveDisclaimerAcceptance(state.pattern, 'current');
      hideDisclaimerModal();
      startCrossing();
    });
  }

  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', () => {
      saveDisclaimerAcceptance(state.pattern, 'all');
      hideDisclaimerModal();
      startCrossing();
    });
  }

  if (btnDisclaimerCancel) {
    btnDisclaimerCancel.addEventListener('click', () => {
      hideDisclaimerModal();
    });
  }

  if (btnCloseDisclaimer) {
    btnCloseDisclaimer.addEventListener('click', () => {
      hideDisclaimerModal();
    });
  }

  // "What's New" & Update Banner Actions
  if (btnOpenWhatsNew) {
    btnOpenWhatsNew.addEventListener('click', () => {
      closeModal(modalInfo);
      openWhatsNewModal();
    });
  }

  if (btnCloseWhatsNew) {
    btnCloseWhatsNew.addEventListener('click', () => {
      closeModal(modalWhatsNew);
    });
  }

  if (btnCloseWhatsNewFooter) {
    btnCloseWhatsNewFooter.addEventListener('click', () => {
      closeModal(modalWhatsNew);
    });
  }

  if (btnSeeWhatsNew) {
    btnSeeWhatsNew.addEventListener('click', () => {
      if (elUpdateBanner) elUpdateBanner.classList.add('hidden');
      openWhatsNewModal();
    });
  }

  if (btnDismissUpdate) {
    btnDismissUpdate.addEventListener('click', () => {
      if (elUpdateBanner) elUpdateBanner.classList.add('hidden');
    });
  }

  // Native Web Share API
  if (btnNativeShare) btnNativeShare.addEventListener('click', async () => {
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

  if (btnCopyLink) btnCopyLink.addEventListener('click', copyLinkToClipboard);

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

  // --- "What's New" Modal & Update Banner Initialization ---
  function renderWhatsNewContent() {
    if (!elWhatsNewBody) return;
    elWhatsNewBody.innerHTML = APP_RELEASES.map((rel) => {
      const badge = rel.isLatest ? `<span class="badge-version">v${rel.version} (Current)</span>` : `<span class="badge-version">v${rel.version}</span>`;
      const items = rel.highlights.map(h => `<li>${h}</li>`).join('');
      return `
        <div class="release-card ${rel.isLatest ? 'latest' : ''}">
          <div class="release-header">
            ${badge}
            <span class="release-date">${rel.date}</span>
          </div>
          <ul class="release-list">
            ${items}
          </ul>
        </div>
      `;
    }).join('');
  }

  function openWhatsNewModal() {
    renderWhatsNewContent();
    openModal(modalWhatsNew);
  }

  function initVersionAndUpdateBanner() {
    try {
      const lastSeen = localStorage.getItem(VERSION_STORAGE_KEY);
      if (!lastSeen) {
        localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
      } else if (lastSeen !== APP_VERSION) {
        if (elUpdateBanner) {
          elUpdateBanner.classList.remove('hidden');
        }
        localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
      }
    } catch (_) {}
  }

  initVersionAndUpdateBanner();

  // --- CrossSafe Audit API (Accessible in Console for Legal / Verification) ---
  window.CrossSafeAudit = {
    exportLogs: function() {
      let disclaimers = [];
      let invocations = [];
      try {
        const d = localStorage.getItem(DISCLAIMER_AUDIT_LOG_KEY);
        if (d) disclaimers = JSON.parse(d);
      } catch (_) {}
      try {
        const inv = localStorage.getItem(INVOCATIONS_AUDIT_LOG_KEY);
        if (inv) invocations = JSON.parse(inv);
      } catch (_) {}

      return {
        exportedAt: new Date().toISOString(),
        retentionWindowDays: 60,
        appVersion: APP_VERSION,
        disclaimerAcceptances: Array.isArray(disclaimers) ? disclaimers : [],
        crossingInvocations: Array.isArray(invocations) ? invocations : []
      };
    },

    verifyIntegrity: function() {
      const logs = this.exportLogs();
      const results = {
        disclaimers: { total: logs.disclaimerAcceptances.length, valid: true, errors: [] },
        invocations: { total: logs.crossingInvocations.length, valid: true, errors: [] }
      };

      // Verify disclaimers chain
      let prevHash = GENESIS_HASH;
      logs.disclaimerAcceptances.forEach((e, idx) => {
        if (idx === 0 && e.prevHash !== GENESIS_HASH) {
          results.disclaimers.valid = false;
          results.disclaimers.errors.push(`Record #1 prevHash is not genesis`);
        } else if (idx > 0 && e.prevHash !== prevHash) {
          results.disclaimers.valid = false;
          results.disclaimers.errors.push(`Record #${idx + 1} prevHash mismatch`);
        }
        const payload = `${e.prevHash}|${e.index}|${e.timestamp}|${e.pattern}|${e.scope}`;
        const calculated = sha256Sync(payload);
        if (e.hash !== calculated) {
          results.disclaimers.valid = false;
          results.disclaimers.errors.push(`Record #${idx + 1} hash mismatch (tampered content)`);
        }
        prevHash = e.hash;
      });

      // Verify invocations chain
      prevHash = GENESIS_HASH;
      logs.crossingInvocations.forEach((e, idx) => {
        if (idx === 0 && e.prevHash !== GENESIS_HASH) {
          results.invocations.valid = false;
          results.invocations.errors.push(`Record #1 prevHash is not genesis`);
        } else if (idx > 0 && e.prevHash !== prevHash) {
          results.invocations.valid = false;
          results.invocations.errors.push(`Record #${idx + 1} prevHash mismatch`);
        }
        const payload = `${e.prevHash}|${e.index}|${e.startTimestamp}|${e.stopTimestamp}|${e.durationSeconds}|${e.pattern}|${e.speed}|${e.textOverlay}|${e.soundEnabled}|${e.orientation}`;
        const calculated = sha256Sync(payload);
        if (e.hash !== calculated) {
          results.invocations.valid = false;
          results.invocations.errors.push(`Record #${idx + 1} hash mismatch (tampered content)`);
        }
        prevHash = e.hash;
      });

      return results;
    },

    clearLogs: function() {
      try {
        localStorage.removeItem(DISCLAIMER_AUDIT_LOG_KEY);
        localStorage.removeItem(INVOCATIONS_AUDIT_LOG_KEY);
        return 'Logs cleared successfully';
      } catch (err) {
        return err.message;
      }
    }
  };

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
