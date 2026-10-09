$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"

Set-Location "C:\Users\scratch\storycraft-local"

Write-Host "Installing backend dependencies (express, cors, dotenv)..."
& "$nodeDir\npm.cmd" install express cors dotenv --save

Write-Host "Verifying package.json and node_modules..."
Get-ChildItem -Path "node_modules" | Measure-Object | Select-Object -ExpandProperty Count
