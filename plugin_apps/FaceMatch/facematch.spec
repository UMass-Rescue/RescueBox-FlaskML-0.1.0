# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

from PyInstaller.utils.hooks import collect_data_files
import ultralytics 
ultra_files = collect_data_files('ultralytics')

runtime_venvdir=os.environ['VIRTUAL_ENV'] + "\\Lib\\site-packages"
os.environ['MATPLOTLIBDATA'] = os.environ['VIRTUAL_ENV'] + "\\Lib\\site-packages\\matplotlib\\mpl-data"



# get dependent binaries : runtime_venvdir + whisper\assets\mel_filters.npz

hiddenimports = ['flask-ml', 'deepface', 'dlib', 'matplotlib', 'ultralytics', 'tensorflow.python.keras.backend']
hiddenimports += ['tensorflow.python.keras.layers.embeddings']

#hiddenimports += collect_submodules('src.facematch.utils')

data_files=[('.\\app-info.md', '.'), ('.\\resources', '.\\resources'),
            ('src\\facematch\\config\\model_config.json', 'config'),
            ('src\\facematch\\config\\db_config.json', 'config'),
            ('.\\fontlist-v390.json', '.'), ('.\\keras.json', '.')]

data_files += ultra_files

a = Analysis(
    ['src\\facematch\\face_match_server.py'],
    pathex=['.','src\\facematch'],
    binaries=[('.deepface\\weights\\arcface_weights.h5', '.deepface\\weights'),
              ('.deepface\\weights\\yolov8n-face.pt', '.deepface\\weights') ],
    datas= data_files,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='facematch',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='facematch')