/**
 * CrossSafe - Automated Unit Tests (Node.js native test runner)
 * Executed via: node --test tests/unit.test.js
 * Zero external npm dependencies.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

function getFileContent(filename) {
  return fs.readFileSync(path.join(ROOT_DIR, filename), 'utf8');
}

describe('Service Worker & Offline Cache Integrity', () => {
  const swContent = getFileContent('sw.js');

  test('sw.js has valid CACHE_NAME version', () => {
    const match = swContent.match(/CACHE_NAME\s*=\s*['"](crosssafe-v[\d\.]+)['"]/);
    assert.ok(match, 'CACHE_NAME must exist');
    assert.match(match[1], /^crosssafe-v\d+\.\d+\.\d+/);
  });

  test('All files declared in ASSETS_TO_CACHE physically exist', () => {
    const match = swContent.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[(.*?)\];/s);
    assert.ok(match, 'ASSETS_TO_CACHE array must be present');
    
    const assets = match[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    for (const asset of assets) {
      const target = asset === './' || asset === './index.html' ? 'index.html' : asset.replace(/^\.\//, '');
      const fullPath = path.join(ROOT_DIR, target);
      assert.ok(fs.existsSync(fullPath), `Asset must exist: ${target}`);
      assert.ok(fs.statSync(fullPath).size > 0, `Asset must not be empty: ${target}`);
    }
  });

  test('Zero-Bloat: Test files are excluded from Service Worker cache', () => {
    assert.strictEqual(swContent.includes('tests/'), false, 'tests/ folder must never be in sw.js');
    assert.strictEqual(swContent.includes('runner.html'), false, 'runner.html must never be in sw.js');
  });
});

describe('Web App Manifest Verification', () => {
  const manifest = JSON.parse(getFileContent('manifest.webmanifest'));

  test('Manifest contains mandatory PWA fields', () => {
    const required = ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color'];
    for (const key of required) {
      assert.ok(key in manifest, `Field '${key}' missing in manifest`);
    }
  });

  test('All manifest icon assets exist on disk', () => {
    assert.ok(manifest.icons.length > 0, 'Icons list must not be empty');
    for (const icon of manifest.icons) {
      const iconPath = path.join(ROOT_DIR, icon.src);
      assert.ok(fs.existsSync(iconPath), `Icon not found: ${icon.src}`);
      assert.ok(fs.statSync(iconPath).size > 0, `Icon file is empty: ${icon.src}`);
    }
  });
});

describe('Strobe Engine Sequences & Calculations', () => {
  const appJs = getFileContent('app.js');

  test('All 6 emergency pattern sequences are defined in switch statement', () => {
    const patterns = ['police', 'split', 'fullscreen', 'wigwag', 'white', 'sos'];
    for (const p of patterns) {
      assert.ok(appJs.includes(`case '${p}':`), `Pattern '${p}' must be handled`);
    }
  });

  test('Speed multipliers are monotonically decreasing', () => {
    const speedMatch = appJs.match(/const\s+SPEED_CONFIGS\s*=\s*\{(.*?)\};/s);
    assert.ok(speedMatch, 'SPEED_CONFIGS object must exist');
    
    const speeds = ['ultraslow', 'veryslow', 'slow', 'normal', 'fast'];
    const mults = {};
    for (const s of speeds) {
      const re = new RegExp(`\\b${s}\\b\\s*:\\s*\\{\\s*mult\\s*:\\s*([\\d\\.]+)\\s*\\}`);
      const m = speedMatch[1].match(re);
      assert.ok(m, `Speed config '${s}' must exist`);
      mults[s] = parseFloat(m[1]);
    }

    assert.ok(mults.ultraslow > mults.veryslow);
    assert.ok(mults.veryslow > mults.slow);
    assert.ok(mults.slow > mults.normal);
    assert.ok(mults.normal > mults.fast);
    assert.strictEqual(mults.normal, 1.0);
  });
});

describe('CSS Keyframes & Standalone Parity', () => {
  const styles = getFileContent('styles.css');
  const crosssafe = getFileContent('crosssafe.html');

  test('Animated mini-strobe keyframes exist in styles.css and crosssafe.html', () => {
    const keyframes = [
      'miniPoliceStrobe',
      'miniSplitLeft',
      'miniSplitRight',
      'miniFullscreenFlip',
      'miniWigWagLeft',
      'miniWigWagRight',
      'miniWhiteBeacon'
    ];
    for (const kf of keyframes) {
      assert.ok(styles.includes(`@keyframes ${kf}`), `Missing @keyframes ${kf} in styles.css`);
      assert.ok(crosssafe.includes(`@keyframes ${kf}`), `Missing @keyframes ${kf} in crosssafe.html`);
    }
  });

  test('Force landscape fallback class exists in both stylesheets', () => {
    assert.ok(styles.includes('.strobe-surface.force-landscape'));
    assert.ok(crosssafe.includes('.strobe-surface.force-landscape'));
  });

  test('Desktop simulation phone pillar rules exist in both stylesheets', () => {
    assert.ok(styles.includes('.strobe-surface.desktop-sim-portrait'));
    assert.ok(crosssafe.includes('.strobe-surface.desktop-sim-portrait'));
    assert.ok(styles.includes('max-width: 440px'));
    assert.ok(crosssafe.includes('max-width: 440px'));
  });

  test('Desktop simulation orientation logic exists in app.js and crosssafe.html', () => {
    const appJs = getFileContent('app.js');
    assert.ok(appJs.includes('desktop-sim-portrait'));
    assert.ok(crosssafe.includes('desktop-sim-portrait'));
    assert.ok(appJs.includes("state.orientation === 'portrait' && window.innerWidth > window.innerHeight"));
    assert.ok(crosssafe.includes("state.orientation === 'portrait' && window.innerWidth > window.innerHeight"));
  });
});

describe('Session State Persistence (localStorage)', () => {
  const appJs = getFileContent('app.js');
  const crosssafe = getFileContent('crosssafe.html');

  test('SETTINGS_STORAGE_KEY matches crosssafe_settings_v1', () => {
    assert.ok(appJs.includes("SETTINGS_STORAGE_KEY = 'crosssafe_settings_v1'"));
    assert.ok(crosssafe.includes("SETTINGS_STORAGE_KEY = 'crosssafe_settings_v1'"));
  });

  test('Persistence functions exist in app.js and crosssafe.html', () => {
    for (const fn of ['savePersistedSettings', 'loadPersistedSettings', 'syncDOMWithState']) {
      assert.ok(appJs.includes(fn), `Missing ${fn} in app.js`);
      assert.ok(crosssafe.includes(fn), `Missing ${fn} in crosssafe.html`);
    }
  });
});

describe('Option C Clean Fullscreen (Zero Android Pop-ups)', () => {
  const appJs = getFileContent('app.js');
  const crosssafe = getFileContent('crosssafe.html');

  test('requestFullscreen and exitFullscreen calls are eliminated', () => {
    assert.strictEqual(appJs.includes('requestFullscreen'), false);
    assert.strictEqual(appJs.includes('exitFullscreen'), false);
    assert.strictEqual(crosssafe.includes('requestFullscreen'), false);
    assert.strictEqual(crosssafe.includes('exitFullscreen'), false);
  });
});

describe('GitHub Actions CI Workflow Integrity', () => {
  const workflow = getFileContent('.github/workflows/test.yml');

  test('Workflow file defines valid push and pull_request on-triggers for main and dev', () => {
    assert.ok(workflow.length > 0, 'Workflow file must not be empty');
    assert.ok(workflow.includes('on:'));
    assert.ok(workflow.includes('push:'));
    assert.ok(workflow.includes('pull_request:'));
    assert.ok(workflow.includes('main'));
    assert.ok(workflow.includes('dev'));
    assert.ok(workflow.includes('test_crosssafe.py'));
    assert.ok(workflow.includes('unit.test.js'));
  });
});

describe('Version Alignment & CHANGELOG.md (Item #11)', () => {
  const pkg = JSON.parse(getFileContent('package.json'));
  const sw = getFileContent('sw.js');
  const appJs = getFileContent('app.js');
  const crosssafe = getFileContent('crosssafe.html');
  const changelog = getFileContent('CHANGELOG.md');

  test('Version 1.9.0 aligns across package.json, sw.js, app.js, crosssafe.html, and CHANGELOG.md', () => {
    assert.strictEqual(pkg.version, '1.9.0');
    assert.ok(sw.includes('crosssafe-v1.9.0'));
    assert.ok(appJs.includes("APP_VERSION = '1.9.0'"));
    assert.ok(crosssafe.includes("APP_VERSION = '1.9.0'"));
    assert.ok(changelog.includes('## [1.9.0]'));
  });

  test('CHANGELOG.md adheres to Keep a Changelog standard format', () => {
    assert.ok(changelog.includes('# Changelog'));
    assert.ok(changelog.includes('Keep a Changelog'));
    assert.ok(changelog.includes('## [1.9.0]'));
    assert.ok(changelog.includes('## [1.8.0]'));
    assert.ok(changelog.includes('## [1.7.0]'));
  });

  test('Zero-Bloat: CHANGELOG.md is never cached by sw.js', () => {
    assert.strictEqual(sw.toLowerCase().includes('changelog'), false);
  });
});

describe('Regional Disclaimer & 60-Day Audit Logging (Item #10)', () => {
  const indexHtml = getFileContent('index.html');
  const crosssafe = getFileContent('crosssafe.html');
  const appJs = getFileContent('app.js');

  test('Disclaimer modal elements exist in index.html and crosssafe.html', () => {
    const ids = [
      'modal-disclaimer',
      'btn-close-disclaimer',
      'btn-accept-current',
      'btn-accept-all',
      'btn-disclaimer-cancel',
      'disclaimer-pattern-pill'
    ];
    for (const id of ids) {
      assert.ok(indexHtml.includes(`id="${id}"`), `Missing #${id} in index.html`);
      assert.ok(crosssafe.includes(`id="${id}"`), `Missing #${id} in crosssafe.html`);
    }
  });

  test('4-hour validity and 60-day audit constants are defined', () => {
    for (const code of [appJs, crosssafe]) {
      assert.ok(code.includes('FOUR_HOURS_MS = 4 * 60 * 60 * 1000'));
      assert.ok(code.includes('SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000'));
      assert.ok(code.includes("DISCLAIMER_STORAGE_KEY = 'crosssafe_disclaimer_v1'"));
      assert.ok(code.includes("DISCLAIMER_AUDIT_LOG_KEY = 'crosssafe_disclaimer_audit_log'"));
      assert.ok(code.includes("INVOCATIONS_AUDIT_LOG_KEY = 'crosssafe_invocations_audit_log'"));
    }
  });

  test('SHA-256 sync hash chaining and CrossSafeAudit API exist', () => {
    for (const code of [appJs, crosssafe]) {
      assert.ok(code.includes('function sha256Sync(ascii)'));
      assert.ok(code.includes('window.CrossSafeAudit'));
      assert.ok(code.includes('exportLogs'));
      assert.ok(code.includes('verifyIntegrity'));
      assert.ok(code.includes('clearLogs'));
    }
  });
});

describe('What\'s New Modal & Update Banner (Item #11)', () => {
  const indexHtml = getFileContent('index.html');
  const crosssafe = getFileContent('crosssafe.html');
  const appJs = getFileContent('app.js');

  test('Update banner and What\'s New modal elements exist in markup', () => {
    const ids = [
      'update-banner',
      'btn-see-whats-new',
      'btn-dismiss-update',
      'modal-whats-new',
      'btn-close-whats-new',
      'whats-new-body',
      'btn-close-whats-new-footer',
      'btn-open-whats-new'
    ];
    for (const id of ids) {
      assert.ok(indexHtml.includes(`id="${id}"`), `Missing #${id} in index.html`);
      assert.ok(crosssafe.includes(`id="${id}"`), `Missing #${id} in crosssafe.html`);
    }
  });

  test('APP_RELEASES contains structured release notes', () => {
    for (const code of [appJs, crosssafe]) {
      assert.ok(code.includes('const APP_RELEASES = ['));
      assert.ok(code.includes("version: '1.9.0'"));
      assert.ok(code.includes('isLatest: true'));
    }
  });
});



