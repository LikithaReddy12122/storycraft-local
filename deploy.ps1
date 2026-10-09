$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
[System.Environment]::SetEnvironmentVariable("PATH", "$nodeDir;" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User"), "Process")

Write-Host "Checking Vercel CLI..." -ForegroundColor Cyan
& "$nodeDir\npx.cmd" vercel --version

Write-Host "Attempting deployment to Vercel..." -ForegroundColor Cyan
& "$nodeDir\npx.cmd" vercel deploy --yes
