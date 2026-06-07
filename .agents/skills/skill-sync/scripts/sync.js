const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../../');
const skillsDir = path.join(rootDir, '.agents/skills');

// Read all skills
const skillDirs = fs.readdirSync(skillsDir).filter(file => {
  return fs.statSync(path.join(skillsDir, file)).isDirectory();
});

const skills = [];

for (const dir of skillDirs) {
  const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');
  if (fs.existsSync(skillMdPath)) {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    
    // Parse frontmatter
    const frontmatter = {};
    const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (fmMatch) {
      const lines = fmMatch[1].split(/\r?\n/);
      let currentKey = null;
      let currentSubKey = null;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const indent = line.length - line.trimStart().length;
        if (indent === 0) {
          currentKey = null;
          currentSubKey = null;
          const idx = trimmed.indexOf(':');
          if (idx !== -1) {
            const key = trimmed.substring(0, idx).trim();
            let val = trimmed.substring(idx + 1).trim();
            if (val === '') {
              currentKey = key;
              frontmatter[key] = {};
            } else {
              if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
              } else {
                val = val.replace(/^['"]|['"]$/g, '');
              }
              frontmatter[key] = val;
            }
          }
        } else if (indent === 2 && currentKey === 'triggers') {
          const idx = trimmed.indexOf(':');
          if (idx !== -1) {
            const key = trimmed.substring(0, idx).trim();
            let val = trimmed.substring(idx + 1).trim();
            if (val === '') {
              currentSubKey = key;
              frontmatter.triggers[key] = [];
            } else {
              if (val.startsWith('- ')) {
                val = val.substring(2).trim().replace(/^['"]|['"]$/g, '');
                frontmatter.triggers[key] = [val];
              } else {
                val = val.replace(/^['"]|['"]$/g, '');
                frontmatter.triggers[key] = [val];
              }
            }
          } else if (trimmed.startsWith('- ')) {
            const val = trimmed.substring(2).trim().replace(/^['"]|['"]$/g, '');
            if (!Array.isArray(frontmatter.triggers)) frontmatter.triggers = [];
            frontmatter.triggers.push(val);
          }
        } else if (indent === 4 && currentKey === 'triggers' && currentSubKey) {
          if (trimmed.startsWith('- ')) {
            const val = trimmed.substring(2).trim().replace(/^['"]|['"]$/g, '');
            frontmatter.triggers[currentSubKey].push(val);
          }
        }
      }
    }

    const name = frontmatter.name || dir;
    const description = frontmatter.description || '';
    
    // Determine category
    let category = frontmatter.category;
    if (!category) {
      if (name.startsWith('vetcare-') || name === 'vetcare') {
        category = 'specific';
      } else if (name.startsWith('skill-')) {
        category = 'infra';
      } else {
        category = 'generic';
      }
    }

    // Determine agents
    let agents = frontmatter.agents;
    if (!agents) {
      if (name === 'csharp-dotnet' || name === 'clean-architecture' || name === 'vetcare-api' || name === 'vetcare-agenda') {
        agents = ['backend'];
      } else if (name === 'react-typescript' || name === 'vetcare-ui') {
        agents = ['frontend'];
      } else if (name === 'entity-framework' || name === 'vetcare-db') {
        agents = ['database'];
      } else if (name === 'jwt-auth') {
        agents = ['backend', 'frontend'];
      } else if (name === 'commits' || name === 'pull-request') {
        agents = ['backend', 'frontend', 'database'];
      } else {
        agents = [];
      }
    }

    skills.push({
      name,
      description,
      category,
      agents,
      triggers: frontmatter.triggers || null,
      relPath: `.agents/skills/${name}/SKILL.md`
    });
  }
}

// Sort alphabetically by name
skills.sort((a, b) => a.name.localeCompare(b.name));

// Generate Tables for main AGENTS.md
const genericSkills = skills.filter(s => s.category === 'generic');
const specificSkills = skills.filter(s => s.category === 'specific');
const infraSkills = skills.filter(s => s.category === 'infra');

function generateTable(skillsList) {
  let table = '| Skill | Descripción | URL |\n|---|---|---|\n';
  for (const s of skillsList) {
    table += `| \`${s.name}\` | ${s.description} | [SKILL.md](${s.relPath}) |\n`;
  }
  return table.trim();
}

const genericTable = generateTable(genericSkills);
const specificTable = generateTable(specificSkills);
const infraTable = generateTable(infraSkills);

// Update main AGENTS.md
const mainAgentsPath = path.join(rootDir, 'AGENTS.md');
if (fs.existsSync(mainAgentsPath)) {
  let content = fs.readFileSync(mainAgentsPath, 'utf8');
  
  content = replaceSection(content, 'SKILLS_GENERIC', genericTable);
  content = replaceSection(content, 'SKILLS_SPECIFIC', specificTable);
  content = replaceSection(content, 'SKILLS_INFRA', infraTable);
  
  fs.writeFileSync(mainAgentsPath, content, 'utf8');
  console.log('Updated root AGENTS.md');
}

// Update sub-agents
updateSubAgent('backend');
updateSubAgent('frontend');
updateSubAgent('database');

function updateSubAgent(agentName) {
  const agentPath = path.join(rootDir, `.agents/${agentName}/AGENTS.md`);
  if (!fs.existsSync(agentPath)) return;

  let content = fs.readFileSync(agentPath, 'utf8');

  // Update Skills Reference
  const agentSkills = skills.filter(s => s.agents.includes(agentName));
  let listStr = '';
  for (const s of agentSkills) {
    listStr += `> - [${s.name}](../skills/${s.name}/SKILL.md) - ${s.description}\n`;
  }
  listStr = listStr.trim();
  content = replaceSection(content, 'SKILLS_REF', listStr);

  // Update Auto-invoke
  const autoInvokes = [];
  for (const s of skills) {
    if (s.triggers && s.triggers[agentName]) {
      const agentTriggers = s.triggers[agentName];
      if (Array.isArray(agentTriggers)) {
        for (const trigger of agentTriggers) {
          autoInvokes.push({ action: trigger, skill: s.name });
        }
      } else if (typeof agentTriggers === 'string') {
        autoInvokes.push({ action: agentTriggers, skill: s.name });
      }
    }
  }

  // Sort auto-invokes alphabetically by action
  autoInvokes.sort((a, b) => a.action.localeCompare(b.action));

  let tableStr = '| Acción | Skill |\n|---|---|\n';
  for (const item of autoInvokes) {
    tableStr += `| ${item.action} | \`${item.skill}\` |\n`;
  }
  tableStr = tableStr.trim();
  content = replaceSection(content, 'AUTO_INVOKE', tableStr);

  fs.writeFileSync(agentPath, content, 'utf8');
  console.log(`Updated .agents/${agentName}/AGENTS.md`);
}

function replaceSection(content, key, replacement) {
  const startMarker = `<!-- ${key}_START -->`;
  const endMarker = `<!-- ${key}_END -->`;
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
  
  if (content.match(regex)) {
    return content.replace(regex, `${startMarker}\n${replacement}\n${endMarker}`);
  } else {
    console.warn(`Marker not found for ${key}`);
    return content;
  }
}
