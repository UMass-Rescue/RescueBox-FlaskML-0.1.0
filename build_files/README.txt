
Build EXE cheatsheet:

1 copy this files to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

2 copy plugin_apps to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

3 copy python-3.11.2-amd64.exe to RescueBox-FlaskML-0.1.0\RescueBox-Desktop\assets\rb_server

4 copy 
build_files\icon.ico
build_files\rb.py
build_files\installer.ps1
build_files\requirements.txt
 to RescueBox-Desktop\assets\rb_server

	these "assets" are populated by electron builder into EXE and installed , see below last few lines about it

nsis 2GB limit

5 overwrite C:\Users\foth2\AppData\Local\electron-builder\Cache\nsis with the unzip of nsis-binary-7423-2.zip
	all the sub folders like nsis-old-version\bin with get updated
	npm build will work ok without errors because RB is >  2 GB


internal process : 
Desktop main.ts calls rbserver.ts method , this calls powershell installer.ps1 

powershell runs during install , to install python + ( not needed:download large files from onedrive ) + start flask_ml server for each of the 4 plugins

rb.py kills the python servers and restarts them 

these cmds are to make the RB exe from souce
npm install
npm run postinstall
npm run build
npm run rebuild
npm exec electron-builder -- --win

RescueBox-FlaskML-0.1.0\RescueBox-Desktop\release\build

RescueBox-Desktop Setup 0.3.10.exe --- click to install RB
see main.log and rb-py.log 

C:\Users\<name>\AppData\Roaming\RescueBox-Desktop\logs

python for RB is installed to C:\Users\<name>\python311. note RB uses this python . there could be some other python in users path RB does not use that !

this is where plugin code is installed and managed
            C:\Users\<name>\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server\plugin_apps
	    C:\Users\<name>\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server is for running powershell
            and flask_ml server process start/stop


desktop server icon --to stop and start for day 2 operations

