"""Optional checks: run from parent AI02 project with trained joblibs.
python tests/test_web_bridge.py path/to/original-ai02
"""
import argparse
import json
import sys
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('project',type=Path)
    args=parser.parse_args()
    project=args.project.resolve()
    sys.path.insert(0,str(project))
    namespace={'__name__':'web_bridge_test'}
    exec((WEB/'python_bridge.py').read_text('utf-8'),namespace)
    from src.features import LABELS,image_features
    from src.predict import predict_image
    data=project/'data/dataset-resized'
    images=list(data.rglob('*.jpg'))+list(data.rglob('*.png'))
    assert images,'Cannot find dataset image for parity test'
    for slot in ('baseline','improved'):
        model=project/'model'/f'{slot}.joblib'
        assert model.is_file(),f'Missing {model}'
        namespace['load_model_file'](str(model),slot)
        for image in images[:3]:
            expected=predict_image(model,image)
            got=json.loads(namespace['predict_image_path'](str(image),slot))
            assert got['label']==expected['label']
            assert abs(got['confidence']-expected['confidence'])<1e-10
            assert set(got['probabilities'])==set(LABELS)
            assert abs(sum(got['probabilities'].values())-1)<1e-6
    print('PASS: web Python bridge and original Streamlit inference are identical.')

if __name__=='__main__':main()
