from flask_ml.flask_ml_client import MLClient
from flask_ml.flask_ml_server.models import BatchFileInput, Input

url = "http://127.0.0.1:5000/transcribe"  # The URL of the server
client = MLClient(url)  # Create an instance of the MLClient object

inputs = {
    "file_inputs": Input(
        root=BatchFileInput.model_validate(
            {"files": [{"path": "Test1.m4a"}, {"path": "Test2.m4a"}]}
        )
    )
}
example_parameters = {
    "example_parameter": "Some string",
    "example_parameter2": 0.25,
    "example_parameter3": 3,
}

response = client.request(
    inputs, parameters=example_parameters
)  # Send a request to the server
print(response)  # Print the response
