@echo off
echo ========================================
echo 成長記録アプリ - ローカルサーバー起動
echo ========================================
echo.
echo このウィンドウを開いたまま、スマホのブラウザで以下のアドレスを開いてください：
echo.
echo http://localhost:8000
echo.
echo 同じWi-Fi内のスマホからアクセスする場合は、
echo このPCのIPアドレスを確認してください。
echo.
echo サーバーを停止するには、このウィンドウを閉じてください。
echo ========================================
echo.

REM PowerShellでHTTPサーバーを起動
powershell -Command "& {$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://+:8000/'); $listener.Start(); Write-Host 'サーバーが起動しました！'; Write-Host ''; Write-Host 'PCのIPアドレス:'; (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*'}).IPAddress; Write-Host ''; Write-Host 'スマホから http://[上記のIPアドレス]:8000 でアクセスできます'; Write-Host ''; Write-Host 'サーバーを停止するには Ctrl+C を押してください'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $filePath = Join-Path $PSScriptRoot $path.TrimStart('/'); if (Test-Path $filePath) { $content = [System.IO.File]::ReadAllBytes($filePath); $response.ContentLength64 = $content.Length; $ext = [System.IO.Path]::GetExtension($filePath); $contentType = switch ($ext) { '.html' { 'text/html; charset=utf-8' } '.css' { 'text/css; charset=utf-8' } '.js' { 'application/javascript; charset=utf-8' } '.json' { 'application/json; charset=utf-8' } default { 'application/octet-stream' } }; $response.ContentType = $contentType; $response.OutputStream.Write($content, 0, $content.Length); $response.OutputStream.Close() } else { $response.StatusCode = 404; $response.Close() } } }"
