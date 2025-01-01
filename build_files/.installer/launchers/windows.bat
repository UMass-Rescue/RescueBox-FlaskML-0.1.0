@echo off
SET systemPath=C:\Program Files\rb\
SET userPath=%userprofile%\AppData\Local\Programs\RescueBox-Desktop\resources\assets\rb_server

IF NOT EXIST %userPath% (
	cls
	echo RB Server Manager
	echo.
	SET /p inst="Would you like to attempt to install RB starter? (Y/n) "
	IF NOT "%inst%"=="n" (
		#py -m pip install -r "%systemPath%\requirements.txt"
		REM To fix colors on Windows inputs
		#py -m pip install pathlib
	)
	echo "Creating user folder..."
	mkdir %userPath%
	cls
)

TITLE RB Server

if "%1" == "--shortcut" (
	py "%userPath%\rb.py"
	exit
) else (
	py "%userPath%\rb.py" %*
	TITLE %comspec%
)
