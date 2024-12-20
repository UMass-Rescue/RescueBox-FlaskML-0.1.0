## Audio Transcription

### Installing requirements

1. Install ffmpeg
```
sudo apt update && sudo apt install ffmpeg
```
2. Install pipenv
```
pip install pipenv
```
3. Install dependencies
```
pipenv install
```

### Starting the server

```
python -m audio_transcription.backend.server
```

### Client example

```
python client_example.py
```

### Command line tool

Transcribe a single file
```
python cmd_interface.py --output_directory ./out --audio_file audio.mp3
```

Transcribe all audio files in a directory
```
python cmd_interface.py --output_directory ./out --audio_directory ./input_dir
```