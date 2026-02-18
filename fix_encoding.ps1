$filePath = "d:\yobot-remix\yobot_remix\src\client\public\static\clan\arrange.js"

# Read file as binary and detect encoding
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$encoding = [System.Text.Encoding]::GetEncoding(65001)  # UTF-8
$content = $encoding.GetString($bytes)

# List of corrupted characters patterns and their replacements
$replacements = @{
    "鏃ョ粺璁′俊鎭凡淇濆瓨" = "统计数据保存成功"
    "淇濆瓨鏃ョ粺璁′俊鎭澶辫触" = "保存统计数据失败"
    "淇濆瓨鏃ョ粺璁′俊鎭敊璇" = "保存统计数据错误"
    "鍔犺浇鏃ョ粺璁′俊鎭敊璇" = "加载统计数据错误"
}

foreach ($key in $replacements.Keys) {
    if ($content.Contains($key)) {
        $content = $content.Replace($key, $replacements[$key])
        Write-Host "Replaced: $key"
    }
}

# Write back with UTF-8 encoding
[System.IO.File]::WriteAllText($filePath, $content, $encoding)
Write-Host "Encoding fixes applied"
