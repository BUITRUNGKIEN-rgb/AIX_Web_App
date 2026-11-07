"""V13 tests are pure; do not require Streamlit or trained checkpoints."""
from io import BytesIO
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]

def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / (name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

rec = module('recycling_advice')
mv = module('multiview_inference')


def test_recycle_groups_not_binary_by_image_alone():
    for label in ['metal', 'glass', 'paper', 'cardboard', 'plastic']:
        a = rec.assess_recycling(label)
        assert a['status'] == 'conditional'
        assert 'điểm thu gom' in a['explanation'] or 'địa phương' in a['explanation'] or 'nơi thu gom' in a['explanation']
    assert rec.assess_recycling('trash')['status'] == 'unknown'


def test_verified_clean_local_acceptance():
    a = rec.assess_recycling('metal', condition=rec.CONDITIONS[1], collection=rec.COLLECTION[1])
    assert a['status'] == 'yes'
    assert 'nếu' in a['answer'].lower()


def test_uncertainty_prevents_definitive_yes():
    a = rec.assess_recycling('metal',condition=rec.CONDITIONS[1],collection=rec.COLLECTION[1],prediction_uncertain=True)
    assert a['status'] == 'unknown'


def test_special_collection_overrides_positive():
    a = rec.assess_recycling('metal',condition=rec.CONDITIONS[1],collection=rec.COLLECTION[1],special=True)
    assert a['status'] == 'separate'


def test_dirty_and_local_rejected():
    assert rec.assess_recycling('paper', condition=rec.CONDITIONS[2])['status'] == 'conditional'
    assert rec.assess_recycling('glass', collection=rec.COLLECTION[2])['status'] == 'no_for_collection'


def test_two_angles_corrects_single_view_wrong_angle():
    # One view thinks glass; one high-quality view thinks metal; mean agrees metal.
    images = [
        {'probabilities': {'glass': .52, 'metal': .42, 'paper': .06}},
        {'probabilities': {'metal': .96, 'glass': .02, 'paper': .02}},
    ]
    outcome = mv.fuse_predictions(images, filenames=['a.jpg','b.jpg'])
    assert outcome['label'] == 'metal'
    assert round(sum(outcome['probabilities'].values()),6) == 1.0
    assert outcome['view_agreement'] == .5
    assert outcome['uncertain'] is True # conflict must not be hidden
    assert len(outcome['views']) == 2


def test_three_accurate_consistent_views():
    images = [{'probabilities':{'metal':.87,'glass':.13}},
              {'probabilities':{'metal':.76,'glass':.24}},
              {'probabilities':{'metal':.91,'glass':.09}}]
    result = mv.fuse_predictions(images)
    assert result['label'] == 'metal'
    assert result['view_agreement'] == 1.0
    assert not result['uncertain']


def test_disagreement_still_warns_even_if_fusion_confident():
    images = [{'probabilities':{'metal':.99,'glass':.01}},
              {'probabilities':{'metal':.99,'glass':.01}},
              {'probabilities':{'glass':.6,'metal':.4}},]
    res = mv.fuse_predictions(images)
    assert res['label'] == 'metal'
    assert res['view_agreement'] == 2/3
    assert res['uncertain']


def test_invalid_probs_and_file_counts():
    import pytest
    with pytest.raises(ValueError): mv.fuse_predictions([{'probabilities':{'metal':1}}])
    with pytest.raises(ValueError): mv.fuse_predictions([{'probabilities':{'metal':float('nan')}}]*2)
    with pytest.raises(ValueError): mv.fuse_predictions([{'probabilities':{'metal':0}}]*2)
    with pytest.raises(ValueError): mv.fuse_predictions([{'probabilities':{'metal':1}}]*7)


class Upload:
    def __init__(self,name,payload): self.name,self.payload=name,payload
    def getvalue(self):return self.payload


def test_dedup_uploads():
    files=[Upload('a.jpg',b'a'),Upload('same.jpg',b'a'),Upload('b.jpg',b'b')]
    unique, duplicates = mv.dedupe_files_by_contents(files)
    assert [x.name for x in unique]==['a.jpg','b.jpg']
    assert duplicates == ['same.jpg']


def test_exposure_hint():
    from PIL import Image
    assert 'tối' in mv.image_exposure_hint(Image.new('RGB',(100,100),(0,0,0)))
    assert 'sáng' in mv.image_exposure_hint(Image.new('RGB',(100,100),(255,255,255)))
    assert mv.image_exposure_hint(Image.new('RGB',(100,100),(110,110,110))) == ''


def test_app_has_recycling_and_multiview_integration():
    app=(ROOT/'app.py').read_text(encoding='utf-8')
    assert 'Nhận diện đa góc' in app
    assert 'assess_recycling' in app
    assert 'fuse_predictions' in app
    assert 'Tải ảnh từ máy' in app
    assert 'st.camera_input' in app
    assert 'prediction_uncertain' in app


def test_csv_mixed_rows_keep_all_columns():
    ui = module('ui_v10_utils')
    csv_bytes = ui.csv_export([{'anh':'bad.jpg', 'loi':'damaged'},
                               {'anh':'ok.jpg','tinh_trang_tai_che':'CÓ TIỀM NĂNG TÁI CHẾ'}])
    text = csv_bytes.decode('utf-8-sig')
    assert 'tinh_trang_tai_che' in text.splitlines()[0]
    assert 'CÓ TIỀM NĂNG' in text
