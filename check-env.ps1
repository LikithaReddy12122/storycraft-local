$envUser = [System.Environment]::GetEnvironmentVariables('User')
foreach ($k in $envUser.Keys) {
    if ($k -match 'GEMINI|OPENAI|ANTHROPIC|AI|TOKEN|KEY') {
        Write-Host "User Env: $k"
    }
}
$envSys = [System.Environment]::GetEnvironmentVariables('Machine')
foreach ($k in $envSys.Keys) {
    if ($k -match 'GEMINI|OPENAI|ANTHROPIC|AI|TOKEN|KEY') {
        Write-Host "System Env: $k"
    }
}
