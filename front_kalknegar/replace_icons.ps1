# PowerShell script to batch replace icons in Vue files
# This script will replace common icon imports with Phosphor equivalents

$baseDir = "src"

# Define replacement mappings
$heroiconsReplacements = @{
    'from "@heroicons/vue/20/solid";' = 'from "@phosphor-icons/vue";'
    'from "@heroicons/vue/24/solid";' = 'from "@phosphor-icons/vue";'
    'from "@heroicons/vue/24/outline";' = 'from "@phosphor-icons/vue";'
}

$iconNameReplacements = @{
    'ChevronRightIcon' = 'PhCaretRight as ChevronRightIcon'
    'ArrowSmallDownIcon' = 'PhCaretDown as ArrowSmallDownIcon'
    'ArrowSmallUpIcon' = 'PhCaretUp as ArrowSmallUpIcon'
    'TrashIcon' = 'PhTrash as TrashIcon'
    'EyeIcon' = 'PhEye as EyeIcon'
    'EyeSlashIcon' = 'PhEyeSlash as EyeSlashIcon'
    'CalendarIcon' = 'PhCalendar as CalendarIcon'
    'ChevronDownIcon' = 'PhCaretDown as ChevronDownIcon'
    'ChevronUpIcon' = 'PhCaretUp as ChevronUpIcon'
    'MagnifyingGlassIcon' = 'PhMagnifyingGlass as MagnifyingGlassIcon'
    'PlusIcon' = 'PhPlus as PlusIcon'
    'XMarkIcon' = 'PhX as XMarkIcon'
    'CheckIcon' = 'PhCheck as CheckIcon'
    'EllipsisVerticalIcon' = 'PhDotsThreeVertical as EllipsisVerticalIcon'
    'ArrowsPointingOutIcon' = 'PhArrowsOut as ArrowsPointingOutIcon'
    'MagnifyingGlassMinusIcon' = 'PhMagnifyingGlassMinus as MagnifyingGlassMinusIcon'
    'MagnifyingGlassPlusIcon' = 'PhMagnifyingGlassPlus as MagnifyingGlassPlusIcon'
    'HomeIcon' = 'PhHouse as HomeIcon'
    'MenuIcon' = 'PhList as MenuIcon'
    'GlobeAltIcon' = 'PhGlobe as GlobeAltIcon'
    'SearchIcon' = 'PhMagnifyingGlass as SearchIcon'
    'TableIcon' = 'PhTable as TableIcon'
    'MapPinIcon' = 'PhMapPin as MapPinIcon'
}

# Function to process files
function Replace-IconsInFile {
    param([string]$filePath)
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Apply Heroicons replacements
    foreach ($pattern in $heroiconsReplacements.Keys) {
        $content = $content -replace [regex]::Escape($pattern), $heroiconsReplacements[$pattern]
    }
    
    # Apply Lucide replacements
    foreach ($pattern in $lucideReplacements.Keys) {
        $content = $content -replace [regex]::Escape($pattern), $lucideReplacements[$pattern]
    }
    
    # Write back if changed
    if ($content -ne $originalContent) {
        Set-Content $filePath $content -NoNewline
        Write-Host "Updated: $filePath"
        return $true
    }
    return $false
}

# Find and process Vue files
$vueFiles = Get-ChildItem -Path $baseDir -Filter "*.vue" -Recurse
$processedCount = 0

foreach ($file in $vueFiles) {
    if (Replace-IconsInFile $file.FullName) {
        $processedCount++
    }
}

Write-Host "Processed $processedCount out of $($vueFiles.Count) Vue files"