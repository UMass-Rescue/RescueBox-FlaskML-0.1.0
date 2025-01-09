
!define COPYYEAR 2024

Var VersionNumber


Section
SetDetailsPrint both
InitPluginsDir
StrCpy $VersionNumber "v1.0"
MessageBox MB_OK "RescueBox $VersionNumber $INSTDIR"
MessageBox MB_OK|MB_ICONINFORMATION "Copyright (R) ${COPYYEAR}"
SectionEnd

!macro customHeader
    RequestExecutionLevel admin
!macroend

!macro customInstall
  Var /GLOBAL INSTDIR_DATA
  Strcpy "$INSTDIR_DATA"  "$INSTDIR"
  ;ExecWait if needed
  DetailPrint $INSTDIR_DATA
!macroend

Section "Uninstall"
  Var /GLOBAL INSTDIR_DAT
  Strcpy "$INSTDIR_DAT" "$LocalAppdata\Programs\RescueBox-Desktop\resources"

  Var /GLOBAL PY_PATH
  Strcpy "$PY_PATH" "$PROFILE\python311\python.exe"
  ExpandEnvStrings $0 %COMSPEC%
  Exec '"$0" /C "$PY_PATH $INSTDIR_DAT\assets\rb_server\rb.py"'

  FindWindow $0 "RescueBox-Desktop"
  SendMessage $0 ${WM_CLOSE} 0 0

  ExpandEnvStrings $0 %COMSPEC%
  Exec '"$0" /C rmdir /s /q "$LocalAppdata\Programs\RescueBox-Desktop\locales"'
  Exec '"$0" /C del /q /f "$LocalAppdata\Programs\RescueBox-Desktop\*.dll"'
  Exec '"$0" /C del /q /f "$LocalAppdata\Programs\RescueBox-Desktop\*.pak"'
  Exec '"$0" /C del /q /f "$LocalAppdata\Programs\RescueBox-Desktop\*.bin"'
  Exec '"$0" /C del /q /f "$LocalAppdata\Programs\RescueBox-Desktop\*.json"'

  Exec '"$0" /C rmdir /s /q "$LocalAppdata\Programs\RescueBox-Desktop"'


SectionEnd

!macro customRemoveFiles
  Var /GLOBAL INSTDIR_LOG
  Strcpy "$INSTDIR_LOG" "$AppData\RescueBox-Desktop\logs"
  Exec "del /f /q $INSTDIR_LOG\main.log"
!macroend

