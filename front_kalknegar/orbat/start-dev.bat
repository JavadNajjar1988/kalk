@echo off
cd /d "C:\Users\Renderkar\Documents\Bac\Lindu\backend\orbat\Orbat"
echo Current directory: %CD%
if exist package.json (
    echo Found package.json
    if not exist node_modules (
        echo Installing dependencies...
        npm install
    )
    echo Starting development server...
    npm run dev
) else (
    echo package.json not found!
    dir
)