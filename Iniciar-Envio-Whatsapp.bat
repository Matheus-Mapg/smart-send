@echo off
setlocal

set "LOG=startup.log"
set "ERR_FILE=error.tmp"
set "WRAPPER=run_prod_temp.bat"

:: Cria um wrapper temporário que executa o comando e redireciona erro
(
    echo @echo off
    echo cmd /C "npm run start:prod" 2^> "%ERR_FILE%"
) > %WRAPPER%

:: Executa o wrapper em segundo plano
start /B "" cmd /C %WRAPPER%

:: Aguarda 5 segundos para verificar erro inicial
timeout /t 5 >nul

:: Se o arquivo de erro tiver conteúdo, salva no log
if exist %ERR_FILE% (
    for %%A in (%ERR_FILE%) do if %%~zA gtr 0 (
        echo [%DATE% %TIME%] ERRO ao iniciar npm run start:prod >> %LOG%
        type %ERR_FILE% >> %LOG%
        echo. >> %LOG%
    )
)

:: Limpa arquivos temporários
del %ERR_FILE% >nul 2>&1
del %WRAPPER% >nul 2>&1
