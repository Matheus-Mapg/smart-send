@echo off
setlocal ENABLEDELAYEDEXPANSION

set "LOG=startup.log"
set "LAST_COMMIT_FILE=.last_commit_hash"

:: Limpa o arquivo de log no início
> %LOG% echo ----- LOG INICIADO EM %DATE% %TIME% -----

(
    echo ----- %DATE% %TIME% -----

    if exist %LAST_COMMIT_FILE% (
        for /f %%x in (%LAST_COMMIT_FILE%) do set last_commit=%%x
    ) else (
        set last_commit=
    )

    for /f %%i in ('git rev-parse HEAD 2^>nul') do set current_commit=%%i

    echo last_commit: "!last_commit!"
    echo current_commit: "!current_commit!"

    if not "!last_commit!"=="!current_commit!" (
        echo Novo commit detectado: !current_commit!
        echo Executando: npm install
        call npm install
        echo Executando: npm run build
        call npm run build
    ) else (
        echo Nenhuma alteração de commit detectada. Ignorando execução.
    )

    echo ----------------------------------------
) >> %LOG% 2>&1

<nul set /p =!current_commit! > %LAST_COMMIT_FILE%
