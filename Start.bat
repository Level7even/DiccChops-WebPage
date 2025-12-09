@echo off
title Local Web Test Server

echo Checking for Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed.
    echo Download it from https://nodejs.org/
    pause
    exit /b
)

echo Starting local test server on http://localhost:8000/
echo Press CTRL+C to stop the server.

REM Start browser
start "" http://localhost:8000/

REM Run simple Node HTTP server
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{let file='.'+req.url;if(file=='./')file='./index.html';fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);res.end('404 Not Found');}else{res.writeHead(200);res.end(d);}});}).listen(8000);"

pause
