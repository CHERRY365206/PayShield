@echo off
set JAVA_HOME=C:\Users\Dell\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.13.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
echo ========================================================
echo   Starting PayShield Backend (Port 8080)
echo   Profiles: dev (Zero-config embedded DB)
echo ========================================================
cd /d %~dp0backend
call E:\pay\maven\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
