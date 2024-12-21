import os
from flask_ml.flask_ml_server import MLServer, load_file_as_string

from flask_ml.flask_ml_server.models import ResponseBody
from flask_ml.flask_ml_server.templates import FileML

from ..ml.model import AudioTranscriptionModel

model = AudioTranscriptionModel()
server = MLServer(__name__)

# Add static location for app-info.md file
script_dir = os.path.dirname(os.path.abspath(__file__))
info_file_path = os.path.join(script_dir, "..", "app-info.md")

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
    inputs: file_ml.InputType, parameters: file_ml.ParameterType
) -> ResponseBody:
    print("Inputs:", inputs)
    print("Parameters:", parameters)
    files = [e.path for e in inputs["file_inputs"].files]
    results = model.transcribe_batch(files)
    results = {r["file_path"]: r["result"] for r in results}
    return file_ml.generate_text_response(results)


server.run(port=5020)
