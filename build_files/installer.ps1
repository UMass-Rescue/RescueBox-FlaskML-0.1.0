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

  Write-Output "Installing RB Server from $RB_HOME"

  $PATH=$env:Path

  $PYTHON_VERSION="python311"
  $RB_PYTHON="$env:USERPROFILE\$PYTHON_VERSION"
  $RB_PYTHON="$RB_HOME\$PYTHON_VERSION"
  #$env:PATH = "$env:USERPROFILE;$env:USERPROFILE\AppData\Local\Programs\Python"
  $env:Path= $RB_PYTHON
      # if folder [$RB_PYTHON]  exists uninstall python
  if (Test-Path -Path $RB_PYTHON) {
     Write-Output "Pre existing Python 3.11 found"
  } else {
    New-Item "$RB_PYTHON" -ItemType Directory -ea 0
    Write-Output "No pre existing Python 3.11 for RB found, proceed to install in $RB_PYTHON"
  }
  Write-Output "Pre existing Python repair"
  Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/repair /quiet" -Wait
  Write-Output "Pre existing Python uninstall"
  Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/uninstall /quiet" -Wait

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
      # uninstal in case RB_HOME was a different location and not cleaned up
      Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
      # install to the location we need
      Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/repair /quiet Include_pip=1 InstallAllUsers=0 PrependPath=0 TargetDir=$RB_PYTHON /log $RB_LOG\rb-python311-Install.log" -WindowStyle Minimized -Wait

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
    Write-Output "Found 3.11 pip.exe"
    & cmd.exe /c "$RB_PYTHON\scripts\pip.exe -V"
    Write-Output "Install 3.11 pipenv.exe"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pip.exe install pipenv >$RB_LOG\rb_py.log" -NoNewWindow -Wait
  } else {
    # Sometimes pip is not installed by python msi hence this logic
    Write-Output "Install pip.exe"
    # & cmd.exe /c "msiexec.exe /i $RB_HOME\pip.msi /QN /L*V $RB_LOG\pip_install.log"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\python.exe -m ensurepip --user > $RB_LOG\rb_py.log && pip -V" -NoNewWindow -Wait
    if (Test-Path -Path "$env:APPDATA\Python\Python311\Scripts") {
        Write-Output "Copy pip.exe"
        New-Item "$RB_PYTHON\scripts" -ItemType Directory -ea 0
        Set-Location $RB_PYTHON\scripts
        Copy-Item -Path "$env:APPDATA\Python\Python311\Scripts\pip3.exe" -Destination "$RB_PYTHON\scripts\pip.exe" -Recurse
        Copy-Item -Path "$env:APPDATA\Python\Python311\site-packages" -Destination "$RB_PYTHON\Lib\site-packages" -Recurse
        Write-Output "Install pipenv.exe"
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c  $RB_PYTHON\scripts\pip.exe install pipenv >$RB_LOG\rb_py.log 2> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
    }
    # maybe clean registry could help ?
    # Get-ChildItem -Path "HKLM:\Software" -Recurse -Name *3.11*
    # Remove-Item -Path "HKLM:\SOFTWARE\YourKeyName" -Recurse -Force
  }

  Write-Output "Install pip requirements.txt"
  Set-Location $RB_PYTHON\scripts
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pip.exe install -r $RB_HOME\requirements.txt >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait

	Write-Output "Installing Python modules..."
	Set-Location $RB_HOME\plugin_apps\audio-transcription
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
	Set-Location $RB_HOME\plugin_apps\audio-transcription\audio_transcription
  Write-Output "Starting Model Server..audio_transcription"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b $RB_PYTHON\scripts\pipenv.exe run python server.py" -NoNewWindow
  $a=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()
  Write-Output "pid is audio=$a"
	"audio=$a" | Out-File  $RB_LOG\rb_process.txt -Append
  Write-Output "PROGRESS 4 of 5"
  # do all 4 servers } else {
	Set-Location $RB_HOME\plugin_apps\FaceMatch
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
  # copy weights , other pre-reqs to prevent download
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.deepface" -Destination "$env:USERPROFILE\.deepface" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights" -Destination "$env:USERPROFILE\.deepface" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.matplotlib" -Destination "$env:USERPROFILE\.matplotlib" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.keras" -Destination "$env:USERPROFILE\.keras" -Recurse -ea 0
  Start-Process cmd -PassThru -ArgumentList "/c start /b $RB_PYTHON\scripts\pipenv.exe run python.exe -m src.facematch.face_match_server" -NoNewWindow
  $pids = @()
  $f=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()
  Write-Output "pid is face=$f"
  $a=$f.split([Environment]::NewLine)[0].trim()
  $pids +=$a
  $b=$f.split([Environment]::NewLine)[2].trim()

  $pids +=$b
  $pids | ForEach-Object {
    if ($_ -notin $a) {
      Write-Output "pid is f=$_"
      $f=$_
      "facematch=$f" | Out-File  $RB_LOG\rb_process.txt -Append
    }
  }
  Write-Output "face pid is f=$f"
  Write-Output "all pid is $pids"
  Write-Output "PROGRESS 4 of 5"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/yolov8n-face.pt?csf=1&web=1&e=IEEIKB"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/dffd_M_unfrozen.ckpt?csf=1&web=1&e=FULPVd"
  # this file is 1.5 gb hence download during deploy is needed
  #$FilePath = "$RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights\dffd_M_unfrozen.ckpt"
  # another is middle_checkpoint.pth .5 gb to be added here
  # use 2gb fix or uncomment download large file below
  # Invoke-WebRequest -Uri $DownloadURL -OutFile $FilePath

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection
	Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b pipenv run python.exe model_server.py" -NoNewWindow
  $img=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()

  $myArray = @(0, 2, 4)
  $myArray | ForEach-Object {
    $i=$img.split([Environment]::NewLine)[$_].trim()
    if ($i -notin $pids) {
      Write-Output "pid is dfImage=$i"
      "dfImage=$i" | Out-File  $RB_LOG\rb_process.txt -Append
      $pids +=$i
    }
  }

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\video_detector
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_py.log 2>> $RB_LOG\rb_py_err.log" -NoNewWindow -Wait

  Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b pipenv run python.exe server.py" -NoNewWindow
  $vid=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()

  $myArray = @(0, 2, 4, 6)
  $myArray | ForEach-Object {
    $v=$vid.split([Environment]::NewLine)[$_].trim()
    if ($v -notin $pids) {
      Write-Output "pid is dfVideo=$v"
      "dfVideo=$v" | Out-File  $RB_LOG\rb_process.txt -Append
    }
  }

  Write-Output "PROGRESS 5 of 5"
	Write-Output "Installation complete. detailed log is in $RB_LOG\rb_py.log"
}
