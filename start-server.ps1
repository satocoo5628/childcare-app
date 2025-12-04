# Simple HTTP Server for Childcare App
$port = 8000
$path = $PSScriptRoot

Write-Host "========================================"
Write-Host "Server starting on port $port"
Write-Host "========================================"
Write-Host ""

# Get IP Address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*'}).IPAddress | Select-Object -First 1

Write-Host "Access from PC: http://localhost:$port"
Write-Host "Access from phone: http://${ip}:$port"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server"
Write-Host "========================================"
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://${ip}:$port/")
$listener.Start()

Write-Host "Server running..."
Write-Host ""

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $requestPath = $request.Url.LocalPath
    if ($requestPath -eq '/') { $requestPath = '/index.html' }
    
    $filePath = Join-Path $path $requestPath.TrimStart('/')
    
    Write-Host "$(Get-Date -Format 'HH:mm:ss') $requestPath"
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        
        $ext = [System.IO.Path]::GetExtension($filePath)
        $response.ContentType = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.js'   { 'application/javascript; charset=utf-8' }
            '.json' { 'application/json; charset=utf-8' }
            default { 'application/octet-stream' }
        }
        
        $response.OutputStream.Write($content, 0, $content.Length)
        $response.OutputStream.Close()
    }
    else {
        $response.StatusCode = 404
        $response.Close()
    }
}
