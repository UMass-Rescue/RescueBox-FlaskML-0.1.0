# cmds to build EXE named : RescueBox-Desktop\release\build\RescueBox-Desktop Setup 0.3.10.exe
# cd RescueBox-FlaskML-0.1.0\RescueBox-Desktop

cd ..\RescueBox-Desktop
cmd /c npm cache clean --force
cmd /c npm cache verify
cmd /c npm install
cmd /c npm run postinstall
cmd /c npm run build
cmd /c npm run rebuild
cmd /c npm exec electron-builder -- --win
cd ..\build_files