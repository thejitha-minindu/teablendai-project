@echo off
REM Check if venv exists, if not, create it
IF NOT EXIST venv (
    python -m venv venv
)

REM Detect if running in PowerShell
SET "SHELL=%ComSpec%"
SET "PS1=%__PSLockDownPolicy%"

IF DEFINED PS1 (
    REM PowerShell: use Activate.ps1
    powershell -ExecutionPolicy ByPass -File venv\Scripts\Activate.ps1
) ELSE (
    REM CMD: use activate.bat
    call venv\Scripts\activate.bat
)

REM Install dependencies
python.exe -m pip install --upgrade pip
python.exe -m pip install -r requirements.txt

REM Run the FastAPI app
uvicorn src.application.main:app --reload