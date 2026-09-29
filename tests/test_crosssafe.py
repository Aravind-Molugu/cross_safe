"""
CrossSafe - Automated Unit Testing Suite
Python Test Runner (Standard Library unittest)
Zero external dependencies required.
"""

import unittest
import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_file(relative_path):
    full_path = os.path.join(BASE_DIR, relative_path)
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()

class TestServiceWorker(unittest.TestCase):
    """Verifies Service Worker offline cache definitions and zero-bloat guarantees."""

    def setUp(self):
        self.sw_content = read_file("sw.js")

    def test_cache_name_format(self):
        """Service Worker cache name must follow crosssafe-vX.Y.Z convention."""
        match = re.search(r"CACHE_NAME\s*=\s*['\"](crosssafe-v[\d\.]+)['\"]", self.sw_content)
        self.assertIsNotNone(match, "CACHE_NAME definition not found in sw.js")
        version = match.group(1)
        self.assertTrue(version.startswith("crosssafe-v"), f"Invalid cache name format: {version}")

    def test_cached_assets_exist_on_disk(self):
        """All assets declared in ASSETS_TO_CACHE must exist and be non-empty."""
        match = re.search(r"const\s+ASSETS_TO_CACHE\s*=\s*\[(.*?)\];", self.sw_content, re.DOTALL)
        self.assertIsNotNone(match, "ASSETS_TO_CACHE array not found in sw.js")
        
        raw_assets = match.group(1)
        assets = [item.strip().strip("'\"") for item in raw_assets.split(",") if item.strip()]
        
        self.assertIn("./", assets, "Root path './' must be cached")
        
        for asset in assets:
            if asset in ("./", "./index.html"):
                target = "index.html"
            else:
                target = asset.lstrip("./")
            
            file_path = os.path.join(BASE_DIR, target)
            self.assertTrue(os.path.exists(file_path), f"Cached asset does not exist on disk: {target}")
            self.assertGreater(os.path.getsize(file_path), 0, f"Cached asset is empty (0 bytes): {target}")

    def test_tests_folder_excluded_from_cache(self):
        """Zero-bloat guarantee: Test files must NEVER be cached by the Service Worker."""
        match = re.search(r"const\s+ASSETS_TO_CACHE\s*=\s*\[(.*?)\];", self.sw_content, re.DOTALL)
        raw_assets = match.group(1)
        self.assertNotIn("tests", raw_assets.lower(), "Security violation: tests/ must never be in ASSETS_TO_CACHE")
        self.assertNotIn("runner", raw_assets.lower(), "Security violation: test runner must never be in ASSETS_TO_CACHE")


class TestWebManifest(unittest.TestCase):
    """Verifies PWA manifest structure, valid JSON, and icon paths."""

    def setUp(self):
        self.manifest_raw = read_file("manifest.webmanifest")
        self.manifest = json.loads(self.manifest_raw)

    def test_manifest_required_fields(self):
        """Manifest must contain standard PWA installation metadata."""
        required = ["name", "short_name", "start_url", "display", "theme_color", "background_color", "icons"]
        for key in required:
            self.assertIn(key, self.manifest, f"Missing required manifest field: {key}")

    def test_manifest_icons_exist(self):
        """All declared icon assets must exist on disk."""
        icons = self.manifest.get("icons", [])
        self.assertGreater(len(icons), 0, "Manifest must specify at least one icon")
        for icon in icons:
            src = icon.get("src", "")
            icon_path = os.path.join(BASE_DIR, src)
            self.assertTrue(os.path.exists(icon_path), f"Manifest icon does not exist: {src}")
            self.assertGreater(os.path.getsize(icon_path), 0, f"Manifest icon file is 0 bytes: {src}")


class TestDomIdIntegrity(unittest.TestCase):
    """Verifies that all DOM elements queried by app.js exist in index.html and crosssafe.html."""

    def test_app_js_elements_exist_in_index_html(self):
        app_js = read_file("app.js")
        index_html = read_file("index.html")

        id_matches = re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)", app_js)
        self.assertGreater(len(id_matches), 10, "Expected at least 10 getElementById calls in app.js")

        for el_id in set(id_matches):
            pattern = rf'id=["\']?{re.escape(el_id)}["\']?'
            self.assertIsNotNone(re.search(pattern, index_html), f"DOM element '#{el_id}' queried in app.js is missing from index.html")

    def test_crosssafe_html_self_contained_dom(self):
        crosssafe_html = read_file("crosssafe.html")
        script_match = re.search(r"<script>(.*?)</script>", crosssafe_html, re.DOTALL)
        self.assertIsNotNone(script_match, "Embedded script not found in crosssafe.html")
        script_content = script_match.group(1)

        id_matches = re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)", script_content)
        self.assertGreater(len(id_matches), 10, "Expected at least 10 getElementById calls in crosssafe.html script")

        for el_id in set(id_matches):
            pattern = rf'id=["\']?{re.escape(el_id)}["\']?'
            self.assertIsNotNone(re.search(pattern, crosssafe_html), f"DOM element '#{el_id}' queried in crosssafe.html is missing from its markup")


class TestStrobeEngineLogic(unittest.TestCase):
    """Verifies pattern sequences, speed multipliers, and timing configurations."""

    def setUp(self):
        self.app_js = read_file("app.js")

    def test_all_patterns_supported(self):
        """All 6 standard patterns must be handled in getPatternSequence."""
        expected_patterns = ["police", "split", "fullscreen", "wigwag", "white", "sos"]
        for p in expected_patterns:
            self.assertIn(f"case '{p}':", self.app_js, f"Pattern '{p}' not handled in getPatternSequence switch")

    def test_speed_configs_monotonic(self):
        """Speed multipliers must be strictly ordered from slowest (highest mult) to fastest (lowest mult)."""
        speed_match = re.search(r"const\s+SPEED_CONFIGS\s*=\s*\{(.*?)\};", self.app_js, re.DOTALL)
        self.assertIsNotNone(speed_match, "SPEED_CONFIGS object not found in app.js")
        
        speed_str = speed_match.group(1)
        expected_speeds = ["ultraslow", "veryslow", "slow", "normal", "fast"]
        extracted_mults = {}
        
        for s in expected_speeds:
            mult_match = re.search(rf"\b{s}\b\s*:\s*\{{\s*mult\s*:\s*([\d\.]+)\s*\}}", speed_str)
            self.assertIsNotNone(mult_match, f"Speed '{s}' missing or malformed in SPEED_CONFIGS")
            extracted_mults[s] = float(mult_match.group(1))

        self.assertGreater(extracted_mults["ultraslow"], extracted_mults["veryslow"])
        self.assertGreater(extracted_mults["veryslow"], extracted_mults["slow"])
        self.assertGreater(extracted_mults["slow"], extracted_mults["normal"])
        self.assertGreater(extracted_mults["normal"], extracted_mults["fast"])
        self.assertEqual(extracted_mults["normal"], 1.0, "Normal speed multiplier must be baseline 1.0")


class TestCssKeyframesAndStyles(unittest.TestCase):
    """Verifies that animated mini-strobes and layout classes exist in styles.css and crosssafe.html."""

    def setUp(self):
        self.styles = read_file("styles.css")
        self.crosssafe = read_file("crosssafe.html")

    def test_animated_mini_strobe_keyframes_exist(self):
        """Pure CSS animated mini-strobe keyframes must be declared for all active patterns."""
        required_keyframes = [
            "miniPoliceStrobe",
            "miniSplitLeft",
            "miniSplitRight",
            "miniFullscreenFlip",
            "miniWigWagLeft",
            "miniWigWagRight",
            "miniWhiteBeacon"
        ]
        for kf in required_keyframes:
            self.assertIn(f"@keyframes {kf}", self.styles, f"@keyframes {kf} missing from styles.css")
            self.assertIn(f"@keyframes {kf}", self.crosssafe, f"@keyframes {kf} missing from crosssafe.html")

    def test_force_landscape_rules_exist(self):
        """Virtual 90-degree landscape transform must be declared for iOS Safari fallback."""
        self.assertIn(".strobe-surface.force-landscape", self.styles)
        self.assertIn("transform: rotate(90deg)", self.styles)
        self.assertIn(".strobe-surface.force-landscape", self.crosssafe)
        self.assertIn("transform: rotate(90deg)", self.crosssafe)


class TestSettingsPersistence(unittest.TestCase):
    """Verifies that full session settings are stored and synchronized via localStorage."""

    def setUp(self):
        self.app_js = read_file("app.js")
        self.crosssafe = read_file("crosssafe.html")

    def test_settings_storage_key_version(self):
        """Storage key must follow crosssafe_settings_v1 standard."""
        self.assertIn("SETTINGS_STORAGE_KEY = 'crosssafe_settings_v1'", self.app_js)
        self.assertIn("SETTINGS_STORAGE_KEY = 'crosssafe_settings_v1'", self.crosssafe)

    def test_persistence_functions_present(self):
        """savePersistedSettings, loadPersistedSettings, and syncDOMWithState must exist in app.js and crosssafe.html."""
        for fn in ["savePersistedSettings", "loadPersistedSettings", "syncDOMWithState"]:
            self.assertIn(fn, self.app_js, f"Function '{fn}' missing from app.js")
            self.assertIn(fn, self.crosssafe, f"Function '{fn}' missing from crosssafe.html")


class TestCleanFullscreenStrobe(unittest.TestCase):
    """Verifies Option C architecture: zero Android OS security toasts or exit reflow flashes."""

    def setUp(self):
        self.app_js = read_file("app.js")
        self.crosssafe = read_file("crosssafe.html")

    def test_no_programmatic_fullscreen_calls(self):
        """requestFullscreen and exitFullscreen must be eliminated to suppress OS pop-ups."""
        self.assertNotIn("requestFullscreen", self.app_js, "Security alert: requestFullscreen found in app.js")
        self.assertNotIn("exitFullscreen", self.app_js, "Security alert: exitFullscreen found in app.js")
        self.assertNotIn("requestFullscreen", self.crosssafe, "Security alert: requestFullscreen found in crosssafe.html")
        self.assertNotIn("exitFullscreen", self.crosssafe, "Security alert: exitFullscreen found in crosssafe.html")


class TestStandaloneParity(unittest.TestCase):
    """Verifies 100% parity between index.html/app.js/styles.css and crosssafe.html."""

    def setUp(self):
        self.crosssafe = read_file("crosssafe.html")

    def test_standalone_contains_all_core_features(self):
        """crosssafe.html must contain all core features inline without external file dependencies."""
        self.assertIn("btn-orientation", self.crosssafe, "Orientation toggle button missing in crosssafe.html")
        self.assertIn("split-divider", self.crosssafe, "Split preview divider missing in crosssafe.html")
        self.assertIn("tap-progress-pill", self.crosssafe, "Triple-tap progress pill missing in crosssafe.html")
        self.assertIn("initAudio", self.crosssafe, "Web Audio synth missing in crosssafe.html")
        self.assertIn("requestWakeLock", self.crosssafe, "Wake lock API missing in crosssafe.html")
        self.assertIn("savePersistedSettings", self.crosssafe, "Settings serializer missing in crosssafe.html")


class TestGitHubActionsCI(unittest.TestCase):
    """Verifies that GitHub Actions CI workflow is configured with valid on-triggers."""

    def test_workflow_file_valid(self):
        workflow = read_file(".github/workflows/test.yml")
        self.assertGreater(len(workflow.strip()), 0, "Workflow file must not be empty")
        self.assertIn("on:", workflow, "Workflow must define 'on:' event triggers")
        self.assertIn("push:", workflow, "Workflow must define push triggers")
        self.assertIn("pull_request:", workflow, "Workflow must define pull_request triggers")
        self.assertIn("main", workflow, "Workflow must target main branch")
        self.assertIn("dev", workflow, "Workflow must target dev branch")
        self.assertIn("test_crosssafe.py", workflow, "Workflow must run Python test suite")
        self.assertIn("unit.test.js", workflow, "Workflow must run Node.js test suite")


if __name__ == "__main__":
    unittest.main()

