
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
  Exec "del /f /q $INSTDIR_LOG\rb_process.txt"

  ExpandEnvStrings $0 %COMSPEC%
  Var /GLOBAL INSTDIR_LOG
  Strcpy "$INSTDIR_LOG" "$AppData\RescueBox-Desktop\logs"
  Exec "del /f /q $INSTDIR_LOG\*.*"
SectionEnd

!macro customRemoveFiles
  ;Exec "rmdir /S /Q $INSTDIR"
!macroend

