param([string]$Ticker, [string]$Title, [string]$Idea, [string]$Bias, [string]$Category, [string]$Tags)

$json = @{
    ticker = $Ticker
    title = $Title
    idea = $Idea
    bias = $Bias
    category = $Category
    tags = $Tags -split ','
} | ConvertTo-Json -Compress

$json | node D:\internship\TradingView-Bot\postIdea.js