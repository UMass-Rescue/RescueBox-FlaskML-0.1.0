# Command line interface for audio transcription

import argparse
from pathlib import Path

from audio_transcription.ml.model import AudioTranscriptionModel


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio files")
    parser.add_argument(
        "--audio_file",
        type=str,
        help="The path to the audio file to transcribe",
        default=None,
    )
    parser.add_argument(
        "--audio_directory",
        type=str,
        help="The path to the directory containing the audio files",
        default=None,
    )
    parser.add_argument(
        "--output_directory",
        type=str,
        help="The path to the directory to save the transcriptions",
        required=True,
    )
    args = parser.parse_args()

    audio_file, audio_directory = args.audio_file, args.audio_directory
    output_directory = Path(args.output_directory)
    output_directory.mkdir(parents=True, exist_ok=True)
    if audio_file is None and audio_directory is None:
        raise ValueError("Either --audio_file or --audio_directory must be provided")
    if audio_file and audio_directory:
        raise ValueError(
            "Only one of --audio_file or --audio_directory can be provided"
        )

    model = AudioTranscriptionModel()
    if audio_file:
        model.transcribe(audio_file, output_directory)
        print(
            f"Transcription for {audio_file} saved to {output_directory / Path(audio_file).name.split('.')[0]}.txt"
        )
    else:
        model.transcribe_files_in_directory(audio_directory, output_directory)
        print(
            f"Transcriptions for files in {audio_directory} saved to {output_directory}"
        )


if __name__ == "__main__":
    main()
