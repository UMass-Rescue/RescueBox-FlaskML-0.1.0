rem make a EXE using pyinstaller

rem run pipenv install and pipenv shell

rem pip install pyinstaller

rem make sure server.py is in top level folder and no relative imports

rem get the virtualenv path and add the site-packages to --paths

rem from audio-transcription\audio_transcription folder

pyinstaller --onefile --paths . --add-data "C:\Users\foth2\.virtualenvs\audio-transcription-fLgGXuUP\Lib\site-packages\whisper;whisper/"  --paths=C:\Users\foth2\.virtualenvs\audio-transcription-fLgGXuUP\Lib\site-packages --add-data app-info.md;. --hidden-import flask_ml --collect-submodules ml.model --name audio server.py

rem model.py needs ffmpeg.exe binary download to this, audio-transcription\audio_transcription folder 

rem whisper imports assets mel_filters.npz , this has to be picked up by --add-data

rem note about --add-data app-info.md;.

rem destination file or files:
rem destination folder which will contain your source files at run time. * NOTE: NOT the destination file name.
rem folder: destination folder path, which is RELATIVE to the destination root, NOT an absolute path.