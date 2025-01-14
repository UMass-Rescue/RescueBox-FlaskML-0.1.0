
!define COPYYEAR 2024

Var VersionNumber


Section
  SetDetailsPrint both
  InitPluginsDir
  StrCpy $VersionNumber "v1.0"
  ExpandEnvStrings $0 %COMSPEC%
  MessageBox MB_OK "RescueBox $VersionNumber $INSTDIR"
  MessageBox MB_OK|MB_ICONINFORMATION "Copyright (R) ${COPYYEAR}"
SectionEnd

!macro customHeader
    RequestExecutionLevel admin
!macroend

!macro customInstall
     Strcpy "$INSTDIR_DAT" "$INSTDIR\resources\assets\rb_server"
!macroend

Section "Uninstall"
  Var /GLOBAL INSTDIR_DAT
  Strcpy "$INSTDIR_DAT" "$INSTDIR\resources\assets\rb_server"

  Var /GLOBAL PY_PATH
  Strcpy "$PY_PATH" "$INSTDIR_DAT\python311\python.exe"

  ExpandEnvStrings $0 %COMSPEC%
  Exec '"$0" /C "$PY_PATH $INSTDIR_DAT\rb.py"'

  FindWindow $0 "RescueBox-Desktop"
  SendMessage $0 ${WM_CLOSE} 0 0

  ExpandEnvStrings $0 %COMSPEC%
  Exec '"$0" /C "$PY_PATH $INSTDIR_DAT\rb.py"'

  ;Exec '"$0" /k "$INSTDIR_DAT\python-3.11.8-amd64.exe -ArgumentList /uninstall /quiet"'
  ;Exec '"$0" /k "rmdir /S /Q $INSTDIR\resources'


  ExpandEnvStrings $0 %COMSPEC%
  Var /GLOBAL INSTDIR_LOG
  Strcpy "$INSTDIR_LOG" "$AppData\RescueBox-Desktop\logs"
  Exec '"$0" /C del /f /q $INSTDIR_LOG\*.*"'
SectionEnd

!macro customRemoveFiles
  ;Exec "del /f /q $INSTDIR_LOG\rb_process.txt"
  ExpandEnvStrings $0 %COMSPEC%
  Exec '"$0" /C rmdir /S /Q "$INSTDIR"'
!macroend

