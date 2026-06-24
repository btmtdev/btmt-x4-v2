# Run on server 10.30.92.66 as Administrator
# Installs AWS CLI v2

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$installer = "$env:TEMP\AWSCLIV2.msi"
Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile $installer -UseBasicParsing
Start-Process msiexec.exe -ArgumentList "/i $installer /quiet /norestart" -Wait
Remove-Item $installer
Write-Host "AWS CLI installed. Restart terminal and verify with: aws --version"
