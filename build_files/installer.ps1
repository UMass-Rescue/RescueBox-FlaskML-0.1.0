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
$DIR=Get-Variable -Name PSScriptRoot

# if needed download zip and extract
# Expand-Archive C:\a.zip -DestinationPath C:\a

# interactive if needed
# $yn = Read-Host "Add desktop shortcut? [Y/n] "
$yn = "Y"
$yn = $yn.ToLower()
if($yn -eq "n"){$installDesktopFile="false"}else{$installDesktopFile="true"}

# CWD "AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server"
$RBHOME=$DIR

$launcher=".installer\launchers\windows.bat"

cd $DIR
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


mkdir $RBHOME 2>$null
mkdir "$RBHOME\docs" 2>$null
Write-Output "Installing RB Server...to $RBHOME"
Copy-Item $launcher "$RBHOME\rb.bat" -force

#Write-Output "Installing builtin plugins..."
#Copy-Item plugin_apps\* "$RBHOME\" -Recurse -force

#Write-Output "Installing RB Start script.."
#Copy-Item ".\rb.py" "$RBHOME\rb.py" -force


#Write-Output "Installing icons..."
##Copy-Item ".\icon.ico" "$RBHOME\rb.ico"

<#
mkdir "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\rb\" 2>$null
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\rb\RB.lnk")
$Shortcut.TargetPath = "%comspec%"
$Shortcut.Arguments = '/c start "" CALL "$RBHOME\rb.bat" --shortcut'
$Shortcut.Description = "RB Server"
$Shortcut.IconLocation = "$RBHOME\rb.ico"
$Shortcut.Save()
#>

$PATH=$env:Path

$PYTHON_VERSION="python311"
$RB_PYTHON="$env:USERPROFILE\$PYTHON_VERSION"
#$env:PATH = "$env:USERPROFILE;$env:USERPROFILE\AppData\Local\Programs\Python"
$env:Path= $RB_PYTHON
if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){

		# " if folder [$RB_PYTHON]  exists uninstall python "
		if (Test-Path -Path $RB_PYTHON) {
			Write-Output "Un Installing Python 311"
			Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/uninstall /quiet" -Wait
		}
	} else {
		mkdir "$env:USERPROFILE\python311"
	}

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

		Start-Process -FilePath .\python-3.11.2-amd64.exe -ArgumentList "/repair /quiet InstallAllUsers=0 PrependPath=1 Include_tools=1 Include_lib=1 Include_pip=1 Include_test=0 TargetDir=$env:USERPROFILE\python311 /log $env:USERPROFILE\rb-python311-Install.log" -Wait

		#.\python-3.12.6-amd64.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0"
	}else{
		Write-Output "Please install python https://python.org"
		# Read-Host "[Press enter to continue]"
	}
}

$PSDefaultParameterValues = @{'Out-File:Encoding' = 'UTF8'}
$env:Path= "$RB_PYTHON;$env:Path;$RB_PYTHON\Scripts"
if (Get-Command 'python.exe' -ErrorAction SilentlyContinue){
	Write-Output "Installing Python modules..."
	python -V
	pip.exe install pipenv > $RBHOME\rb_py.log 2>&1
	pip.exe install -r requirements.txt >> $RBHOME\rb_py.log 2>&1

  $content = "# rb pids"
  $content | Out-File  $RBHOME\rb_process.txt -Append
	Set-Location $RBHOME\plugin_apps\audio-transcription
	pipenv.exe --rm >> $RBHOME\rb_py.log 2>&1
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBHOME\rb_py.log 2>&1
	Set-Location $RBHOME\plugin_apps\audio-transcription\audio_transcription
	$audio = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python server.py' -WindowStyle Minimized
	$audio.Id | Out-File  $RBHOME\rb_process.txt -Append

	Set-Location $RBHOME\plugin_apps\FaceMatch
	pipenv.exe --rm >> $RBHOME\rb_py.log 2>&1
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBHOME\rb_py.log 2>&1
	$face = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe -m src.facematch.face_match_server' -WindowStyle Minimized
    $face.Id | Out-File  $RBHOME\rb_process.txt -Append

  #$DownloadURL = "https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/yolov8n-face.pt?csf=1&web=1&e=IEEIKB"
  $DownloadURL = https://umass-my.sharepoint.com/:u:/r/personal/jaikumar_umass_edu/Documents/dffd_M_unfrozen.ckpt?csf=1&web=1&e=FULPVd
  # this file is 1.5 gb hence download during deploy is needed
  $FilePath = "$RBHOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection\weights\dffd_M_unfrozen.ckpt"
  # another is middle_checkpoint.pth .5 gb to be added here
  Invoke-WebRequest -Uri $DownloadURL -OutFile $FilePath

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\image_model
	pipenv.exe --rm >> $RBHOME\rb_py.log 2>&1
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBHOME\rb_py.log 2>&1

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\image_model\binary_deepfake_detection
	$image = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe model_server.py' -WindowStyle Minimized
    $image.Id | Out-File $RBHOME\rb_process.txt -Append

	Set-Location $RBHOME\plugin_apps\DeepFakeDetector\video_detector
	pipenv.exe --rm >> $RBHOME\rb_py.log 2>&1
	pipenv.exe  --python  $RB_PYTHON\python.exe sync >> $RBHOME\rb_py.log 2>&1

	$video = Start-Process cmd -PassThru -ArgumentList '/k pipenv run python.exe server.py' -WindowStyle Minimized
    $video.Id | Out-File $RBHOME\rb_process.txt -Append

	$env:Path=$PATH
	Write-Output "Installation complete. detailed log is in $RBHOME\rb_py.log"
}
