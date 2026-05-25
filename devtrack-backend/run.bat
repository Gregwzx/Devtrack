@echo off
SET JAVA_HOME=C:\Program Files\Java\jdk-21
echo ============================================
echo   DevTrack Backend
echo ============================================
echo.
echo ANTES DE CONTINUAR:
echo  1. Abra o XAMPP Control Panel
echo  2. Clique "Start" no MySQL
echo  3. O banco "devtrack" sera criado automaticamente
echo.
echo Swagger: http://localhost:8080/swagger-ui.html
echo.
pause
.\mvnw.cmd spring-boot:run
