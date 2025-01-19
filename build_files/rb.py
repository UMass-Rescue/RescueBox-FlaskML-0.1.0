"""Module to start stop backend services."""
import argparse
import os
import sys
import logging
from pathlib import Path
import subprocess
import psutil
from taskkill import taskkill_force_pid_children ,taskkill_regex_rearch
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

model = {
        "5000": "dfVideo",
        "5005": "dfImage",
        "5010": "facematch",
        "5020": "audio",
    }

RBLOG= os.path.join(os.environ['APPDATA'], 'RescueBox-Desktop', 'logs')
RBLOG_FILE = os.path.join(RBLOG, 'rb_py.log')
logging.basicConfig(filename=RBLOG_FILE, level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

cwd = Path.cwd()
#print(f'cwd is {cwd}')
#logging.info("CWD is  %s", cwd)
RBHOME= os.path.join(cwd,"resources", "assets", "rb_server")
if not os.path.exists(RBHOME):
    RBHOME = os.path.join(".", "resources","assets","rb_server")
if not os.path.exists(os.path.join(RBHOME, "plugin_apps")):
    logging.info("RBHOME plugin_apps not found  %s", RBHOME)
else:
    logging.info("RBHOME is Good !")
procfile = os.path.join( RBLOG, 'rb_process.txt')
my_file = Path(procfile)
# logging.info("file %s process exists= %s", procfile, my_file.is_file())

def delete_all_pids() -> None:
    """kill all the pipenv.exe procs"""
    # kill all the pipenv.ece procs
    results = taskkill_regex_rearch(
      dryrun=False,
      kill_children=True,
      force_kill=True,
      title=".*",
      windowtext=".*",
      class_name=".*",
      path="pipenv.*$",
    )
    logging.info("RB model Server killed ok %s", results)
    for proc in psutil.process_iter():
          # print(f'found {str(proc.name), str(proc.pid) }')
          if proc.name() == "pipenv.exe" :
            children = proc.children(recursive=True)
            for child in children:
                try:
                  child.kill()
                except psutil.NoSuchProcess:
                  pass  # Child process already gone
            proc.kill()
            logging.info("RB model Server killed ok with cmdline %s",proc.name())

def stop_existing_pids(spid):
    """kill existing pipenv.exe proc"""
    for proc in psutil.process_iter(['pid', 'name']):
        if str(proc.info["name"]) != 'pipenv.exe':
            continue
        pid = proc.info['pid']
        results = taskkill_force_pid_children(pid)
        logging.info("kill output %s", results)
        logging.info("found %s %s", proc.name, proc.pid)
        print(f'found {str(proc.name), str(proc.pid) }')
        if str(pid) in spid:
            print(f'found {str(proc.info["name"])}')
            logging.info("found %s", proc.info['name'])
            results = taskkill_force_pid_children(pid)
            logging.info("kill output %s", results)
            print("RB model Server stopped ok")
            logging.info("RB model Server stopped ok")
            return True
    return False

def create_new_pids(model,new_pid):
    """Create new server"""
    with open(procfile, 'r') as f:
        lines = f.readlines()
        logging.info("existing lines in process.txt %s", lines)
    out_lines = []
    if len(lines) < 1:
        lines.append( model + "=" + str(new_pid))
    for mline in lines:
        if model in mline:
            mline = model + "=" + str(new_pid)
            logging.info("new pid for process.txt %s", mline)
            out_lines.append(mline)
    logging.info("new lines for process.txt %s", out_lines)
    with open(procfile, 'w') as fw:
        fw.writelines(out_lines)

def check_server_ok(port, retry,delay):
    """Check server rest api"""
   # call rest api at this port
   # Replace with the correct URL
   # curl -lkiv http://127.0.0.1:5000/api/app_metadata
    try:
        http = requests.Session()
        retries = Retry(total=retry, backoff_factor=10, status_forcelist=[429, 500, 502, 503, 504])
        http.mount("http://", HTTPAdapter(max_retries=retries))

        url = "http://127.0.0.1" + ":" + port + "/api/app_metadata"
        response = http.get(url, timeout=delay)
        logging.info("http resp %s",response)
        #response.raise_for_status()
    except (requests.exceptions.RequestException, requests.exceptions.HTTPError) as e:
        print(f'Error with server on {port} {e}')
        logging.info("Error with server on %s %s", port, e)
        return False

    # It is a good practice not to hardcode the credentials. So ask the user to enter
    #  credentials at runtime
    print(f'server running ok with name={response.json()["name"]}')
    logging.info("server running ok on port %s with name=%s", port, response.json()["name"])
    if response.status_code == 200:
        return True
    else:
        return False

def check_exists(pdir) -> bool:
    """check if path exists"""
    if not Path(pdir).is_dir:
        return False
    return True

def restart_on_port(model_name, port) -> None:
    """Restart server on port """
    # restart model and replace new pid
    # get cmdline to run process from pshell
    servers = {}
    pdir  = os.path.join(RBHOME, "plugin_apps","audio-transcription","audio_transcription")
    start = f'pipenv run python {pdir}/server.py'
    servers["5020"]=[pdir, start]
    pdir  = os.path.join(RBHOME, "plugin_apps","FaceMatch")
    start = "pipenv run python server.py"
    servers["5010"]=[pdir, start]
    pdir  = os.path.join(RBHOME, "plugin_apps","DeepFakeDetector","image_model")
    start = "pipenv run python model_server.py"
    servers["5005"]=[pdir, start]
    pdir  = os.path.join(RBHOME, "plugin_apps","DeepFakeDetector","video_detector")
    start = "pipenv run python server.py"
    servers["5000"]=[pdir, start]

    serv = servers[port]
    pdir = serv[0]
    startp = serv[1]
    if not check_exists(pdir):
        print("Model Server not installed %s %s" , pdir)
        return

    print(f'Starting Model Server {pdir} {startp}')
    
    logging.info("Starting Model Server %s %s", pdir, startp)

    # start server f'cmd /c pipenv shell',
    cmds = [f'cd {pdir} && pipenv sync && {startp}']
    new_pid = ""
    for c in cmds:
        print(f'run cmd: {c}')
        logging.info('run cmd %s', c)
        process = subprocess.Popen(c, close_fds=False,shell=True,stderr=subprocess.STDOUT,creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
        new_pid = process.pid
        print(f'run cmd pid  {new_pid}')
        logging.info('pid %s', new_pid)


    # process = subprocess.Popen(["pipenv", "run", "python", "server.py"],
    #                           creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,close_fds=True,
    #                           stdout=None, stderr=None)

    # new_pid = process.pid
    print(f'Process new pid: {new_pid}')
    logging.info("Process %s new PID %s",model_name, new_pid)
    rc = check_server_ok(port,3,3)
    logging.info("check server return %s", rc)
    # replace pid in process.txt
    # done
    create_new_pids(model_name, new_pid)

def find_and_stop_each_pid() -> None:
    if my_file.is_file():
        with open(procfile, 'r') as file:
          pid = file.read().split("\n")
          logging.info("got procs list %s", pid)
          for line in pid:
              stop_pid = line.split("=")
              if len(stop_pid) != 2:
                  continue
              print(f"stop process {stop_pid}")
              #print(f"found process {x[0]} port {x[1]}")
              logging.info("stop process %s %s", stop_pid[0], stop_pid[1])
              #logging.info(f"psutil {psutil}")
              stop_existing_pids(stop_pid)

def main() -> None:
    """Main logic of the script"""
    logging.info('This is rb start/stop utility ')
    #logging.info("using log file %s", RBLOG_FILE)
    parser = argparse.ArgumentParser(description="Run a server.")
    parser.add_argument(
            "--port", type=str, help="Port number to run the server"
        )
    args = parser.parse_args()
    port=args.port
    logging.info("port given %s", port)
    # either kill one one by one to be safe
    if port is None:
        find_and_stop_each_pid()
        # no other option kill all pids
        try:
            f = os.remove(procfile)
            logging.info("remvove proc file fd=%s %s",f, procfile)
        except Exception as e:
            logging.info("remvove proc file %s", e)
        try:
          delete_all_pids()
        except Exception as e:
          logging.info("delete all pids done %s", e)

    model_name = model.get(port)
    if model_name is not None and not check_server_ok(port, 1, .1):
        print(f'restart {model_name} on {port}')
        logging.info("restart %s on %s", model_name, port)
        restart_on_port(model_name, port)
        logging.info("restart completed %s on %s", model_name, port)

if __name__ == "__main__":
    main()
