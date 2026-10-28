"""Rebuild js/data.js from the JSON files in data/ so index.html works when opened from disk."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = ["pdd_inputs", "feedstock", "benchmarks", "deals", "prices", "ramp"]

data = {n: json.loads((ROOT / "data" / f"{n}.json").read_text(encoding="utf8")) for n in NAMES}
out = "// Generated from the JSON files in /data. Edit those, then run: python tools/build_data.py\n"
out += "window.IKH_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
(ROOT / "js" / "data.js").write_text(out, encoding="utf8")
print("Wrote js/data.js")
