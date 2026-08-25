#!/usr/bin/env python3
"""Tests for export-spec.py script.

Validates that contract-spec.json:
  - Is deterministic (same input produces same output)
  - Successfully parses functions, structs, enums, errors, and events
  - Produces valid machine-readable JSON matching the schema
"""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
EXPORT_SCRIPT = SCRIPT_DIR / "export-spec.py"


class TestExportSpec(unittest.TestCase):
    def test_export_spec_generation(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            out_dir = Path(tmp_dir)
            result = subprocess.run(
                [
                    sys.executable,
                    str(EXPORT_SCRIPT),
                    "--project-dir",
                    str(PROJECT_DIR),
                    "--output-dir",
                    str(out_dir),
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            self.assertEqual(result.returncode, 0)

            spec_file = out_dir / "aid_escrow.spec.json"
            self.assertTrue(spec_file.is_file())

            data = json.loads(spec_file.read_text(encoding="utf-8"))
            self.assertEqual(data["name"], "aid_escrow")
            self.assertIn("enums", data)
            self.assertIn("structs", data)
            self.assertIn("functions", data)
            self.assertIn("errors", data)
            self.assertIn("events", data)

            # Check specific extracted types
            self.assertIn("PackageStatus", data["enums"])
            self.assertIn("ClaimStatus", data["enums"])
            self.assertIn("Package", data["structs"])
            self.assertIn("create_package", data["functions"])

            # Verify Map<Symbol, String> generic field is not truncated at comma
            package_fields = {f["name"]: f["type"] for f in data["structs"]["Package"]["fields"]}
            self.assertEqual(package_fields.get("metadata"), "Map<Symbol, String>")

            # Verify tuple/generic return type parsing
            self.assertEqual(
                data["functions"]["get_authorization_info"]["return_type"],
                "(bool, Option<Symbol>)",
            )

    def test_export_spec_determinism(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            out_dir = Path(tmp_dir)
            
            subprocess.run(
                [
                    sys.executable,
                    str(EXPORT_SCRIPT),
                    "--project-dir",
                    str(PROJECT_DIR),
                    "--output-dir",
                    str(out_dir),
                ],
                check=True,
            )
            content1 = (out_dir / "aid_escrow.spec.json").read_text(encoding="utf-8")

            subprocess.run(
                [
                    sys.executable,
                    str(EXPORT_SCRIPT),
                    "--project-dir",
                    str(PROJECT_DIR),
                    "--output-dir",
                    str(out_dir),
                ],
                check=True,
            )
            content2 = (out_dir / "aid_escrow.spec.json").read_text(encoding="utf-8")

            self.assertEqual(content1, content2)


if __name__ == "__main__":
    unittest.main()
