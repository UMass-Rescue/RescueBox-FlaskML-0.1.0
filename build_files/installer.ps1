# powershell install python and download source to RB_HOME folder
# start pipenv virtualenv and flask ml server per plugin
# powershell -noexit -ExecutionPolicy Bypass -File installer.ps1

<#
# admin privileges not needed
if (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')) {
 if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
  $CommandLine = "-File `"" + $MyInvocation.MyCommand.Path + "`" " + $MyInvocation.UnboundArguments
  Start-Process -FilePath PowerShell.exe -Verb Runas -ArgumentList $CommandLine
  Exit
 }
}

#>

Clear-Host
Write-Output "RB Installer"
$RB_HOME=$PSScriptRoot
$RB_LOG= "$env:APPDATA\RescueBox-Desktop\logs"
# C:\Users\xxx\AppData\Roaming\RescueBox-Desktop\logs
Write-Output "RB_HOME $RB_HOME"
# as early as possible indicate deployment
$content = "# rb pids"
$content | Out-File  $RB_LOG\rb_process.txt -Append

$SKIP_INSTALL=$false
if (Test-Path -Path "$RB_LOG\rb_py.log") {
  Write-Host "RB_LOG deployed py log exists..!"
  Remove-Item "$RB_LOG\rb_py.log" -verbose
}
if (!$SKIP_INSTALL) {
  Write-Output "PROGRESS 1 of 5"
  # if needed download zip and extract
  # Expand-Archive C:\a.zip -DestinationPath C:\a

  # interactive if needed
  # $yn = Read-Host "Add desktop shortcut? [Y/n] "
  $yn = "N"
  $yn = $yn.ToLower()
  if($yn -eq "n"){$installDesktopFile="false"}else{$installDesktopFile="true"}

  # CWD "AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server"


  #$launcher=".installer\launchers\windows.bat"
  #Copy-Item $launcher "$RB_HOME\rb.bat" -force

  # SKIP instead call  stop service rb.py from nsis uninstall nsh
  Set-Location $RB_HOME
  if($installDesktopFile -eq "true"){
    $WshShell = New-Object -comObject WScript.Shell
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $Shortcut = $WshShell.CreateShortcut("$DesktopPath\RB.lnk")
    $Shortcut.TargetPath = "%comspec%"
    $Shortcut.Arguments = "/c start CALL $RB_HOME\rb.bat --shortcut"
    $Shortcut.Description = "RescueBox"
    $Shortcut.IconLocation = "$RB_HOME\icon.ico"
    $Shortcut.Save()
  }

  Write-Output "Installing RB Server...from $RB_HOME"

  $PATH=$env:Path

  $PYTHON_VERSION="python311"
  $RB_PYTHON="$env:USERPROFILE\$PYTHON_VERSION"
  $RB_PYTHON="$RB_HOME\$PYTHON_VERSION"
  #$env:PATH = "$env:USERPROFILE;$env:USERPROFILE\AppData\Local\Programs\Python"
  $env:Path= $RB_PYTHON
  if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){

      # " if folder [$RB_PYTHON]  exists uninstall python "
      if (Test-Path -Path $RB_PYTHON) {
        Write-Output "Un Installing pre existing Python 3.11"
        Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
      }
    } else {
      mkdir "$RB_PYTHON"
      Write-Output "No pre existing Python 3.11 for RB found, proceed with new Install to $RB_PYTHON"
    }

  Write-Output "PROGRESS 2 of 5"

  if (-Not (Get-Command 'python.exe' -ErrorAction SilentlyContinue)){
    #$yn = Read-Host "Python is not installed. You must install Python to run RB, Install it now? [Y/n] "
    $yn = "Y"
    $yn = $yn.ToLower()
    if($yn -ne "n"){
      #Write-Output "Downloading installer..."
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      #Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe" -OutFile ".\python-3.12.0.exe"
      Write-Output "Installing Python.."
      # Read-Host "[Press enter to continue]"

      Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/quiet Include_pip=1 TargetDir=$RB_PYTHON /log $RB_LOG\rb-python311-Install.log" -WindowStyle Minimized -Wait

      #.\python-3.12.6-amd64.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0"
    }else{
      Write-Output "Please install python https://python.org"
      # Read-Host "[Press enter to continue]"
    }
  }
} # end of new install

Write-Output "PROGRESS 3 of 5"

$PSDefaultParameterValues = @{'Out-File:Encoding' = 'Default'}
$env:Path="$RB_PYTHON;$env:Path;$RB_PYTHON\Scripts;$PATH"
if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){
  Write-Output "Python is installed."
  if (Test-Path -Path "$RB_PYTHON\scripts\pip.exe") {
    & cmd.exe /c "$RB_PYTHON\scripts\pip.exe -V"
    Write-Output "Install 3.11 pipenv.exe"
    Start-Process -FilePath "$RB_PYTHON\scripts\pip.exe" -ArgumentList "install pipenv > $RB_LOG\rb_py.log 2>$RB_LOG\rb_py_err.log" -WindowStyle Minimized -Wait
  } else {
    Write-Output "Install pip.exe"
    & cmd.exe /c "$RB_PYTHON\python.exe -m ensurepip --user && pip -V"
    Write-Output "Install pipenv.exe"
    Start-Process -FilePath "pip.exe" -ArgumentList "install pipenv > $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait
  }

  Write-Output "Install pip requirements.txt"
  Start-Process -FilePath "pip.exe" -ArgumentList "install -r $RB_HOME\requirements.txt >> $RB_LOG\rb_py.log" -WindowStyle Minimized -Wait

	Write-Output "Installing Python modules..."
	Set-Location $RB_HOME\plugin_apps\audio-transcription
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--rm >> $RB_LOG\rb_py.log" -WindowStyle Minimized -Wait
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log" -WindowStyle Minimized -Wait
	Set-Location $RB_HOME\plugin_apps\audio-transcription\audio_transcription
  Write-Output "Starting Model Server..audio_transcription"
  Start-Process cmd -PassThru -ArgumentList "/c start /b $RB_PYTHON\scripts\pipenv.exe run python server.py" -NoNewWindow
  $a=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ParentProcessId | Format-Table -HideTableHeaders | Out-String).Trim()
  Write-Output "pid is audio=$a"
	"audio=$a" | Out-File  $RB_LOG\rb_process.txt -Append
  Write-Output "PROGRESS 5 of 5"
} else {
	Set-Location $RB_HOME\plugin_apps\FaceMatch
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--rm >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait

  Start-Process cmd -PassThru -ArgumentList "/c start /b $RB_PYTHON\scripts\pipenv.exe run python.exe -m src.facematch.face_match_server" -NoNewWindow
  $f=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ParentProcessId | Format-Table -HideTableHeaders | Out-String).Trim()
  $f | ForEach-Object {
    Write-Host $_
    if ($_ -notin $a.ToArray()) {
      Write-Output "pid is facematch=$_" | Out-File  $RB_LOG\rb_process.txt -Append
    }
  }
  $pids = $f + $a.ToArray()
  Write-Output "all pid is $pids"

  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/yolov8n-face.pt?csf=1&web=1&e=IEEIKB"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/dffd_M_unfrozen.ckpt?csf=1&web=1&e=FULPVd"
  # this file is 1.5 gb hence download during deploy is needed
  #$FilePath = "$RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights\dffd_M_unfrozen.ckpt"
  # another is middle_checkpoint.pth .5 gb to be added here
  # use 2gb fix or uncomment download large file below
  # Invoke-WebRequest -Uri $DownloadURL -OutFile $FilePath

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--rm >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection
	$image = Start-Process cmd -PassThru -ArgumentList "/k pipenv run python.exe model_server.py" -WindowStyle Minimized
  "dfImage= $image.Id" | Out-File $RB_LOG\rb_process.txt -Append

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\video_detector
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--rm >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait
  Start-Process -FilePath "$RB_PYTHON\scripts\pipenv.exe" -ArgumentList "--python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log" -WindowStyle Hidden -Wait

	$video = Start-Process cmd -PassThru -ArgumentList "/k pipenv run python.exe server.py" -WindowStyle Minimized
  "dfVideo= $video.Id" | Out-File $RB_LOG\rb_process.txt -Append

  Write-Output "PROGRESS 5 of 5"
	Write-Output "Installation complete. detailed log is in $RB_LOG\rb_py.log"
}
