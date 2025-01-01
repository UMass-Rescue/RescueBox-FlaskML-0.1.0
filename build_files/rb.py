
import os, psutil
from taskkill import taskkill_pid, taskkill_pid_children, taskkill_force_pid, taskkill_force_pid_children, taskkill_regex_rearch


RBHOME= os.path.join(os.environ['USERPROFILE'], "rb")
RBHOME= os.path.join(os.environ['LOCALAPPDATA'], "programs", "RescueBox-Desktop","resources", "assets", "rb_server")

procfile = os.path.join( RBHOME, 'rb_process.txt')
with open(procfile, 'r') as file:
    id= file.read().split("\n")
    print(id)
    for proc in psutil.process_iter(['pid', 'name']):
        pid = proc.info['pid']
        if str(pid) in id:
            print('found ' + str(proc.info['name']))
            results = taskkill_force_pid_children(pids=(pid))
            print(results)
    


while True:
    data = input("RB Server stopped ok, type Exit:\n")
    if os.path.exists(procfile):
        os.remove(procfile)
    if 'Exit' == data:
        break

print("Done")