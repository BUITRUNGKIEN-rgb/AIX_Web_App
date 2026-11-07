from pathlib import Path
from PIL import Image
import torch
import tempfile

from cnn_utils import LABELS, ARCHES, input_spec, build_model, save_checkpoint, load_checkpoint, predict_image
from inference_bridge import discover_models


def test_v9_architectures():
    assert 'efficientnet_b2' in ARCHES
    assert 'convnext_tiny' in ARCHES
    assert input_spec('efficientnet_b2')[0] == 288
    assert input_spec('convnext_tiny')[0] == 224


def test_model_discovery(tmp_path):
    (tmp_path/'ai02_efficientnet_b2.pth').write_bytes(b'dummy')
    (tmp_path/'improved.joblib').write_bytes(b'dummy')
    result = discover_models(tmp_path)
    assert any('EfficientNet-B2' in x['name'] for x in result)
    assert any('SVM' in x['name'] for x in result)
    assert not any('Ensemble' in x['name'] for x in result)


def test_checkpoint_roundtrip_and_tta(tmp_path):
    torch.set_num_threads(2)
    model=build_model('efficientnet_b2', pretrained=False)
    outfile=tmp_path/'ai02_efficientnet_b2.pth'
    save_checkpoint(outfile, model, 'efficientnet_b2', temperature=1.4,
                    tta='hflip', training_mode='TEST_UNIT_ONLY')
    loaded, temperature, payload = load_checkpoint(str(outfile))
    assert temperature == 1.4
    assert payload['metadata']['tta'] == 'hflip'
    img=Image.new('RGB',(85,79),color='#cc7533')
    pred=predict_image(img,[outfile])
    assert pred['label'] in LABELS
    assert pred['tta_used'] == [True]
    assert abs(sum(pred['probabilities'].values())-1) < 1e-5
    assert pred['confidence'] <= 1.0


def test_dedupe_cross_class(tmp_path):
    from train_cnn import collect_images
    for label in LABELS:
        p=tmp_path/label
        p.mkdir()
        Image.new('RGB',(32,32), color=(list(LABELS).index(label)*30,10,20)).save(p/'one.png')
    # Conflicting exact duplicate across different class folders MUST NOT train.
    Image.new('RGB',(32,32),color=(0,10,20)).save(tmp_path/'glass'/'duplicate.png')
    items, dup, invalid=collect_images(tmp_path)
    assert all(item[2] != 'cardboard/one.png' for item in items)
    assert any('Xung đột nhãn' in str(e) for _,e in invalid)
