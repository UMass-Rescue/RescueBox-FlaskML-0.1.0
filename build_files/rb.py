
import os, psutil, sys
from taskkill import taskkill_force_pid_children
import argparse
import logging
import subprocess


logging.basicConfig(filename='rb_starter.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logging.info('This is rb start/stop utility ')
parser = argparse.ArgumentParser(description="Run a server.")
parser.add_argument(
        "--port", type=int, help="Port number to run the server", default=5000
    )
args = parser.parse_args()
port=args.port
model = {
    "5000": "dfVideo",
    "5005": "dfImage",
    "5010": "facematch",
    "5020": "audio",
}
need_model = ""
if model.get(port) is not None:
    need_model = model.get(port)
    print(f"restart {need_model} on {port}")
    logging.info(f"restart {need_model} on {port}")

RBHOME= os.path.join(os.environ['USERPROFILE'], "rb")
# C:\Users\foth2\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server
RBHOME= os.path.join(os.environ['LOCALAPPDATA'], "programs", "RescueBox-Desktop","resources", "assets", "rb_server")


procfile = os.path.join( RBHOME, 'rb_process.txt')
DONE=False
with open(procfile, 'r') as file:
    id= file.read().split("\n")
    x = id.split("=")
    print(f"found process {x[0]} port {x[1]}")
    logging.info(f"found process {x[0]} port {x[1]}")
    for proc in psutil.process_iter(['pid', 'name']):
        pid = proc.info['pid']
        if str(pid) in id:
            print(f'found {str(proc.info["name"])}')
            logging.info(f'found ' + str(proc.info['name']))
            results = taskkill_force_pid_children(pids=(pid))
            print(results)
            print("RB model Server stopped ok")
            print(f'RB model Server stopped ok')
            DONE=True


if DONE:
     # restart model and replace new pid
     # get cmdline to run process from pshell
    pdir = os.path.join(RBHOME, "plugin_apps","audio-transcription","audio_transcription")
    print(f'Starting Model Server..audio_transcription')
    logging.info(f'Starting Model Server..audio_transcription')

    os.chdir(pdir)
    process = subprocess.Popen(["pipenv", "run", "python", "server.py"],
                               creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                               stdout=None, stderr=None
                               )
    pid = process.pid
    print("Process audio PID:", pid)
    logging.info(f'Process audio PID {pid}')
    with open(procfile, 'r') as file:
        lines = file.readlines()
        logging.info(f'existing lines in process.txt {lines}')
    out_lines = []
    for line in lines:
        if port in line:
            line = port + "=" + pid
            logging.info(f'new pid for process.txt {line}')
        out_lines.append(line)
    logging.info(f'new lines for process.txt {out_lines}')
    with open(procfile, 'w') as file:
            file.writelines(out_lines)

     # start server
     # replace pid in process.txt
     # done


while True:
    data = input("RB Server stopped ok, type Exit:\n")
    #if os.path.exists(procfile):
    #    os.remove(procfile)
    if 'Exit' == data:
        break

print("Done")

'''
          results = taskkill_regex_rearch(
                      dryrun=False,
                      kill_children=True,
                      force_kill=True,
                      windowtext=".*",
                      class_name=".*",
                      path="RescueBox-Desktop.exe$",
                      )
            print (results)
'''
