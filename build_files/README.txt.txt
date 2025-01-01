
copy this files to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

copy plugin_apps to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

copy python-3.11.2-amd64.exe to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

these "assets" get shipped by electron builder EXE and installed , see below last few lines about it

process : 
Desktop main.ts calls rbserver.ts method , this calls powershell installer.ps1 

powershell runs during install , to setup python + download large files from onedrive + start flask_ml server for each of the 4 plugins

rb.py kills the python servers.

these cmds to make the RB exe .
npm install
npm run postinstall
npm run build
npm run rebuild
npm exec electron-builder -- --win

RescueBox-FlaskML-0.1.0\RescueBox-Desktop\release\build

RescueBox-Desktop Setup 0.3.10.exe --- click to install RB
see main.log and rb-py.log 

C:\Users\<name>\AppData\Roaming\RescueBox-Desktop\logs

python for RB is installed to C:\Users\<name>\python311

this is where plugin code is installed and executed
            C:\Users\<name>\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server\plugin_apps

desktop server icon --to stop and start for day 2 operations


