import sys, json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
voice, lang, speed, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
lines = json.load(open("lines.json"))
import os; os.makedirs(out, exist_ok=True)
res = {}
for key, text in lines.items():
    s, sr = k.create(text, voice=voice, speed=speed, lang=lang)
    sf.write(f"{out}/{key}.wav", s, sr)
    res[key] = round(len(s)/sr, 2)
print(json.dumps(res))
