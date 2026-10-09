$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
[System.Environment]::SetEnvironmentVariable("PATH", "$nodeDir;" + [System.Environment]::GetEnvironmentVariable("PATH", "Process"), "Process")
& "$nodeDir\node.exe" --version
& "$nodeDir\npm.cmd" --version
