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


