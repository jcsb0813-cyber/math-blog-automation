@echo off
chcp 65001 > nul
rem 사용법: 사진 폴더들이 든 상위 폴더(예: 바탕화면\릴스)를 이 파일 위로 끌어다 놓기.
rem        그냥 더블클릭하면 바탕화면\릴스 폴더를 사용합니다.
rem 결과: <상위 폴더>\완성영상\1번.mp4, 2번.mp4 ...

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=%USERPROFILE%\Desktop\릴스"
if not exist "%TARGET%" (
  echo 폴더를 찾을 수 없습니다: %TARGET%
  echo 바탕화면에 "릴스" 폴더를 만들거나, 폴더를 이 파일 위로 끌어다 놓으세요.
  pause
  exit /b 1
)

set "PY=py"
where py > nul 2>&1 || set "PY=python"
%PY% --version > nul 2>&1 || (
  echo 파이썬이 설치되어 있지 않습니다. https://www.python.org/downloads/ 에서 설치해 주세요.
  echo 설치할 때 "Add python.exe to PATH" 에 꼭 체크하세요.
  pause
  exit /b 1
)

%PY% -m pip install --quiet --disable-pip-version-check pillow imageio-ffmpeg pillow-heif
%PY% "%~dp0make_reel.py" --photos "%TARGET%" --fill --first-only --position third --font-size 80
echo.
echo 완성영상 폴더를 엽니다.
start "" "%TARGET%\완성영상"
pause
