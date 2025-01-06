# powershell install python and download source to RBHOME folder
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
$RBHOME=$PSScriptRoot
$RBLOG= "$env:APPDATA\RescueBox-Desktop\logs"
# C:\Users\xxx\AppData\Roaming\RescueBox-Desktop\logs
Write-Output "RBHOME $RBHOME"
# as early as possible indicate deployment
$content = "# rb pids"
$content | Out-File  $RBHOME\rb_process.txt -Append

$SKIP_INSTALL=$false
if (Test-Path -Path "$RBLOG\rb_py.log") {
  Write-Host "RBLOG deployed py log exists..!"
  Remove-Item "$RBLOG\rb_py.log" -verbose
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
  #Copy-Item $launcher "$RBHOME\rb.bat" -force

  # SKIP instead call  stop service rb.py from nsis uninstall nsh
  cd $RBHOME
  if($installDesktopFile -eq "true"){
    $WshShell = New-Object -comObject WScript.Shell
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $Shortcut = $WshShell.CreateShortcut("$DesktopPath\RB.lnk")
    $Shortcut.TargetPath = "%comspec%"
    $Shortcut.Arguments = "/c start CALL $RBHOME\rb.bat --shortcut"
    $Shortcut.Description = "RescueBox"
    $Shortcut.IconLocation = "$RBHOME\icon.ico"
    $Shortcut.Save()
  }

  Write-Output "Installing RB Server...from $RBHOME"

  $PATH=$env:Path

  $PYTHON_VERSION="python311"
  $RB_PYTHON="$env:USERPROFILE\$PYTHON_VERSION"
  #$env:PATH = "$env:USERPROFILE;$env:USERPROFILE\AppData\Local\Programs\Python"
  $env:Path= $RB_PYTHON
  if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){

      # " if folder [$RB_PYTHON]  exists uninstall python "
      if (Test-Path -Path $RB_PYTHON) {
        Write-Output "Un Installing pre existing Python 3.11"
        Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
      }
    } else {
      mkdir "$env:USERPROFILE\python311"
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

      Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/repair /quiet InstallAllUsers=0 PrependPath=1 Include_tools=1 Include_lib=1 Include_pip=1 Include_test=0 TargetDir=$env:USERPROFILE\python311 /log $RBLOG\rb-python311-Install.log" -Wait

      #.\python-3.12.6-amd64.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0"
    }else{
      Write-Output "Please install python https://python.org"
      # Read-Host "[Press enter to continue]"
    }
  }
} # end of new install

Write-Output "PROGRESS 3 of 5"

$PSDefaultParameterValues = @{'Out-File:Encoding' = 'UTF8'}
$env:Path= "$RB_PYTHON;$env:Path;$RB_PYTHON\Scripts"
if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){
  Write-Output "Debug test ."
  python -V
  pipenv.exe --rm >> $RBLOG\rb_py.log
  Write-Output "Python is installed."
  $debug = Start-Process -FilePath "$RB_PYTHON\python.exe" -ArgumentList '-V' -WindowStyle Hidden -Wait
  Write-Output "debug from python -V $debug"
	Write-Output "Installing Python modules..."
  $env:Path="$RB_PYTHON;$env:Path;$RB_PYTHON\Scripts;$PATH"
	python -V
  pip install pipenv > $RBLOG\rb_py.log
  pip install -r $RBHOME\requirements.txt >> $RBLOG\rb_py.log
	Set-Location $RBHOME\plugin_apps\audio-transcription
  pipenv.exe --rm >> $RBLOG\rb_py.log
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBLOG\rb_py.log
	Set-Location $RBHOME\plugin_apps\audio-transcription\audio_transcription
  Write-Output "Starting Model Server..audio_transcription"
  $audio = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python server.py' -WindowStyle Minimized
  $p=$audio.Id
  Write-Output "pid is audio=$p"
	"audio=$p" | Out-File  $RBHOME\rb_process.txt -Append
  Write-Output "PROGRESS 5 of 5"
} else {
	Set-Location $RBHOME\plugin_apps\FaceMatch
  pipenv.exe --rm >> $RBLOG\rb_py.log
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBLOG\rb_py.log
	$face = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe -m src.facematch.face_match_server' -WindowStyle Minimized
  "facematch= $face.Id" | Out-File  $RBHOME\rb_process.txt -Append

  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/yolov8n-face.pt?csf=1&web=1&e=IEEIKB"
  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/dffd_M_unfrozen.ckpt?csf=1&web=1&e=FULPVd"
  # this file is 1.5 gb hence download during deploy is needed
  #$FilePath = "$RBHOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights\dffd_M_unfrozen.ckpt"
  # another is middle_checkpoint.pth .5 gb to be added here
  # use 2gb fix or uncomment download large file below
  # Invoke-WebRequest -Uri $DownloadURL -OutFile $FilePath

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\image_model
  pipenv.exe --rm >> $RBLOG\rb_py.log
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBLOG\rb_py.log

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection
	$image = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe model_server.py' -WindowStyle Minimized
  "dfImage= $image.Id" | Out-File $RBHOME\rb_process.txt -Append

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\video_detector
  pipenv.exe --rm >> $RBLOG\rb_py.log
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBLOG\rb_py.log

	$video = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe server.py' -WindowStyle Minimized
  "dfVideo= $video.Id" | Out-File $RBHOME\rb_process.txt -Append

  Write-Output "PROGRESS 5 of 5"
	Write-Output "Installation complete. detailed log is in $RBLOG\rb_py.log"
}
