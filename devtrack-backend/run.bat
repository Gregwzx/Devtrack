@echo off
SET JAVA_HOME=C:\Program Files\Java\jdk-21
echo ============================================
echo   DevTrack Backend
echo ============================================

echo Configurando conexao totalmente OFFLINE (localhost)...
set LOCAL_IP=127.0.0.1

echo IP detectado: %LOCAL_IP%
echo Atualizando .env.local do projeto mobile...
echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:8080 > "..\devtrack-mobile\.env.local"

echo.
echo ANTES DE CONTINUAR:
echo  1. Abra o XAMPP Control Panel
echo  2. Clique "Start" no MySQL
echo  3. O banco "devtrack" sera criado automaticamente
echo.
echo Swagger: http://localhost:8080/swagger-ui.html
echo Mobile URL: http://%LOCAL_IP%:8080
echo ============================================
echo.
pause
.\mvnw.cmd spring-boot:run
