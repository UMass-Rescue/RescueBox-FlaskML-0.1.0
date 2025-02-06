# Copyright (c) 2024 RescueBox authors
# This file is part of RescueBox.

# RescueBox is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

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
$PYTHON_SETUP=$false
$PYTHON_VERSION="python311"
$RB_PYTHON="$RB_HOME\$PYTHON_VERSION"

$a="$RB_HOME\plugin_apps\audio-transcription\audio_transcription\server.py"
$b="$RB_PYTHON\python.exe"
$c="$RB_PYTHON\scripts\pipenv.exe"
if (Test-Path -Path "$a,$b,$c") {
    $PYTHON_SETUP=$true
    Remove-Item "$RB_LOG\* -Recurse -Force"
} else {
  $PYTHON_SETUP=$false
}
# create a fresh set of pids , we dont install python however we restart all model servers
$content = "# rb pids"
$content | Out-File  $RB_LOG\rb_process.txt -Append


if (Test-Path -Path "$RB_LOG\rb_server.log") {
  Write-Host "RB_LOG deployed py log exists..!"
  Remove-Item "$RB_LOG\rb_server.log"
}
if (!$PYTHON_SETUP) {
  Set-Location $RB_HOME

  Write-Output "Installing RB Server from $RB_HOME"
  # remember existing path
  $PATH=$env:Path

  # temporary change path
  $env:Path= $RB_PYTHON
  # if folder [$RB_PYTHON]  exists uninstall python
  if (Test-Path -Path $RB_PYTHON) {
     Write-Output "Pre existing Python 3.11 found"
  } else {
    New-Item "$RB_PYTHON" -ItemType Directory -ea 0
    Write-Output "Python 3.11 for RB not found, proceed to install in $RB_PYTHON"
  }
  # do this cleanup anyway in the case when install was done with HOME=A and then again with HOME=B
  Write-Output "Pre existing Python repair anyway!"
  Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/repair /quiet PrependPath=0" -Wait
  Write-Output "Pre existing Python uninstall in case its left over from previous attempt"
  Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
  Write-Output "S=1"
  if (-Not (Get-Command 'python.exe' -ErrorAction SilentlyContinue)) {
      # Write-Output "Downloading installer..."
      # [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      # Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe" -OutFile ".\python-3.12.0.exe"
      Write-Output "Installing Python.."
      # uninstal in case RB_HOME was a different location and not cleaned up
      Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
      # install to the location we need
      Start-Process -FilePath .\python-3.11.8-amd64.exe -ArgumentList "/repair /quiet Include_pip=1 InstallAllUsers=0 PrependPath=0 TargetDir=$RB_PYTHON /log $RB_LOG\rb-python311-Install.log" -WindowStyle Minimized -Wait
  }
  $PYTHON_SETUP=$false

} # end of new install

$PSDefaultParameterValues = @{'Out-File:Encoding' = 'Default'}
$env:Path="$RB_PYTHON;$env:Path;$RB_PYTHON\Scripts;$PATH"
if ( !$PYTHON_SETUP -and (Get-Command 'python.exe' -ErrorAction SilentlyContinue) ) {
  Write-Output "Python is installed."
  if (Test-Path -Path "$RB_PYTHON\scripts\pip.exe") {
    Write-Output "Found 3.11 pip.exe"
    & cmd.exe /c "$RB_PYTHON\scripts\pip.exe -V"
    Write-Output "Install 3.11 pipenv.exe"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pip.exe install pipenv >$RB_LOG\rb_server.log" -NoNewWindow -Wait
  } else {
    # Sometimes pip is not installed by python msi hence this logic
    Write-Output "Install pip.exe"
    if (Test-Path -Path "$env:APPDATA\Python\Python311") {
      Remove-Item "$env:APPDATA\Python\Python311" -Recurse -Force
    }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\python.exe -m ensurepip --user > $RB_LOG\rb_server.log && pip -V" -NoNewWindow -Wait
    if (Test-Path -Path "$env:APPDATA\Python\Python311") {
        Write-Output "re install pip.exe"
        New-Item "$RB_PYTHON\scripts" -ItemType Directory -ea 0
        Set-Location $RB_PYTHON\scripts
        Copy-Item -Path "$env:APPDATA\Python\Python311\Scripts\pip3.exe" -Destination "$RB_PYTHON\scripts\pip.exe" -Recurse
        Copy-Item -Path "$env:APPDATA\Python\Python311\site-packages" -Destination "$RB_PYTHON\Lib\site-packages" -Recurse
        Write-Output "Install pipenv.exe"
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c  $RB_PYTHON\scripts\pip.exe install pipenv >$RB_LOG\rb_server.log 2> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
    }
    # maybe clean registry could help ?
    # Get-ChildItem -Path "HKLM:\Software" -Recurse -Name *3.11*
    # Remove-Item -Path "HKLM:\SOFTWARE\YourKeyName" -Recurse -Force
  }
  Write-Output "S=1"
  Write-Output "Install pip requirements.txt"
  Set-Location $RB_PYTHON\scripts
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pip.exe install -r $RB_HOME\requirements.txt >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait

	Write-Output "Installing Python modules..."
	Set-Location $RB_HOME\plugin_apps\audio-transcription
  # Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  $PYTHON_SETUP=$true
  Write-Output "S=1"
}
if ($PYTHON_SETUP) {
  Set-Location $RB_HOME\plugin_apps\audio-transcription\audio_transcription
  Write-Output "Starting Model Server..audio_transcription"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b $RB_PYTHON\scripts\pipenv.exe run python server.py" -NoNewWindow
  $a=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()
  Write-Output "pid is audio=$a"
	"audio=$a" | Out-File  $RB_LOG\rb_process.txt -Append
  # do all 4 servers
  Write-Output "S=1"
	Set-Location $RB_HOME\plugin_apps\FaceMatch
  # Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  # copy weights , other pre-reqs to prevent download

  Copy-Item -Path "$RB_HOME\plugin_apps\audio-transcription\.cache" -Destination "$env:USERPROFILE" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.deepface" -Destination "$env:USERPROFILE" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights" -Destination "$env:USERPROFILE\.deepface" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.matplotlib" -Destination "$env:USERPROFILE" -Recurse -ea 0
  Copy-Item -Path "$RB_HOME\plugin_apps\FaceMatch\.keras" -Destination "$env:USERPROFILE" -Recurse -ea 0
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
  # Write-Output "facematch pid is f=$f"
  # Write-Output "audio and facematch pid are $pids"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/yolov8n-face.pt?csf=1&web=1&e=IEEIKB"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/dffd_M_unfrozen.ckpt?csf=1&web=1&e=FULPVd"
  # this file is 1.5 gb hence download during deploy is needed
  #$FilePath = "$RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights\dffd_M_unfrozen.ckpt"
  # another is middle_checkpoint.pth .5 gb to be added here
  # use 2gb fix or uncomment download large file below
  # Invoke-WebRequest -Uri $DownloadURL -OutFile $FilePath
	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model
  # Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  Write-Output "S=1"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait

	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection
	Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b pipenv run python.exe model_server.py" -NoNewWindow
  $img=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()

  $i=$img.split([Environment]::NewLine)
  foreach ($e in $i) {
    $et=$e.trim()
    if ($et -and $et -notin $pids) {
      Write-Output "pid is dfImage=$et"
      "dfImage=$et" | Out-File  $RB_LOG\rb_process.txt -Append
      $pids +=$et
    }
  }
  Write-Output "S=1"
	Set-Location $RB_HOME\plugin_apps\DeepFakeDetector\video_detector
  # Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --rm >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c $RB_PYTHON\scripts\pipenv.exe --python  $RB_PYTHON\python.exe sync >> $RB_LOG\rb_server.log 2>> $RB_LOG\rb_server_err.log" -NoNewWindow -Wait

  Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b pipenv run python.exe server.py" -NoNewWindow
  $vid=(Get-CimInstance -Class Win32_Process -Filter "name ='pipenv.exe'" | Select-Object ProcessId | Format-Table -HideTableHeaders | Out-String).Trim()

  $v=$vid.split([Environment]::NewLine)
  foreach ($e in $v) {
    $et=$e.trim()
    if  ($et -notin $pids -and $et) {
      Write-Output "pid is dfVideo=$et"
      "dfVideo=$et" | Out-File  $RB_LOG\rb_process.txt -Append
      $pids += $et
    }
  }
  # sleep for a little to allow servers to start , better would be to make a call to rest-api.
  # Start-Sleep -Seconds 30
  if ($pids.Length -gt 3 ) {
    Write-Output "S=1"
  } else {
    Write-Output "Expected 4 server not started ok ${pids}"
    Write-Output "PROGRESS 4 of 5"
    Write-Output "Installation complete with errors. python details in log $RB_LOG\rb_server.log"
  }
}
Write-Output "powershell process exit with code 0"
exit 0
