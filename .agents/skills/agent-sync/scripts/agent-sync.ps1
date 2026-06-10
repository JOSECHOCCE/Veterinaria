$rootDir = $pwd.Path
$agentsDir = Join-Path $rootDir ".agents"
$agents = @()

Get-ChildItem -Path $agentsDir -Directory | Where-Object { $_.Name -ne "skills" } | ForEach-Object {
    $agentDir = $_.FullName
    $agentMdPath = Join-Path $agentDir "AGENTS.md"
    if (Test-Path $agentMdPath) {
        $content = Get-Content -Raw -Path $agentMdPath
        $name = $_.Name
        $display = $_.Name
        $description = "Cuando trabajes en $name"
        
        # Parse frontmatter
        if ($content -match "^(?s)---\r?\n(.*?)\r?\n---") {
            $fmContent = $Matches[1]
            $fmLines = $fmContent -split "`r?`n"
            foreach ($line in $fmLines) {
                if ($line -match "^([^:]+):(.*)$") {
                    $key = $Matches[1].Trim()
                    $val = $Matches[2].Trim() -replace '^["'']|["'']$'
                    if ($key -eq "name") { $name = $val }
                    elseif ($key -eq "display") { $display = $val }
                    elseif ($key -eq "description") { $description = $val }
                }
            }
        }
        
        $agents += [PSCustomObject]@{
            Name = $name
            Display = $display
            Description = $description
        }
    }
}

# Sort agents
$agents = $agents | Sort-Object Name

# Generate tables
$subAgentsTable = "| Cuando trabajes en... | Leer |`n|---|---|`n"
foreach ($a in $agents) {
    $subAgentsTable += "| $($a.Display) | \`.agents/$($a.Name)/AGENTS.md\` |`n"
}
$subAgentsTable = $subAgentsTable.Trim()

$dispatchTable = ""
foreach ($a in $agents) {
    $dispatchTable += "| $($a.Description) | → ver \`.agents/$($a.Name)/AGENTS.md\` |`n"
}
$dispatchTable = $dispatchTable.Trim()

# Update root AGENTS.md
$mainAgentsPath = Join-Path $rootDir "AGENTS.md"
if (Test-Path $mainAgentsPath) {
    $content = Get-Content -Raw -Path $mainAgentsPath
    
    # Helper to replace section
    $startMarker = "<!-- SUBAGENTS_START -->"
    $endMarker = "<!-- SUBAGENTS_END -->"
    $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
    $content = $content -replace $pattern, "$startMarker`n$subAgentsTable`n$endMarker"

    $startMarker = "<!-- SUBAGENT_DISPATCH_START -->"
    $endMarker = "<!-- SUBAGENT_DISPATCH_END -->"
    $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
    $content = $content -replace $pattern, "$startMarker`n$dispatchTable`n$endMarker"
    
    Set-Content -Path $mainAgentsPath -Value $content -Encoding utf8
    Write-Host "Successfully updated root AGENTS.md with sub-agents metadata using PowerShell!"
} else {
    Write-Error "Root AGENTS.md not found!"
}
