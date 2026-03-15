@echo off
echo === Portfolio Backend - Windows Local Setup ===
echo.

REM Create virtual environment
python -m venv venv
if errorlevel 1 (echo [ERROR] Python not found. Install from https://python.org && pause & exit /b 1)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies (no Pillow - uses URL-based images for local dev)
pip install -r requirements.txt

REM Copy env file
if not exist .env (
    copy .env.example .env
    echo [OK] Created .env from .env.example
) else (
    echo [SKIP] .env already exists
)

REM Run migrations
python manage.py makemigrations portfolio
python manage.py migrate

REM Seed demo data
python manage.py seed_data --username admin --password admin123

echo.
echo === Setup Complete! ===
echo Run the server with:
echo   venv\Scripts\activate
echo   python manage.py runserver
echo.
echo Admin login: admin / admin123
echo Backend URL: http://localhost:8000
echo.
pause
