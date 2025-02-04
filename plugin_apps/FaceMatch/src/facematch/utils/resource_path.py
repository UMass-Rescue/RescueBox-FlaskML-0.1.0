import os, sys
from src.facematch.utils.logger import log_info
import os, sys
from src.facematch.utils.logger import log_info

module_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(
    os.path.join(module_dir, os.pardir, os.pardir, os.pardir)
)
DATA_DIR = os.path.join(project_root, "resources")
if getattr(sys, 'frozen', False):
    log_info("debug in get resource_path")
    #script_dir = sys._MEIPASS
    #DATA_DIR = os.path.join(script_dir, "resources")
    log_info(DATA_DIR)

if getattr(sys, 'frozen', False):
    log_info("debug in get resource_path")
    #script_dir = sys._MEIPASS
    #DATA_DIR = os.path.join(script_dir, "resources")
    log_info(DATA_DIR)

os.makedirs(DATA_DIR, exist_ok=True)


def get_resource_path(filename):
    DIR = os.path.join(DATA_DIR, os.path.dirname(filename))
    os.makedirs(DIR, exist_ok=True)
    return os.path.join(DATA_DIR, filename)


def get_config_path(filename):
    p = os.path.join(module_dir, os.pardir)
    if getattr(sys, 'frozen', False):
        p = "."
    return os.path.join(p, "config", filename)
