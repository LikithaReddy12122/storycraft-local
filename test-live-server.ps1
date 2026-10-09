$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"

Set-Location "C:\Users\scratch\storycraft-local"

Write-Host "Starting server on port 3000..."
$proc = Start-Process -FilePath "$nodeDir\node.exe" -ArgumentList "server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

try {
    Write-Host "Checking /api/health..."
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health"
    Write-Host "Health status: $($health.status), AI Configured: $($health.aiConfigured)"

    Write-Host "Testing /api/chat with Hyderabad 3000 query..."
    try {
        $body = @{ message = "Plan a two-day trip to Hyderabad within ₹3,000." } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Response received: $($res | ConvertTo-Json)"
    } catch {
        Write-Host "Expected 401 response (missing key): $($_.Exception.Message)"
    }
} finally {
    Write-Host "Stopping test server process..."
    Stop-Process -Id $proc.Id -Force
}
