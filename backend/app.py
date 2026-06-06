import os
import sys

# Limit TensorFlow threading to avoid CPU saturation and timeouts on shared virtual cores
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import uuid
import threading
import numpy as np
import librosa
import soundfile as sf
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

def preprocess_audio_file(file_path):
    """
    Loads a WAV file, applies an 80Hz high-pass filter to remove low-frequency hum/noise,
    normalizes peak amplitude, trims silence, and pads with 0.5s of silence, then writes it back.
    """
    from scipy.signal import butter, filtfilt
    try:
        y, sr = librosa.load(file_path, sr=None)
        
        # 1. Apply High-pass filter at 80Hz (removes low-frequency microphone/room hum)
        cutoff = 80.0
        nyq = 0.5 * sr
        normal_cutoff = cutoff / nyq
        b, a = butter(5, normal_cutoff, btype='high', analog=False)
        y = filtfilt(b, a, y)
        
        # 2. Normalize amplitude (peak to 1.0)
        max_val = np.max(np.abs(y))
        if max_val > 0:
            y = y / max_val
            
        # 3. Trim silence (top_db=30 is safer than 25, preserving quiet vocal endings)
        y_trimmed, _ = librosa.effects.trim(y, top_db=30)
        if len(y_trimmed) < int(0.1 * sr):
            y_trimmed = y
            
        # 4. Add 0.5s silence padding (to match dataset format and prevent signal cuts)
        pad_len = int(0.5 * sr)
        y_padded = np.pad(y_trimmed, pad_len, mode='constant')
        
        # 5. Save the cleaned audio back to the same file
        sf.write(file_path, y_padded, sr)
        print(f"[+] Preprocessed and updated audio file (filtered & normalized): {file_path}")
    except Exception as e:
        print(f"[!] Error preprocessing audio file {file_path}: {e}")


# ─── Path Setup ──────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
EMOTION_DIR = os.path.normpath(os.path.join(BASE_DIR, '..', 'emotion-recognition-using-speech-master'))
GENDER_DIR  = os.path.normpath(os.path.join(BASE_DIR, '..', 'gender-recognition-by-voice-master'))

# ─── Flask App ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins="*")

# Use /tmp on Linux/Render to bypass AppArmor sandbox constraints for libsndfile, fallback to local uploads on Windows
if os.name == 'nt':
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
else:
    UPLOAD_FOLDER = '/tmp'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024

# ─── Module Name Conflicts ────────────────────────────────────────────────────
# Both projects have: utils.py, data_extractor.py, create_csv.py, etc.
# We must isolate them using sys.modules manipulation.

EMOTION_MODULES = [
    'utils', 'data_extractor', 'create_csv', 'convert_wavs',
    'emotion_recognition', 'deep_emotion_recognition', 'parameters',
]
GENDER_MODULES = [
    # Gender project only has utils.py and test.py / train.py
    # We load it with a unique alias so there's no conflict
]

# ─── Global Model Handles ─────────────────────────────────────────────────────
emotion_recognizer = None
gender_model       = None
gender_extract_fn  = None
models_ready       = False
models_loading     = False
load_error         = None


def _with_path(new_dir, func):
    """
    Execute func with new_dir inserted at the FRONT of sys.path,
    then restore sys.path after. Does NOT strip site-packages.
    """
    old_cwd = os.getcwd()
    # Remove new_dir if already present to avoid duplicates, then put it first
    clean_path = [p for p in sys.path if p != new_dir]
    sys.path[:] = [new_dir] + clean_path
    os.chdir(new_dir)
    try:
        return func()
    finally:
        sys.path[:] = clean_path
        os.chdir(old_cwd)


def _load_emotion_model():
    # Flush any conflicting modules so Python re-imports from EMOTION_DIR
    for name in EMOTION_MODULES:
        sys.modules.pop(name, None)

    def _inner():
        from sklearn.ensemble import BaggingClassifier
        from emotion_recognition import EmotionRecognizer
        rec = EmotionRecognizer(
            BaggingClassifier(),
            emotions=['sad', 'neutral', 'happy'],
            balance=True,
            override_csv=False,
            verbose=0
        )

        rec.train(verbose=0)
        return rec

    return _with_path(EMOTION_DIR, _inner)


def _load_gender_model():
    import importlib.util as ilu

    # Load gender utils under a private name so it never touches 'utils' in sys.modules
    spec = ilu.spec_from_file_location(
        "_gender_utils_private",
        os.path.join(GENDER_DIR, "utils.py")
    )
    gu = ilu.module_from_spec(spec)
    spec.loader.exec_module(gu)
    model = gu.create_model()
    model.load_weights(os.path.join(GENDER_DIR, 'results', 'model.h5'))

    # Define extract_feature inline (same logic as test.py but without pyaudio import)
    import librosa as _librosa
    import numpy as _np

    def extract_feature(file_name, **kwargs):
        mfcc     = kwargs.get("mfcc")
        chroma   = kwargs.get("chroma")
        mel      = kwargs.get("mel")
        contrast = kwargs.get("contrast")
        tonnetz  = kwargs.get("tonnetz")
        X, sample_rate = _librosa.core.load(file_name)
        if chroma or contrast:
            stft = _np.abs(_librosa.stft(X))
        result = _np.array([])
        if mfcc:
            mfccs = _np.mean(_librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
            result = _np.hstack((result, mfccs))
        if chroma:
            chroma_ = _np.mean(_librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
            result = _np.hstack((result, chroma_))
        if mel:
            mel_ = _np.mean(_librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
            result = _np.hstack((result, mel_))
        if contrast:
            contrast_ = _np.mean(_librosa.feature.spectral_contrast(S=stft, sr=sample_rate).T, axis=0)
            result = _np.hstack((result, contrast_))
        if tonnetz:
            tonnetz_ = _np.mean(_librosa.feature.tonnetz(y=_librosa.effects.harmonic(X), sr=sample_rate).T, axis=0)
            result = _np.hstack((result, tonnetz_))
        return result

    return model, extract_feature


def load_models():
    global emotion_recognizer, gender_model, gender_extract_fn
    global models_ready, models_loading, load_error

    models_loading = True
    try:
        print("[*] Loading Emotion Recognition model ...")
        emotion_recognizer = _load_emotion_model()
        print("[+] Emotion model loaded & trained.")

        print("[*] Loading Gender Recognition model ...")
        gender_model, gender_extract_fn = _load_gender_model()
        print("[+] Gender model loaded.")

        # Run warmup prediction to avoid timeout on first request
        try:
            print("[*] Warming up Gender model ...")
            dummy_features = np.zeros((1, 128))
            gender_model.predict(dummy_features, verbose=0)
            print("[+] Gender model warmed up.")
        except Exception as we:
            print(f"[!] Warning: Failed to warm up gender model: {we}")

        models_ready   = True
        models_loading = False
        print("[+] All models ready!")


    except Exception as e:
        import traceback
        load_error     = str(e)
        models_loading = False
        print(f"[!] Error loading models: {e}")
        traceback.print_exc()


load_models()


# ─── Helpers ─────────────────────────────────────────────────────────────────
EMOTION_EMOJIS = {
    'neutral': '😐', 'calm': '😌', 'happy': '😄', 'sad': '😢',
    'angry': '😡', 'fear': '😨', 'disgust': '🤢', 'ps': '😮', 'boredom': '😴'
}
EMOTION_COLORS = {
    'neutral': '#94a3b8', 'calm': '#67e8f9', 'happy': '#fde68a',
    'sad': '#93c5fd', 'angry': '#f87171', 'fear': '#c084fc',
    'disgust': '#4ade80', 'ps': '#fb923c', 'boredom': '#a78bfa'
}


def save_upload(file) -> str:
    filename = secure_filename(f"{uuid.uuid4().hex}.wav")
    path     = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)
    return path


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'models_ready':   models_ready,
        'models_loading': models_loading,
        'error':          load_error
    })


def _do_predict_emotion(path):
    old_cwd = os.getcwd()
    os.chdir(EMOTION_DIR)
    try:
        proba   = {}
        try:
            proba = emotion_recognizer.predict_proba(path)
            proba = {k: round(float(v) * 100, 1) for k, v in proba.items()}
            emotion = max(proba, key=proba.get)
        except Exception:
            emotion = emotion_recognizer.predict(path)
            proba = {emotion: 100.0}
        return emotion, proba
    finally:
        os.chdir(old_cwd)


def _do_predict_gender(path):
    features    = gender_extract_fn(path, mel=True).reshape(1, -1)
    male_prob   = float(gender_model.predict(features)[0][0])
    female_prob = 1.0 - male_prob
    gender      = 'male' if male_prob > female_prob else 'female'
    return gender, male_prob, female_prob


@app.route('/api/predict/emotion', methods=['POST'])
def predict_emotion():
    if not models_ready:
        return jsonify({'error': 'Models not loaded yet.', 'loading': True}), 503
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    path = save_upload(request.files['audio'])
    try:
        preprocess_audio_file(path)
        emotion, proba = _do_predict_emotion(path)
        return jsonify({
            'emotion': emotion, 'emoji': EMOTION_EMOJIS.get(emotion, '🎤'),
            'color': EMOTION_COLORS.get(emotion, '#a78bfa'), 'probabilities': proba
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(path)
        except: pass


@app.route('/api/predict/gender', methods=['POST'])
def predict_gender():
    if not models_ready:
        return jsonify({'error': 'Models not loaded yet.', 'loading': True}), 503
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    path = save_upload(request.files['audio'])
    try:
        preprocess_audio_file(path)
        gender, mp, fp = _do_predict_gender(path)
        return jsonify({
            'gender': gender, 'emoji': '👨' if gender == 'male' else '👩',
            'male_probability': round(mp * 100, 2), 'female_probability': round(fp * 100, 2)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(path)
        except: pass


@app.route('/api/predict/both', methods=['POST'])
def predict_both():
    if not models_ready:
        return jsonify({'error': 'Models not loaded yet.', 'loading': True}), 503
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    path = save_upload(request.files['audio'])
    try:
        preprocess_audio_file(path)
        
        # Save a debug copy to inspect the audio characteristics
        try:
            import shutil
            shutil.copyfile(path, os.path.join(UPLOAD_FOLDER, 'debug_audio.wav'))
            print("[+] Saved a copy to debug_audio.wav for analysis.")
        except Exception as ex:
            print(f"[!] Failed to save debug copy: {ex}")
            
        emotion, proba      = _do_predict_emotion(path)
        gender, mp, fp      = _do_predict_gender(path)
        return jsonify({
            'emotion': {
                'label': emotion, 'emoji': EMOTION_EMOJIS.get(emotion, '🎤'),
                'color': EMOTION_COLORS.get(emotion, '#a78bfa'), 'probabilities': proba
            },
            'gender': {
                'label': gender, 'emoji': '👨' if gender == 'male' else '👩',
                'male_probability': round(mp * 100, 2), 'female_probability': round(fp * 100, 2)
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(path)
        except: pass


@app.route('/api/diag', methods=['POST'])
def diag():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    path = save_upload(request.files['audio'])
    info = {}
    try:
        import os
        info['file_exists'] = os.path.exists(path)
        info['file_size'] = os.path.getsize(path) if os.path.exists(path) else -1

        import soundfile as sf
        info['soundfile_version'] = sf.__version__
        try:
            with sf.SoundFile(path) as f:
                info['sf_read_success'] = True
                info['sf_samplerate'] = f.samplerate
                info['sf_channels'] = f.channels
                info['sf_format'] = f.format
                info['sf_subtype'] = f.subtype
        except Exception as e:
            import traceback
            info['sf_read_success'] = False
            info['sf_read_error'] = str(e)
            info['sf_read_traceback'] = traceback.format_exc()
            
        try:
            import librosa
            y, sr = librosa.load(path, sr=None)
            info['librosa_success'] = True
            info['librosa_sr'] = int(sr)
            info['librosa_shape'] = list(y.shape)
        except Exception as e:
            import traceback
            info['librosa_success'] = False
            info['librosa_error'] = str(e)
            info['librosa_traceback'] = traceback.format_exc()
            
        return jsonify(info)
    finally:
        try: os.remove(path)
        except: pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port, threaded=True)

