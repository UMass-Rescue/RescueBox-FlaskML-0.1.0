"""Module to start stop backend services."""
import argparse
import os
import sys
import logging
from pathlib import Path
import subprocess
import psutil
import json
import platform
from string import Template
if platform.system() == 'Windows':
    from taskkill import taskkill_force_pid_children ,taskkill_regex_rearch
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
import urllib3

#logging.getLogger("urllib3").setLevel(logging.ERROR)

handle = "rb.py"
logger = logging.getLogger(handle)

cwd = Path.cwd()
RBHOME = cwd
RBHOME = os.path.join(cwd,"resources", "assets", "rb_server")
RBLOG = os.path.join(cwd, "logs")
RBPYTHON= os.path.join(cwd,"resources", "assets", "rb_server","python311")
RBPYTHON_SCRIPTS= os.path.join(cwd,"resources", "assets", "rb_server","python311","scripts")
if platform.system() == 'Windows':
    RBLOG = os.path.join(os.environ['APPDATA'], 'RescueBox-Desktop', 'logs')
    if not os.path.exists(RBHOME):
        RBHOME = os.path.join(cwd)
        RBPYTHON= os.path.join(cwd,"python311")
        RBPYTHON_SCRIPTS= os.path.join(cwd,"python311", "scripts")
    if not os.path.exists(os.path.join(RBHOME, "plugin_apps")):
        print("RBHOME plugin_apps not found  %s", RBHOME)
else:
    os.makedirs(RBLOG, exist_ok=True)
os.environ['PATH']= f'{RBPYTHON};{RBPYTHON_SCRIPTS};{os.environ["PATH"]}'
print(f'RBLOG is {RBLOG}')

proc_file = os.path.join( RBLOG, 'rb_process.txt')

def delete_all_pids(proc_name) -> None:
    """kill all the pipenv.exe procs"""
    # kill all the pipenv.ece procs in one go
    if platform.system() == 'Windows':
        results = taskkill_regex_rearch(
        dryrun=False,
        kill_children=True,
        force_kill=True,
        title=".*",
        windowtext=".*",
        class_name=".*",
        path=f'{proc_name}' +"$",
        )
        logger.info("RB model Server killed ok %s", results)
    for proc in psutil.process_iter():
          if proc.name() == proc_name :
            children = proc.children(recursive=True)
            for child in children:
                try:
                  child.kill()
                except psutil.NoSuchProcess:
                  pass  # Child process already gone
            proc.kill()
            logger.info("RB model Server killed ok with cmdline %s",proc.name())

def stop_existing_pids(proc_name,spid):
    """kill existing pipenv.exe proc"""
    for proc in psutil.process_iter(['pid', 'name']):
        if str(proc.info["name"]) != proc_name:
            continue
        pid = proc.info['pid']
        results = taskkill_force_pid_children(pid)
        logger.info("kill output %s", results)
        logger.info("found %s %s", proc.name, proc.pid)
        print(f'found {str(proc.name), str(proc.pid) }')
        if str(pid) in spid:
            print(f'found {str(proc.name)}')
            logger.info("found %s", proc.name)
            results = taskkill_force_pid_children(pid)
            logger.info("kill output %s", results)
            print("RB model Server stopped ok")
            logger.info("RB model Server stopped ok")
            return True
    return False

def create_new_pids(model,new_pid):
    """Create new server"""
    if not os.path.exists(proc_file):
       with open(proc_file, 'w') as fw:
          fw.writelines(model + "=" + str(new_pid))
          return
    with open(proc_file, 'r') as f:
        lines = f.readlines()
        logger.info("existing lines in process.txt %s", lines)
    out_lines = []
    if len(lines) < 1:
        lines.append( model + "=" + str(new_pid))
    for mline in lines:
        if model in mline:
            mline = model + "=" + str(new_pid)
            logger.info("new pid for process.txt %s", mline)
            out_lines.append(mline)
    logger.info("new lines for process.txt %s", out_lines)
    with open(proc_file, 'w') as fw:
        fw.writelines(out_lines)

def check_server_ok(servers, port,backoff, retry, delay):
    """Check server rest api"""
   # call rest api at this port
   # Replace with the correct URL
   # curl -lkiv http://127.0.0.1:5000/api/app_metadata
    try:
        http = requests.Session()
        retries = Retry(total=retry, backoff_factor=backoff, raise_on_status=False,connect=2, status_forcelist=[429, 500, 502, 503, 504])
        http.mount("http://", HTTPAdapter(max_retries=retries))

        url = servers["URL"] + ":" + port + servers["SERVER_API"]
        response = http.get(url, timeout=delay)
        logger.info("http resp %s",response)
        #response.raise_for_status()
    except (requests.exceptions.RequestException, requests.exceptions.HTTPError) as e:
        print(f'Error with server on {port} {e}')
        logger.info("Error with server on %s %s", port, e)
        return False

    # It is a good practice not to hardcode the credentials. So ask the user to enter
    #  credentials at runtime
    print(f'server running ok with name={response.json()["name"]}')
    logger.info("server running ok on port %s with name=%s", port, response.json()["name"])
    if response.status_code == 200:
        return True
    else:
        return False

def check_exists(pdir) -> bool:
    """check if path exists"""
    if not os.path.isdir(pdir):
        return False
    return True

def template_eval(templae_str,pdir_path,plog_dir,plog_path, SPLIT) -> str:
    """Eval json template"""
    templ = Template(templae_str)
    val = templ.substitute(rbhome=RBHOME,pdir=pdir_path,rblog=plog_dir,plog=plog_path)
    if SPLIT:
        p    = val.split(",")
        value   = os.path.join(*p)
        return value
    return val

def restart_on_port(servers, model_name, port) -> None:
    """Restart server on port """
    # get cmdline to run process from pshell
    logger.info("restart %s on %s", model_name, port)
    RBDIR= '.'
    server = servers[port]

    pdir = template_eval(server["pdir"],'.', RBLOG, None, True)
    print(f'debug pdir is {pdir}')

    plog = template_eval(server["plog"], pdir, RBLOG, None, True)
    print(f'debug plog is {plog}')

    pstart = template_eval(server["pstart"],pdir, RBLOG, plog, True)
    print(f'debug pstart is {pstart}')

    if not check_exists(pdir):
        print("Model Server not installed in %s" , pdir)
        return

    print(f'Starting Model Server {pdir} {pstart} {plog}')

    logger.info("Starting Model Server %s %s", pdir, pstart)
    # start server cmds in one process
    if platform.system() == 'Windows':
        cmds = [f'cd {pdir} && pipenv sync && {pstart}']
        new_pid = ""
        for c in cmds:
            print(f'run cmd: {c}')
            logger.info('run cmd %s', c)
            # get stdout/stderr to log file , no new popup window , get cmd.exe pid
            process = subprocess.Popen(c,shell=True,stderr=subprocess.STDOUT,
                                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            new_pid = process.pid
            print(f'run cmd pid  {new_pid}')
            logger.info('pid %s', new_pid)
    else:
        logger.info('process start not implemented on mac /linux ')
        return


    print(f'Process new pid: {new_pid}')
    logger.info("Process %s new PID %s",model_name, new_pid)
    rc = check_server_ok(servers, port, servers["BACKOFF"], servers["RETRY"], servers["DELAY"])
    logger.info("check server return %s", rc)
    # replace pid in process.txt
    # done
    create_new_pids(model_name, new_pid)
    logger.info("restart kicked off %s on %s", model_name, port)


def find_and_stop_each_pid() -> None:
    if os.path.exists(proc_file):
        with open(proc_file, 'r') as file:
          pid = file.read().split("\n")
          logger.info("got procs list %s", pid)
          for line in pid:
              stop_pid = line.split("=")
              if len(stop_pid) != 2:
                  continue
              print(f"stop process {stop_pid}")
              #print(f"found process {x[0]} port {x[1]}")
              logger.info("stop process %s %s", stop_pid[0], stop_pid[1])
              #logger.info(f"psutil {psutil}")
              stop_existing_pids("pipenv.exe",stop_pid)

def find_and_stop_server_pids() ->None:
    find_and_stop_each_pid()
    # no other option kill all pids
    try:
        f = os.remove(proc_file)
        logger.info("remove proc file fd=%s %s",f, proc_file)
    except Exception as e:
        logger.info("remove proc file %s", e)
    try:
        delete_all_pids("pipenv.exe")
    except Exception as e:
        logger.info("delete all pids done %s", e)

def setup_logging():
    '''Setup paths and log'''
    RBHOME = cwd
    print(f'debug System is {platform.system()}')
    if platform.system() == 'Windows':
        RBHOME = os.path.join(cwd,"resources", "assets", "rb_server")

    RBLOG_FILE = os.path.join(RBLOG, 'rb_py.log')

    stream_handler = logging.StreamHandler()
    file_handler = logging.FileHandler(RBLOG_FILE)

    logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(module)s %(funcName)s %(message)s',
                    handlers=[ stream_handler,file_handler])

    handle = "my-app"
    logger = logging.getLogger(handle)
    logger.setLevel(logging.DEBUG) #

    #if not os.path.exists(RBHOME):
    #    RBHOME = os.path.join(".", "resources","assets","rb_server")
    if not os.path.exists(os.path.join(RBHOME, "plugin_apps")):
        logger.info("RBHOME plugin_apps not found  %s", RBHOME)
    else:
        logger.info("RBHOME is Good !")
    print(f'debug RBHOME is {RBHOME}')

def parse_args() -> dict:
    parser = argparse.ArgumentParser(description="Run a server.")
    parser.add_argument(
            "--port", type=str, help="Port number to run the server"
        )
    args = parser.parse_args(namespace=None)
    return args

def exit_if_running(port):
    """Check if server is already running"""
    if port is not None:
        port_file = os.path.join(RBLOG, f'{port}.txt')
        if os.path.exists(port_file):
            logger.info("found server start running on port %s", port)
            sys.exit(0)
        else:
            try:
                with open(port_file, 'r') as fw:
                     fw.writelines(f'{port}')
            except Exception as e:
                logger.info("check server running on port %s failed %s", port, e)

def main() -> None:
    """Main logic of the script"""
    #logger.info("using log file %s", RBLOG_FILE)
    args=parse_args()
    logger.info("port given %s", args.port)
    exit_if_running(args.port)
    setup_logging()
    logger.info('This is rb start/stop utility ')

    # Read mode server config from a file
    servers = {}
    stop_needed = False
    config = os.path.join(RBHOME, 'server_config.json')
    with open(config, 'r') as f:
        models = json.load(f)
        servers= models["servers"]
        stop_needed = servers["SKIP_STOP_ON_CLOSE"]
        logger.info("server given in config file %s", servers)
        logger.info("stop needed given in config file %s", stop_needed)
    # either kill one one by one to be safe
    if args.port is None and stop_needed:
        find_and_stop_server_pids()
    else:
        model = servers.get(args.port)
        model_name = None
        if model is not None:
            model_name = model["pname"]
            logger.info("model found %s", model_name)
        if model_name is None:
            logger.info("model not found on port %s", args.port)
            sys.exit(0)
        if model_name is not None and not check_server_ok(servers,args.port,
                    servers["BACKOFF"], servers["RETRY"], servers["DELAY"]):
            restart_on_port(servers, model_name, args.port)

if __name__ == "__main__":
    main()
