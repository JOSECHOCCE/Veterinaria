$rootDir = $pwd.Path
$skillsDir = Join-Path $rootDir ".agents/skills"
$skills = @()

Get-ChildItem -Path $skillsDir -Directory | ForEach-Object {
    $dir = $_.Name
    $skillMdPath = Join-Path $_.FullName "SKILL.md"
    if (Test-Path $skillMdPath) {
        $content = Get-Content -Raw -Path $skillMdPath
        
        # Parse frontmatter
        $name = $dir
        $description = ""
        $category = ""
        $agents = @()
        $triggers = @{
            backend = @()
            frontend = @()
            database = @()
            testing = @()
        }
        
        if ($content -match "^(?s)---\r?\n(.*?)\r?\n---") {
            $fmContent = $Matches[1]
            $fmLines = $fmContent -split "`r?`n"
            $currentKey = $null
            $currentSubKey = $null
            
            foreach ($line in $fmLines) {
                $trimmed = $line.Trim()
                if (-not $trimmed) { continue }
                
                # Check indentation
                $indent = $line.Length - $trimmed.Length
                
                if ($indent -eq 0) {
                    $currentKey = $null
                    $currentSubKey = $null
                    if ($trimmed -match "^([^:]+):(.*)$") {
                        $key = $Matches[1].Trim()
                        $val = $Matches[2].Trim()
                        if ($val -eq "") {
                            $currentKey = $key
                        } else {
                            if ($val.StartsWith("[") -and $val.EndsWith("]")) {
                                $val = $val.Substring(1, $val.Length - 2) -split "," | ForEach-Object { $_.Trim() -replace '^["'']|["'']$' }
                            } else {
                                $val = $val -replace '^["'']|["'']$'
                            }
                            if ($key -eq "name") { $name = $val }
                            elseif ($key -eq "description") { $description = $val }
                            elseif ($key -eq "category") { $category = $val }
                            elseif ($key -eq "agents") { $agents = $val }
                        }
                    }
                } elseif ($indent -eq 2 -and $currentKey -eq "triggers") {
                    if ($trimmed -match "^([^:]+):(.*)$") {
                        $key = $Matches[1].Trim()
                        $val = $Matches[2].Trim()
                        if ($val -eq "") {
                            $currentSubKey = $key
                            $triggers[$key] = @()
                        } else {
                            if ($val.StartsWith("- ")) {
                                $val = $val.Substring(2).Trim() -replace '^["'']|["'']$'
                                $triggers[$key] = @($val)
                            } else {
                                $val = $val -replace '^["'']|["'']$'
                                $triggers[$key] = @($val)
                            }
                        }
                    } elseif ($trimmed.StartsWith("- ")) {
                        $val = $trimmed.Substring(2).Trim() -replace '^["'']|["'']$'
                        if (-not $triggers.ContainsKey("triggers")) { $triggers["triggers"] = @() }
                        $triggers["triggers"] += $val
                    }
                } elseif ($indent -eq 4 -and $currentKey -eq "triggers" -and $currentSubKey) {
                    if ($trimmed.StartsWith("- ")) {
                        $val = $trimmed.Substring(2).Trim() -replace '^["'']|["'']$'
                        if (-not $triggers[$currentSubKey]) { $triggers[$currentSubKey] = @() }
                        $triggers[$currentSubKey] += $val
                    }
                }
            }
        }
        
        # Determine category if not defined
        if (-not $category) {
            if ($name.StartsWith("vetcare-") -or $name -eq "vetcare") {
                $category = "specific"
            } elseif ($name.StartsWith("skill-") -or $name.EndsWith("-sync") -or $name.EndsWith("-creator") -or $name.EndsWith("-agent")) {
                $category = "infra"
            } else {
                $category = "generic"
            }
        }
        
        # Determine agents if not defined
        if ($agents.Count -eq 0) {
            if ($name -eq "csharp-dotnet" -or $name -eq "clean-architecture" -or $name -eq "vetcare-api" -or $name -eq "vetcare-agenda") {
                $agents = @("backend")
            } elseif ($name -eq "react-typescript" -or $name -eq "vetcare-ui") {
                $agents = @("frontend")
            } elseif ($name -eq "entity-framework" -or $name -eq "vetcare-db") {
                $agents = @("database")
            } elseif ($name -eq "jwt-auth") {
                $agents = @("backend", "frontend")
            } elseif ($name -eq "commits" -or $name -eq "pull-request") {
                $agents = @("backend", "frontend", "database", "testing")
            } else {
                $agents = @()
            }
        }
        
        $skills += [PSCustomObject]@{
            Name = $name
            Description = $description
            Category = $category
            Agents = $agents
            Triggers = $triggers
            RelPath = ".agents/skills/$name/SKILL.md"
        }
    }
}

# Sort skills alphabetically
$skills = $skills | Sort-Object Name

# Generate tables for root AGENTS.md
$genericSkills = $skills | Where-Object { $_.Category -eq "generic" }
$specificSkills = $skills | Where-Object { $_.Category -eq "specific" }
$infraSkills = $skills | Where-Object { $_.Category -eq "infra" }

function Generate-Table($skillsList) {
    $table = "| Skill | Descripción | URL |`n|---|---|---|`n"
    foreach ($s in $skillsList) {
        $table += "| `$($s.Name)` | $($s.Description) | [SKILL.md]($($s.RelPath)) |`n"
    }
    return $table.Trim()
}

$genericTable = Generate-Table $genericSkills
$specificTable = Generate-Table $specificSkills
$infraTable = Generate-Table $infraSkills

# Update root AGENTS.md
$mainAgentsPath = Join-Path $rootDir "AGENTS.md"
if (Test-Path $mainAgentsPath) {
    $content = Get-Content -Raw -Path $mainAgentsPath
    
    function Replace-Section($c, $key, $rep) {
        $startMarker = "<!-- ${key}_START -->"
        $endMarker = "<!-- ${key}_END -->"
        $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
        return $c -replace $pattern, "$startMarker`n$rep`n$endMarker"
    }
    
    $content = Replace-Section $content "SKILLS_GENERIC" $genericTable
    $content = Replace-Section $content "SKILLS_SPECIFIC" $specificTable
    $content = Replace-Section $content "SKILLS_INFRA" $infraTable
    
    Set-Content -Path $mainAgentsPath -Value $content -Encoding utf8
    Write-Host "Updated root AGENTS.md skills tables"
}

# Update sub-agents
$allAgentNames = @("backend", "frontend", "database", "testing")
foreach ($agentName in $allAgentNames) {
    $agentPath = Join-Path $rootDir ".agents/$agentName/AGENTS.md"
    if (Test-Path $agentPath) {
        $agentContent = Get-Content -Raw -Path $agentPath
        
        # Update Skills Reference
        $agentSkills = $skills | Where-Object { $_.Agents -contains $agentName }
        $listStr = ""
        foreach ($s in $agentSkills) {
            $listStr += "> - [$($s.Name)](../skills/$($s.Name)/SKILL.md) - $($s.Description)`n"
        }
        $listStr = $listStr.Trim()
        
        $startMarker = "<!-- SKILLS_REF_START -->"
        $endMarker = "<!-- SKILLS_REF_END -->"
        $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
        $agentContent = $agentContent -replace $pattern, "$startMarker`n$listStr`n$endMarker"
        
        # Update Auto-invoke
        $autoInvokes = @()
        foreach ($s in $skills) {
            if ($s.Triggers -and $s.Triggers.ContainsKey($agentName)) {
                $agentTriggers = $s.Triggers[$agentName]
                if ($agentTriggers -is [array]) {
                    foreach ($trig in $agentTriggers) {
                        $autoInvokes += [PSCustomObject]@{ Action = $trig; Skill = $s.Name }
                    }
                } elseif ($agentTriggers -is [string] -and $agentTriggers -ne "") {
                    $autoInvokes += [PSCustomObject]@{ Action = $agentTriggers; Skill = $s.Name }
                }
            }
        }
        
        # Sort auto-invokes
        $autoInvokes = $autoInvokes | Sort-Object Action
        
        $tableStr = "| Acción | Skill |`n|---|---|`n"
        foreach ($item in $autoInvokes) {
            $tableStr += "| $($item.Action) | `$($item.Skill)` |`n"
        }
        $tableStr = $tableStr.Trim()
        
        $startMarker = "<!-- AUTO_INVOKE_START -->"
        $endMarker = "<!-- AUTO_INVOKE_END -->"
        $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
        $agentContent = $agentContent -replace $pattern, "$startMarker`n$tableStr`n$endMarker"
        
        Set-Content -Path $agentPath -Value $agentContent -Encoding utf8
        Write-Host "Updated .agents/$agentName/AGENTS.md"
    }
}
