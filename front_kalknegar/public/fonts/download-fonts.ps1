# PowerShell script to download B-Yekan fonts
# Download B-Yekan font from different sources

$fonts = @(
    @{
        name = "Yekan.woff2"
        url = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/dist/Vazirmatn-Regular.woff2"
    },
    @{
        name = "Yekan.woff"
        url = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/dist/Vazirmatn-Regular.woff"
    },
    @{
        name = "Yekan-Bold.woff2"
        url = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/dist/Vazirmatn-Bold.woff2"
    },
    @{
        name = "Yekan-Bold.woff"
        url = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/dist/Vazirmatn-Bold.woff"
    }
)

foreach ($font in $fonts) {
    try {
        Write-Host "Downloading $($font.name)..."
        Invoke-WebRequest -Uri $font.url -OutFile $font.name -UseBasicParsing
        Write-Host "✓ $($font.name) downloaded successfully"
    }
    catch {
        Write-Host "✗ Failed to download $($font.name): $($_.Exception.Message)"
    }
}