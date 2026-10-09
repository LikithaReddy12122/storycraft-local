$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
[System.Environment]::SetEnvironmentVariable("PATH", "$nodeDir;" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User"), "Process")
Write-Host "Running npm install -g vercel..." -ForegroundColor Cyan
& "$nodeDir\npm.cmd" install -g vercel --no-audit --no-fund
Write-Host "Checking vercel version..." -ForegroundColor Cyan
& "$nodeDir\npx.cmd" vercel --version
