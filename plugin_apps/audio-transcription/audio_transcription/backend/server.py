from flask_ml.flask_ml_server import MLServer
from flask_ml.flask_ml_server.models import ResponseBody
from flask_ml.flask_ml_server.templates import FileML

from ..ml.model import AudioTranscriptionModel

model = AudioTranscriptionModel()
server = MLServer(__name__)
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


server.run()
