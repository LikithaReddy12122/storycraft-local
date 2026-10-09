$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
$env:NODE_ENV = "test"

Set-Location "C:\Users\scratch\storycraft-local"
Write-Host "Running AI Test Suite..."
& "$nodeDir\node.exe" "tests\test-ai.js"
