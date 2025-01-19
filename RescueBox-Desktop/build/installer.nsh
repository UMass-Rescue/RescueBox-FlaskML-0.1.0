
!define COPYYEAR 2024

Var VersionNumber

!macro customInit
  Delete "$INSTDIR\Uninstall*.exe"
!macroend

Section
  SetDetailsPrint both
  InitPluginsDir
  StrCpy $VersionNumber "v1.0"
  ExpandEnvStrings $0 %COMSPEC%
  MessageBox MB_OK "RescueBox $VersionNumber $INSTDIR"
  MessageBox MB_OK|MB_ICONINFORMATION "Copyright (R) ${COPYYEAR}"
SectionEnd

Section "Uninstall"
  Var /GLOBAL INSTDIR_LOG
  Strcpy "$INSTDIR_LOG" "$AppData\RescueBox-Desktop\logs"

  Var /GLOBAL INSTDIR_DAT
  Strcpy "$INSTDIR_DAT" "$INSTDIR\resources\assets\rb_server"

  Var /GLOBAL PY_PATH
  Strcpy "$PY_PATH" "$INSTDIR_DAT\python311\python.exe"

  ExpandEnvStrings $0 %COMSPEC%
  ;ExecWait '"$0" "$PY_PATH $INSTDIR_DAT\rb.py"'

  FindWindow $0 "RescueBox-Desktop"
  SendMessage $0 ${WM_CLOSE} 0 0

  ;ExecWait '"$0" "$PY_PATH $INSTDIR_DAT\rb.py"'
  ;Exec '"$0" /c "$INSTDIR_DAT\python-3.11.8-amd64.exe /quiet /uninstall"'

  ;Exec '"$"0" "del /f /q $INSTDIR_LOG\*.*"'

  Exec '"$0" /c "rmdir /S /Q $INSTDIR"'

SectionEnd


