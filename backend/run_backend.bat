@echo off
REM Check if venv exists, if not, create it
IF NOT EXIST venv (
    python -m venv venv
)

REM Activate the virtual environment
call venv\Scripts\activate

REM Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

REM Run the FastAPI app
uvicorn src.application.main:app --host 0.0.0.0 --port 8000 --reload
