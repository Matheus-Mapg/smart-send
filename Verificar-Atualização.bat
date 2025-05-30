@echo off
setlocal ENABLEDELAYEDEXPANSION

set "LOG=startup.log"
set "LAST_COMMIT_FILE=.last_commit_hash"
set "BRANCH=main"

(
    echo ----- %DATE% %TIME% -----

    :: Carrega o último commit registrado
    if exist %LAST_COMMIT_FILE% (
        set /p last_commit=<%LAST_COMMIT_FILE%
    ) else (
        set last_commit=
    )

    :: Atualiza refs do repositório remoto (mas sem dar pull ainda)
    echo Buscando atualizações remotas...
    git fetch

    :: Captura commit local atual
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set current_commit=%%i

    :: Captura commit mais recente do remoto
    for /f %%i in ('git rev-parse origin/%BRANCH% 2^>nul') do set remote_commit=%%i

    echo local:  !current_commit!
    echo remoto: !remote_commit!

    :: Verifica se há commits novos no remoto
    if not "!current_commit!"=="!remote_commit!" (
        echo Novos commits detectados no remoto. Executando git pull...
        git pull

        :: Atualiza o commit após pull
        for /f %%i in ('git rev-parse HEAD 2^>nul') do set current_commit=%%i

        :: Verifica se o commit mudou em relação ao último salvo
        if not "!last_commit!"=="!current_commit!" (
            echo Novo commit detectado: !current_commit!
            echo Executando: npm install
            call npm install
            echo Executando: npm run build
            call npm run build
        ) else (
            echo Nenhuma alteração de código. Ignorando build.
        )
    ) else (
        echo Nenhum commit novo no repositório remoto.
    )

    echo ----------------------------------------
) > %LOG% 2>&1

:: Salva o commit atual no arquivo de controle
<nul set /p =!current_commit! > %LAST_COMMIT_FILE%
