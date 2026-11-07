from io import BytesIO
from pathlib import Path
import importlib.util
import sys

UTIL = Path(__file__).resolve().parents[1] / "ui_v10_utils.py"
spec = importlib.util.spec_from_file_location("ui_v10_utils", UTIL)
ui = importlib.util.module_from_spec(spec)
sys.modules["ui_v10_utils"] = ui
spec.loader.exec_module(ui)


def test_probability_bars_and_top2():
    r = {"probabilities": {"metal": .62,"glass": .28,"paper": .10},"confidence": .62}
    assert ui.top_two(r)[0][0] == "metal"
    assert "Kim loại" in ui.probability_bars_html(r)
    assert 'width:62.0%' in ui.probability_bars_html(r)
    assert ui.decision_message(r)[0] == "ok"


def test_uncertainty_and_html_safety():
    r = {"probabilities":{"metal": .49,"glass": .44},"confidence": .49}
    assert ui.decision_message(r)[0] == "warning"
    assert "<script>" not in ui.safe_text("<script>")


def test_history_export_csv_excel_safe():
    r = {"label":"glass","label_vi":"Thủy tinh","confidence":.73,"probabilities":{"glass":.73,"metal":.27}}
    row = ui.record_prediction("=1+1.png", "SVM", r)
    content = ui.csv_export([row]).decode("utf-8-sig")
    assert "Thủy tinh" in content
    assert "'=1+1.png" in content


def test_metrics_missing_not_fabricated(tmp_path):
    assert ui.summarize_metrics(tmp_path / "missing.json") is None
    f = tmp_path / "m.json"
    f.write_text('{"macro_f1": 0.777,"accuracy":0.80}', encoding="utf-8")
    assert ui.summarize_metrics(f)["macro_f1"] == .777
