$filePath = "d:\yobot-remix\yobot_remix\src\client\public\static\clan\arrange.js"

$bytes = [System.IO.File]::ReadAllBytes($filePath)
$encoding = [System.Text.Encoding]::GetEncoding(65001)
$content = $encoding.GetString($bytes)

$replacements = @{
    "鍔犺浇boss鏁版嵁澶辫触" = "加载boss数据失败"
    "鍔犺浇boss鏁版嵁閿欒" = "加载boss数据错误"
    "寮€濮嬪姞杞藉垁鍨嬫暟鎹?.." = "开始加载刀型数据..."
    "鍔犺浇鍝嶅簲" = "加载响应"
    "鍒€鍨嬫暟鎹?" = "刀型数据"
    "鍔犺浇澶辫触" = "加载失败"
    "鍔犺浇閿欒" = "加载错误"
    "鏃ョ粺璁′俊鎭凡淇濆瓨" = "统计数据信息已保存"
    "淇濆瓨鏃ョ粺璁′俊鎭澶辫触" = "保存统计数据信息失败"
    "淇濆瓨鏃ョ粺璁′俊鎭敊璇" = "保存统计数据信息错误"
    "鍔犺浇缁熻閰嶇疆閿欒" = "加载统计配置错误"
    "鍔犺浇鏃ョ粺璁′俊鎭敊璇" = "加载统计数据信息错误"
}

$count = 0
foreach ($key in $replacements.Keys) {
    if ($content.Contains($key)) {
        $content = $content.Replace($key, $replacements[$key])
        Write-Host "已替换: $key"
        $count++
    }
}

if ($count -eq 0) {
    Write-Host "未找到需要替换的乱码字符"
} else {
    Write-Host "共替换了 $count 处乱码字符"
}

[System.IO.File]::WriteAllText($filePath, $content, $encoding)
Write-Host "编码修复完成"
