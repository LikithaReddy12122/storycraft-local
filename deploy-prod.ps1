$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
[System.Environment]::SetEnvironmentVariable("PATH", "$nodeDir;" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User"), "Process")

Write-Host "Promoting to Production on Vercel..." -ForegroundColor Cyan
& "$nodeDir\npx.cmd" vercel deploy --prod --yes
