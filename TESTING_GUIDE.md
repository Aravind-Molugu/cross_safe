# CrossSafe - Testing Guide

This guide walks you through testing **CrossSafe** on your laptop, simulating mobile devices (iPhone & Android), testing 100% offline functionality, and previewing on your real phone over your local Wi-Fi before publishing.

---

## Method 1: Local Web Server + Mobile DevTools (Recommended)

This method tests the complete Progressive Web App (PWA) stack, including Service Worker caching, Web App Manifest, and mobile screen ratios.

### 1. Start a Local Server
Open a terminal (PowerShell or Command Prompt) in the project directory:

```powershell
python -m http.server 8080
```
*(Alternative if you have Node.js installed: `npx serve .`)*

### 2. Open in Your Browser
Open Google Chrome, Microsoft Edge, or Brave and navigate to:
```
http://localhost:8080
```

### 3. Simulate iPhone & Android Screens
1. Press **`F12`** (or right-click anywhere and click **Inspect**).
2. Press **`Ctrl + Shift + M`** to toggle the **Device Toolbar**.
3. From the top dropdown bar:
   - Select **iPhone 14 Pro**, **Pixel 7**, or **Samsung Galaxy S20**.
   - Set zoom to **100%** or **Fit to window**.
   - Click the rotate icon to test **Landscape mode** (ideal for holding the phone sideways across traffic).

### 4. Test 100% Offline Mode (Without Internet)
1. In the DevTools panel, click the **Application** tab (in Firefox: **Storage** or **Debugger**).
2. Under the left sidebar, click **Service Workers**.
3. Check the **"Offline"** checkbox.
4. Refresh the page or click around.
   - **Expected behavior**: The app continues to load, flash, and sound alerts without errors, completely disconnected from the network.
5. In the **Cache Storage** section, you will see `crosssafe-cache-v1` storing all HTML, CSS, JS, and icon assets.

---

## Method 2: Direct Double-Click (Single-File Version)

For the standalone `crosssafe.html` file (zero web server required):

1. Open your Windows File Explorer to the project folder:
   `c:\Users\moluguaravind\road_cross_assist`
2. **Double-click `crosssafe.html`**.
3. It will open instantly in your default web browser (`file:///...`).
4. Click **"TAP TO CROSS"** or press **Spacebar** to trigger flashing.
5. Verify:
   - Police emergency strobe cadence (rapid red/blue pulses).
   - Speed adjustments (Slow / Normal / Rapid).
   - Audio beep chirp toggle.

---

## Method 3: Test on Your Real Phone over Home Wi-Fi (Before Uploading to GitHub)

You can preview the app directly on your physical iPhone or Android phone without uploading anything to the internet:

### 1. Ensure Both Devices Are on the Same Wi-Fi Network
Make sure your laptop and your phone are connected to the same home Wi-Fi network.

### 2. Find Your Laptop's Local IP Address
In PowerShell on your laptop, run:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active Wi-Fi adapter (e.g., `192.168.1.45` or `10.0.0.12`).

### 3. Start the Server on Your Laptop
```powershell
python -m http.server 8080
```

### 4. Open on Your Phone
On your phone, open Safari (iOS) or Chrome (Android) and type:
```
http://<YOUR_LAPTOP_IP>:8080
```
*(Example: `http://192.168.1.45:8080`)*

### 5. What to Test on the Real Phone:
* **Max Brightness**: Turn your phone brightness to maximum and test nighttime visibility.
* **Orientation**: Turn your phone sideways (landscape). The display should expand to fill the entire screen.
* **Ergonomics**: Hold the phone pointing outward as if crossing a road; check if the vibration pulses let you know it's still running without looking at the screen.

---

## Method 4: Automated Unit Testing Suite (Zero-Bloat "Shift-Left")

Run automated regression and unit tests locally in milliseconds before committing to Git to ensure that GitHub Actions CI will pass without failure.

### 1. Python Unit Test Suite (Instant, Zero Dependencies)
Run the test suite directly from your PowerShell terminal using Python's built-in `unittest` runner:
```powershell
python tests/test_crosssafe.py
```
- **Execution time**: ~15 ms.
- **Coverage**: Service Worker cache definitions, manifest icons, standalone `crosssafe.html` parity, DOM IDs in `app.js` vs `index.html`, speed multipliers, and CSS animation keyframes.

### 2. In-Browser Visual Unit Test Runner (Zero Web Server)
Open `tests/runner.html` directly in any web browser (Chrome, Edge, Firefox, Safari):
- **Windows File Explorer**: Double-click `tests/runner.html`
- **Or open in browser**: `file:///C:/Users/moluguaravind/road_cross_assist/tests/runner.html`
- **Coverage**: Executes live browser JavaScript unit tests testing strobe sequences, speeds, character count clamping, SOS overrides, orientation states, and triple-tap counter logic with clear green checkmarks.

### 3. Node.js Native Test Suite (For CI & Node Environments)
If Node.js (v18+) is installed:
```powershell
npm test
# or: node --test tests/unit.test.js
```
- Uses Node.js's native `node:test` and `node:assert` modules without requiring any third-party `node_modules` downloads.

---

## Verification Checklist

| Test Item | Expected Result | Pass? |
| :--- | :--- | :--- |
| **Police Mode** | Rapid multi-pulse Red followed by rapid multi-pulse Blue | [ ] |
| **Split Mode** | Left side Red, Right side Blue alternating | [ ] |
| **Dual Amber Wig-Wag** | Dual max-diameter circular amber lamps alternating Left $\leftrightarrow$ Right | [ ] |
| **SOS Morse Mode** | International distress code (`··· ——— ···`) in white pulses with sync audio | [ ] |
| **Speed Control** | Smooth transition across 5 speed levels: Ultra Slow (~0.5 Hz), Very Slow (~1.0 Hz), Slow (~1.5 Hz), Normal (~4.0 Hz), Rapid (~8.0 Hz) | [ ] |
| **Audio Toggle** | Synthesized crossing chirp plays on click/tap | [ ] |
| **Vibration** | Haptic pulse fires periodically on supported mobile browsers | [ ] |
| **One-Touch Clear ('×')** | Tapping the '×' button inside the custom text box immediately clears text to blank, resets counter to 0/15, and sets overlay to None | [ ] |
| **Max Brightness Hint** | When enabled, a reminder banner appears at the top of the strobe screen and auto-fades after 3.5s; when toggle is OFF, the reminder is strictly suppressed | [ ] |
| **Triple Tap to Stop** | Tap 1 shows "Tap 2 more times to stop" pill + haptic buzz; Tap 2 shows "Tap 1 more time to stop"; Tap 3 stops crossing and returns to home screen | [ ] |
| **Tap Accidental Timeout** | Tapping once or twice and pausing >800ms resets the counter and keeps flashing active | [ ] |
| **Screen Wake Lock** | Screen stays awake and does not dim while crossing is active | [ ] |
| **Offline Cache** | Loads instantly with no internet connection after first visit | [ ] |
| **Keyboard Shortcut** | Pressing **Spacebar** or **Esc** stops flashing on laptop | [ ] |
| **In-App Orientation Toggle** | Tapping the orientation icon in the header toggles between Portrait and Landscape states; persists in localStorage; switches icon and activates cyan glow in Landscape mode; forces wide-angle landscape strobe without OS rotation lock | [ ] |
| **Animated Pattern Previews** | Selector tiles display live CSS keyframe micro-animations: Police Strobe quad-flashes red then blue; Split Alternating flashes left-red then right-blue with divider; Full Screen Flip alternates solid colors; Wig-Wag alternates circular beacons; White Beacon pulses high-lumen flare | [ ] |
| **Session Settings Persistence** | App retains pattern, speed, preset/custom text, audio, vibration, brightness hint, and orientation settings across page refreshes and browser restarts via `crosssafe_settings_v1` | [ ] |
| **Option C Clean Viewport Strobe** | Tapping START triggers strobe immediately with zero Android OS security toasts or pop-ups; stopping strobe returns to dashboard cleanly with zero viewport flash | [ ] |
| **Automated Unit Tests** | `python tests/test_crosssafe.py` and `tests/runner.html` pass with 100% success rate and zero failures (15/15 tests) | [ ] |

