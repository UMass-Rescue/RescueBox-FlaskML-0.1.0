import os, sys
import argparse
from flask_ml.flask_ml_server import MLServer, load_file_as_string

from flask_ml.flask_ml_server.models import ResponseBody
from flask_ml.flask_ml_server.templates import FileML
# remove relative import for pyinstaller
from ml.model import AudioTranscriptionModel
import logging
formatter = logging.Formatter(
    "{asctime} - {levelname} - {message}",
     style="{",
     datefmt="%Y-%m-%d %H:%M", )
logger = logging.getLogger(__name__)
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
file_handler = logging.FileHandler("audio.log", mode="a", encoding="utf-8")
file_handler.setFormatter(formatter)
logger.addHandler(console_handler)
logger.addHandler(file_handler)


# for pyinstaller
if getattr(sys, 'frozen', False):
    os.environ["PATH"] += os.pathsep + sys._MEIPASS
    os.chdir(sys._MEIPASS)

model = AudioTranscriptionModel()
server = MLServer(__name__)

'''
 Add static location for app-info.md file
 file path cannot be used for pyinstaller
 script_dir = os.path.dirname(os.path.abspath(__file__))
 if pyinstaller runs from parent directory
 info_file_path = os.path.join("audio_transcription", "app-info.md")
'''

# run pyinstalled in same folder as server , app-info.md location
info_file_path = os.path.join(".", "app-info.md")

server.add_app_metadata(
    name="Audio Transcription",
    author="RescueBox Team",
    version="0.1.0",
    info=load_file_as_string(info_file_path),
)

example_parameters = {
    "example_parameter": "example_value",
    "example_parameter2": 0.5,
    "example_parameter3": 5,
}
file_ml = FileML(example_parameters)


@server.route("/transcribe", task_schema_func=file_ml.task_schema_func)
def transcribe(
    inputs: file_ml.InputType, parameters: file_ml.ParameterType # type: ignore
) -> ResponseBody:
    logger.info("Inputs:", inputs)
    logger.info("Parameters:", parameters)
    files = [e.path for e in inputs["file_inputs"].files]
    results = model.transcribe_batch(files)
    results = {r["file_path"]: r["result"] for r in results}
    return file_ml.generate_text_response(results)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a server.")
    parser.add_argument(
        "--port", type=int, help="Port number to run the server", default=5020
    )
    args = parser.parse_args()
    server.run(port=5020)
