import os
import shutil
import zipfile
from flask import Flask, request, send_file
from flask_cors import CORS
import subprocess
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

@app.route('/separate', methods=['POST'])
def separate():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    with tempfile.TemporaryDirectory() as temp_dir:
        # Save the uploaded file
        upload_path = os.path.join(temp_dir, file.filename)
        file.save(upload_path)
        logging.info(f"File uploaded to {upload_path}")

        # Separation
        model = 'htdemucs' # default model

        try:
            # Using the command line interface
            command = [
                'python3', '-m', 'demucs',
                '-d', 'cpu',
                '-n', model,
                '-o', temp_dir,
                upload_path
            ]

            logging.info(f"Running command: {' '.join(command)}")

            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True  # This will raise an exception if the command fails
            )

            logging.info(f"demucs stdout: {result.stdout}")
            logging.info(f"demucs stderr: {result.stderr}")

            # The actual output dir is inside temp_dir/htdemucs/filename
            separated_files_dir = os.path.join(temp_dir, model, os.path.splitext(file.filename)[0])

            if not os.path.isdir(separated_files_dir):
                return "Separation failed, could not find output files.", 500

            logging.info(f"Separated files are in {separated_files_dir}")

            # Create a zip file
            zip_path = os.path.join(temp_dir, 'stems.zip')
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for root, dirs, files in os.walk(separated_files_dir):
                    for f in files:
                        zipf.write(os.path.join(root, f), arcname=f)

            logging.info(f"Zip file created at {zip_path}")

            return send_file(zip_path, as_attachment=True)
        except subprocess.CalledProcessError as e:
            logging.error(f"Demucs failed with exit code {e.returncode}")
            logging.error(f"Stdout: {e.stdout}")
            logging.error(f"Stderr: {e.stderr}")
            return f"Demucs failed: {e.stderr}", 500
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
