# Fix all logger error issues comprehensively
param([switch]$DryRun)

$pluginDir = "src/plugins"
$files = Get-ChildItem -Path $pluginDir -Filter "*.ts"
$totalFixed = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileFixed = 0
    
    # Pattern 1: this.logger.error("message", error) - double quotes
    $pattern1 = '(\s+this\.logger\.(error|warn)\()"([^"]+)",\s*(error|err|e)\);'
    $replacement1 = {
        $indent = $matches[1]
        $method = $matches[2]
        $message = $matches[3]
        $errorVar = $matches[4]
        $script:fileFixed++
        "${indent}const errorMsg = $errorVar instanceof Error ? $errorVar.message : String($errorVar);`n${indent}this.logger.$method(```$message`: `${errorMsg}```);" }
    $content = [regex]::Replace($content, $pattern1, $replacement1)
    
    # Pattern 2: this.logger.error(`message`, error) - backticks
    $pattern2 = '(\s+this\.logger\.(error|warn)\()`([^`]+)`,\s*(error|err|e)\);'
    $replacement2 = {
        $indent = $matches[1]
        $method = $matches[2]
        $message = $matches[3]
        $errorVar = $matches[4]
        $script:fileFixed++
        "${indent}const errorMsg = $errorVar instanceof Error ? $errorVar.message : String($errorVar);`n${indent}this.logger.$method(```$message`: `${errorMsg}```);" }
    $content = [regex]::Replace($content, $pattern2, $replacement2)
    
    if ($content -ne $originalContent) {
        if (-not $DryRun) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✓ $($file.Name): Fixed $fileFixed instance(s)" -ForegroundColor Green
        }
        else {
            Write-Host "Would fix $($file.Name): $fileFixed instance(s)" -ForegroundColor Yellow
        }
        $totalFixed += $fileFixed
        $filesModified++
        $fileFixed = 0
    }
}

Write-Host "`n========================================"
Write-Host "✓ Total: $totalFixed instances fixed across $filesModified files" -ForegroundColor Cyan
Write-Host "========================================`n"
