# CrossSafe 🚨
> Offline-First Pedestrian Road Crossing Hazard Strobe for iPhone & Android.

CrossSafe helps pedestrians cross dark, poorly lit, or high-speed roads safely by turning their mobile screen into an eye-catching, high-conspicuity emergency strobe flasher (alternating red/blue police cadence, split strobe, and amber caution).

Once loaded or saved, **it requires zero cellular data, zero Wi-Fi, and no app store download**.

---

## 🌟 Key Features

* **100% Offline Capability**: Runs completely without internet via Progressive Web App (PWA) caching and Service Workers.
* **Emergency Strobe Modes**:
  * **Police Strobe**: High-intensity quad-flash Red $\rightarrow$ quad-flash Blue (maximum human-eye conspicuity at distance).
  * **Split Alternating**: Left half Red / Right half Blue alternating with a vertical divider.
  * **Full Screen Flip**: Alternating solid Red and solid Blue across the entire display.
  * **Amber Hazard**: Pedestrian caution dual circular wig-wag strobe for universal road safety.
  * **White Beacon**: High-lumen pulsing pedestrian flashlight.
* **Animated Micro-Strobe Previews**: Intuitive live CSS-animated previews on the selector tiles showing real-time cadences (Police Strobe quad-burst, Split Alternating dual halves, Full Screen alternating flips, and Wig-Wag blinking circles) so users immediately recognize each mode.
* **In-App Screen Orientation Toggle**: One-tap toggle directly in the header to switch between Portrait and Landscape modes with zero reliance on cumbersome OS device orientation locks. Eliminates disruptive accidental screen rotation reloads when waving or moving your hand during crossings (includes hardware-accelerated 90° rotation fallback on iOS Safari).
* **Screen Wake Lock API**: Prevents your phone screen from dimming or sleeping while crossing.
* **Tactile Haptic Feedback**: Periodic subtle vibration pulses confirm the strobe is flashing while holding the screen faced towards oncoming cars.
* **Web Audio Alert**: Synthesized audio chirps alert drivers without downloading any sound files.
* **Text Overlay**: Optional large high-contrast **"CROSSING"**, **"STOP"**, or custom message badge.
* **Standalone Portable Edition**: Includes `crosssafe.html`—a single, zero-dependency file you can send via WhatsApp or AirDrop.

---

## 📁 Project Structure

```
road_cross_assist/
├── index.html            # Main PWA pedestrian dashboard
├── styles.css            # Dark UI & hardware-accelerated strobe styles
├── app.js                # Timing loop, Wake Lock, Audio synthesizer, Haptics
├── sw.js                 # Service Worker (100% offline cache-first strategy)
├── manifest.webmanifest  # PWA manifest for "Add to Home Screen"
├── icons/                # App icons (SVG, 192x192 PNG, 512x512 PNG)
├── crosssafe.html        # Standalone single-file edition (WhatsApp/AirDrop ready)
├── TESTING_GUIDE.md      # Step-by-step testing instructions for your laptop & phone
├── implementation_plan.md# Design specifications & architecture document
└── README.md             # Project overview & GitHub Pages hosting guide
```

---

## 💻 How to Test Locally on Your Laptop

### 1. Test the Standalone Version (Zero Setup)
Simply double-click `crosssafe.html` in your file explorer to open it in Chrome, Edge, or Safari. Press **Spacebar** or click **"START"** to test.

### 2. Test the Full PWA (Simulate Phone & Offline Mode)
1. In this directory, run:
   ```powershell
   python -m http.server 8080
   ```
2. Open `http://localhost:8080` in Chrome or Edge.
3. Press `F12` and click the **Device Toolbar icon** (`Ctrl + Shift + M`) to simulate an iPhone 14 or Galaxy S20.
4. Go to **Application** $\rightarrow$ **Service Workers** $\rightarrow$ check **Offline**. Refresh the page to see it run completely offline!

### 3. Run Automated Unit Tests (Zero Bloat)
Before committing or deploying, run the instant unit testing suite locally:
* **Command Line (Python)**:
  ```powershell
  python tests/test_crosssafe.py
  ```
* **In-Browser Visual Test Runner**:
  Double-click `tests/runner.html` in File Explorer or navigate to `http://localhost:8080/tests/runner.html` to run 15+ interactive behavioral tests directly in Chrome/Edge with live visual reporting.
* **GitHub Actions CI**: Every `git push` automatically runs tests in the cloud via `.github/workflows/test.yml` before deploying to GitHub Pages.

*(See [TESTING_GUIDE.md](TESTING_GUIDE.md) for full details)*

---

## 🚀 How to Host on GitHub Pages (Free, 2 Minutes)

To share this app with others via a link or QR code:

1. Create a new public repository on GitHub (e.g., `cross-safe`).
2. Push this folder's files to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CrossSafe PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cross-safe.git
   git push -u origin main
   ```
3. On GitHub, go to your repository **Settings** $\rightarrow$ **Pages** (under "Code and automation" on the left).
4. Under **Build and deployment**:
   * **Source**: `Deploy from a branch`
   * **Branch**: `main` / `/ (root)`
   * Click **Save**.
5. Within 60 seconds, GitHub will give you a live HTTPS link:
   `https://<your-username>.github.io/cross-safe/`

---

## 📱 How Users Save It on Their Phone

When anyone opens your link:
* **iPhone (Safari)**: Tap the **Share** button $\rightarrow$ tap **"Add to Home Screen"**.
* **Android (Chrome)**: Tap the three dots $\rightarrow$ tap **"Install app"** or **"Add to Home screen"**.

Once added, it appears as an app icon with a custom shield logo and works forever with **zero mobile data or Wi-Fi**.

---

## ⚠️ Pedestrian Safety Notice

- **Always verify traffic has stopped before stepping onto the roadway.** A flashing light increases visibility, but drivers may still be distracted or speeding.
- Hold your phone firmly at chest level with the screen facing toward oncoming vehicles.
- In jurisdictions where red and blue lights are restricted to authorized emergency vehicles, pedestrians can switch to **Amber Hazard** or **White Beacon** mode.
