$authFile = "$env:APPDATA\com.vercel.cli\Data\auth.json"
$mcpFile = "C:\Users\Likitha Reddy\.gemini\config\mcp_config.json"

if (Test-Path $authFile) {
    $auth = Get-Content $authFile | ConvertFrom-Json
    $token = $auth.token
    
    $config = @{
        mcpServers = @{
            vercel = @{
                serverUrl = "https://mcp.vercel.com"
                headers = @{
                    Authorization = "Bearer $token"
                }
            }
        }
    }
    
    $config | ConvertTo-Json -Depth 5 | Set-Content $mcpFile -Encoding UTF8
    Write-Host "CONFIG_UPDATED_SUCCESSFULLY"
} else {
    Write-Host "AUTH_FILE_MISSING"
}
