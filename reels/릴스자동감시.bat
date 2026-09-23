@echo off
chcp 65001 > nul
rem 더블클릭하면 바탕화면\릴스 에 1번~100번 폴더를 만들고 계속 지켜봅니다.
rem 폴더에 사진을 넣으면 10초 뒤 그 폴더 안에 영상(예: 1번\1번.mp4)이 만들어집니다.
rem 다른 위치를 쓰려면 그 폴더를 이 파일 위로 끌어다 놓으세요. 끄려면 이 창을 닫으면 됩니다.

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=%USERPROFILE%\Desktop\릴스"

set "PY=py"
where py > nul 2>&1 || set "PY=python"
%PY% --version > nul 2>&1 || (
  echo 파이썬이 설치되어 있지 않습니다. https://www.python.org/downloads/ 에서 설치해 주세요.
  echo 설치할 때 "Add python.exe to PATH" 에 꼭 체크하세요.
  pause
  exit /b 1
)

%PY% -m pip install --quiet --disable-pip-version-check pillow imageio-ffmpeg
start "" "%TARGET%"
%PY% "%~dp0watch_reels.py" --root "%TARGET%" --create 100
pause
