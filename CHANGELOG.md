# Changelog

All notable changes to the **CrossSafe** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.9.1] - 2026-10-09

### Added
- **AI Search & Generative Engine Optimization (GEO)**:
  - **`robots.txt`**: Declared crawl permissions for standard web crawlers and modern AI agents (`GPTBot`, `ChatGPT-User`, `Google-Extended`, `PerplexityBot`, `ClaudeBot`, `cohere-ai`, `anthropic-ai`) with canonical sitemap integration.
  - **`sitemap.xml`**: Defined canonical deployment URL for search indexing.
  - **`llms.txt` & `llms-full.txt`**: Implemented standard markdown documentation for AI assistants, providing structured context on features, safety cadences, and pedestrian use cases.
  - **Schema.org JSON-LD**: Embedded `WebApplication` and `FAQPage` structured data graphs providing rich machine-readable metadata.
  - **Social Sharing Cards**: Added comprehensive Open Graph (`og:*`) and Twitter card tags with high-res icon assets.
  - **Semantic Crawlable Overview**: Added accessible, screen-reader and crawler-friendly `<section id="about-crosssafe">` ensuring non-JS scrapers can extract full feature and safety context.
- **Dual-Tier Versioning Policy**: Codified SemVer increment rules distinguishing major functional capability releases (`0.1.0` bump resetting patch) from minor refinements/fixes (`0.0.1` bump).

---

## [1.9.0] - 2026-10-06

### Added
- **Regional Flashing Light Disclaimer Pop-Up**: Mandatory, friction-free disclaimer dialog appearing before starting emergency strobes if the selected light pattern has not been accepted within the past 4 hours.
  - Three distinct choices: **Accept for Current Pattern** (4-hour exemption for the active mode), **Accept for All Patterns** (4-hour exemption across all modes), or **Cancel** (aborts without strobing).
  - High-urgency safety guarantee: An active crossing strobe is never interrupted if the 4-hour window lapses during use.
- **60-Day Tamper-Evident Audit Logging**:
  - **Disclaimer Acceptances Log** (`crosssafe_disclaimer_audit_log`): Tracks all disclaimer consents over a rolling 60-day period.
  - **Crossing Invocations Log** (`crosssafe_invocations_audit_log`): Records start/stop timestamps, duration (seconds), pattern, speed multiplier, text overlay, sound, and orientation for every crossing session.
  - **100% Offline SHA-256 Hash Chaining**: Every record cryptographically seals the previous record's hash, providing tamper-evidence for legal proceedings (e.g. proving a permitted slow cadence was utilized).
  - **Developer Console Audit Utility** (`window.CrossSafeAudit`): Programmatic `exportLogs()` and `verifyIntegrity()` methods accessible via browser developer tools with zero user interface bloat.
- **In-App Version Update Banner**: Subtle, dismissible notification banner alerting returning users when CrossSafe updates to a new version, with a *"See What's New"* action. Silent on initial installation.
- **"What's New" Release Notes Modal**: Accessible dialog showcasing recent feature highlights, past version summaries, and links to full project release notes.
- **Permanent Access in Info Modal**: Added a *"View Version History & What's New"* button inside the offline setup & help dialog.

---

## [1.8.0] - 2026-09-29

### Added
- **Desktop & Laptop Testing Emulation**: Selecting **Portrait** mode on widescreen displays (`window.innerWidth > window.innerHeight`) now renders the strobe inside a centered, realistic mobile phone pillar preview (`max-width: 440px`) with dark letterboxed side-gutter shrouds.
- Selecting **Landscape** mode stretches the strobe across the full 100vw display.
- Zero mobile regressions: physical mobile devices continue to utilize hardware orientation locking and native fullscreen without modification.

---

## [1.7.0] - 2026-09-29

### Added
- **Session State & Settings Persistence**: Preserves active pattern, speed, preset/custom text overlays, audio chirps, tactile vibration, brightness hint, and orientation across page reloads and browser restarts via `localStorage` (`crosssafe_settings_v1`).
- **Animated Pattern Previews (Amber & White)**: Added live CSS `@keyframes` micro-animations for Dual Amber Wig-Wag and White Beacon flashlight selector tiles.
- **Option C Pure CSS Full-Viewport Architecture**: Eliminated programmatic `requestFullscreen()` and `exitFullscreen()` calls, completely removing intrusive Android OS security pop-ups (*"Swipe down from top to exit full screen"*) and screen flicker on exit.

---

## [1.6.0] - 2026-09-28

### Added
- **Zero-Bloat Automated Unit Testing Suite**: Multi-tiered test suite including Python `unittest`, native Node.js `node:test`, and an in-browser standalone visual runner (`tests/runner.html`).
- **GitHub Actions CI Safety Gate**: Automated continuous integration workflow (`.github/workflows/test.yml`) running Python and Node.js tests on every push and pull request to `main` and `dev`.
- **Zero-Bloat Offline Cache Guarantee**: Strictly excluded all test directories and runners from the Service Worker cache (`ASSETS_TO_CACHE`), keeping the production PWA footprint lean.

---

## [1.5.0] - 2026-09-27

### Added
- **In-App Screen Orientation Toggle**: One-touch header toggle switching between Portrait and Landscape modes with custom SVG icons.
- **iOS Safari 90-Degree Hardware Fallback**: Pure CSS virtual landscape transform (`.force-landscape`) for devices where `screen.orientation.lock()` is restricted.
- **Animated Micro-Strobe Previews**: Live animated selector tiles for Police Strobe, Split Alternating, and Full Screen Flip.

---

## [1.0.0] - 2026-09-25

### Added
- Initial release of CrossSafe: Offline-First Road Crossing Assist PWA.
- 6 emergency light patterns (Police Strobe, Split Alternating, Full Screen Flip, Dual Amber Wig-Wag, White Beacon, SOS Morse).
- 5 speed multipliers (Ultra Slow to Rapid).
- Web Audio synthesized chirps and haptic vibration feedback.
- Preset and custom text badges ("CROSSING", "STOP").
- Triple-tap anywhere safety stop mechanism with visual countdown pill.
- Service Worker offline-first caching architecture.
- Standalone zero-dependency single-file edition (`crosssafe.html`).
