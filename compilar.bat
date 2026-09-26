@echo off
setlocal

echo.
echo ========================================
echo            COMPILANDO AURA
echo ========================================
echo.

REM Ir siempre a la carpeta donde esta este .bat
cd /d "%~dp0"

echo [1/4] Limpiando compilaciones anteriores...
echo.

if exist "build" (
    rmdir /s /q "build"
)

if exist "dist" (
    rmdir /s /q "dist"
)

if exist "AURA.spec" (
    del /q "AURA.spec"
)

echo Limpieza completada.
echo.

echo [2/4] Comprobando Python...
echo.

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: No se encuentra Python en:
    echo .venv\Scripts\python.exe
    echo.
    pause
    exit /b 1
)

echo Python encontrado.
echo.

echo [3/4] Compilando AURA...
echo.

".venv\Scripts\python.exe" -m PyInstaller ^
    --onefile ^
    --windowed ^
    --name AURA ^
    --icon "assets\aura.ico" ^
    --add-data "frontend;frontend" ^
    --add-data "library;library" ^
    --add-data "assets;assets" ^
    "backend\main.py"

if errorlevel 1 (
    echo.
    echo ========================================
    echo          ERROR AL COMPILAR AURA
    echo ========================================
    echo.
    echo PyInstaller ha encontrado un error.
    echo Revisa el mensaje anterior.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Comprobando resultado...
echo.

if not exist "dist\AURA.exe" (
    echo ERROR: La compilacion termino pero no se encontro:
    echo dist\AURA.exe
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo          AURA COMPILADA CORRECTAMENTE
echo ========================================
echo.
echo Ejecutable:
echo %CD%\dist\AURA.exe
echo.
echo La musica incluida tambien ha sido
echo empaquetada dentro del ejecutable.
echo.

pause