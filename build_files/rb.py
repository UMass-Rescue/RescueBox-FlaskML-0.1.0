
import os, psutil, sys
from taskkill import taskkill_force_pid_children ,taskkill_regex_rearch
import argparse
import logging
import subprocess
from pathlib import Path

RBLOG= os.path.join(os.environ['APPDATA'], 'RescueBox-Desktop', 'logs')
RBLOG_FILE = os.path.join(RBLOG, 'rb_starter.log')
logging.basicConfig(filename=RBLOG_FILE, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# change this to roaming logs ????
# C:\Users\foth2\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server
RBHOME= os.path.join(os.environ['LOCALAPPDATA'], "programs", "RescueBox-Desktop","resources", "assets", "rb_server")
if not os.path.exists(RBHOME):
  RBHOME = "."
if not os.path.exists(os.path.join(RBHOME, "plugin_apps")):
  logging.info(f"RBHOME plugin_apps not found  {RBHOME}")
  # dont exit kill server is they are running during uninstall

logging.info('This is rb start/stop utility ')
parser = argparse.ArgumentParser(description="Run a server.")
parser.add_argument(
        "--port", type=str, help="Port number to run the server", default="0"
    )
args = parser.parse_args()
port=args.port
model = {
    "5000": "dfVideo",
    "5005": "dfImage",
    "5010": "facematch",
    "5020": "audio",
}

def delete_all_pids():
    # kill all the pipenv.ece procs
    results = taskkill_regex_rearch(
    dryrun=False,
    kill_children=True,
    force_kill=True,
    title=".*",
    windowtext=".*",
    class_name=".*",
    path="pipenv.exe$",
    )
    logging.info(f'RB model Server killed ok {results}')
    for proc in psutil.process_iter():
        if proc.name() == "pipenv.exe" or proc.name() == "python.exe" :
            proc.kill()
            logging.info(f'RB model Server killed ok')

procfile = os.path.join( RBLOG, 'rb_process.txt')
my_file = Path(procfile)
if not my_file.is_file():
    logging.info(f"no rb process found..exit")
    delete_all_pids()
    sys.exit(0)

need_model = ""
if model.get(port) is not None:
  need_model = model.get(port)
  print(f"restart {need_model} on {port}")
  logging.info(f"restart {need_model} on {port}")

def create_new_pids(new_pid):
    with open(procfile, 'r') as file:
      lines = file.readlines()
      logging.info(f'existing lines in process.txt {lines}')
    out_lines = []
    for line in lines:
      if need_model in line:
        line = need_model + "=" + str(new_pid)
        logging.info(f'new pid for process.txt {line}')
      out_lines.append(line)
    logging.info(f'new lines for process.txt {out_lines}')
    with open(procfile, 'w') as file:
            file.writelines(out_lines)


def stop_existing_pids(stop_pid):
  for proc in psutil.process_iter(['pid', 'name']):
    if str(proc.info["name"]) != 'pipenv.exe':
        continue
    pid = proc.info['pid']
    logging.info(f'found {str(proc.info["name"]), str(proc.info["pid"]) }')
    print(f'found {str(proc.info["name"]), str(proc.info["pid"]) }')
    if str(pid) in stop_pid:
      print(f'found {str(proc.info["name"])}')
      logging.info(f'found ' + str(proc.info['name']))
      results = taskkill_force_pid_children(pids=(pid))
      logging.info(f'kill output= {results}')
      print("RB model Server stopped ok")
      logging.info(f'RB model Server stopped ok')
      return True
  return False

DONE=False
with open(procfile, 'r') as file:
    id= file.read().split("\n")
    logging.info(f"got procs list {id}")
    for line in id:
      stop_pid = line.split("=")
      if len(stop_pid) != 2:
          continue
      print(f"found process {stop_pid}")
      #print(f"found process {x[0]} port {x[1]}")
      logging.info(f"found process {stop_pid[0]} port {stop_pid[1]}")
      #logging.info(f"psutil {psutil}")
      DONE = stop_existing_pids(stop_pid)


if DONE:
    # os.remove(procfile)
    logging.info(f'RB model Server removed rb_process.txt')
else:
    delete_all_pids()

if DONE and model.get(port) is not None:
     # restart model and replace new pid
     # get cmdline to run process from pshell
    pdir = os.path.join(RBHOME, "plugin_apps","audio-transcription","audio_transcription")
    print(f'Starting Model Server..audio_transcription')
    logging.info(f'Starting Model Server..audio_transcription')

    # start server
    os.chdir(pdir)
    process = subprocess.Popen(["pipenv", "run", "python", "server.py"],
                               creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                               stdout=None, stderr=None
                               )
    new_pid = process.pid
    print("Process audio PID:", new_pid)
    logging.info(f'Process audio PID {new_pid}')
    # replace pid in process.txt
    # done
    create_new_pids(new_pid)

'''
while True:
    data = input("RB Server stopped ok, type Exit:\n")
    #if os.path.exists(procfile):
    #    os.remove(procfile)
    if 'Exit' == data:
        break
'''
