
!define COPYYEAR 2024

Var VersionNumber


Section
SetDetailsPrint both
InitPluginsDir
StrCpy $VersionNumber "v1.0"
MessageBox MB_OK "RescueBox $VersionNumber $INSTDIR"
;MessageBox MB_OK "RescueBox LocalAppdata $LocalAppdata"
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
  FindWindow $0 "RescueBox-Desktop"
  SendMessage $0 ${WM_CLOSE} 0 0
  ExpandEnvStrings $0 %COMSPEC%
  ExecWait '"$0" /C "$INSTDIR_DAT\assets\rb_server\rb.bat"'
  ExecWait '"$0" /K cd $LocalAppdata && rmdir /s /q $LocalAppdata\Programs\RescueBox-Desktop\resources"'

  ExecWait '"$0" /K cd $LocalAppdata && rmdir /s /q $LocalAppdata\Programs\RescueBox-Desktop\locales"'
  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $LocalAppdata\Programs\RescueBox-Desktop\*.dll"'
  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $LocalAppdata\Programs\RescueBox-Desktop\*.pak"'
  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $LocalAppdata\Programs\RescueBox-Desktop\*.bin"'
  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $LocalAppdata\Programs\RescueBox-Desktop\*.json"'
  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $LocalAppdata\Programs\RescueBox-Desktop\RescueBox-Desktop.exe"'

  ExecWait '"$0" /K cd $LocalAppdata && del /q /f $AppData\RescueBox-Desktop\logs\*.*"'
SectionEnd

!macro customRemoveFiles
  Var /GLOBAL INSTDIR_DX
  Var /GLOBAL INSTDIR_LOG
  Strcpy "$INSTDIR_DX" "$LocalAppdata\Programs\RescueBox-Desktop\resources"
  ;ExpandEnvStrings $0 %COMSPEC%
  ;ExecWait '"$0" /C "$INSTDIR_DX\assets\rb_server\rb.bat"'
  Strcpy "$INSTDIR_LOG" "$AppData\RescueBox-Desktop\logs"
  ExecWait "del /f /q $INSTDIR_LOG\*.*"
  ;ExecWait "rmdir /s /q $INSTDIR_DX"
!macroend

