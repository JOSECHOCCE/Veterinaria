const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../../');
const agentsDir = path.join(rootDir, '.agents');

// Read all sub-agents directories (exclude skills and special folders)
const agentDirs = fs.readdirSync(agentsDir).filter(file => {
  const fullPath = path.join(agentsDir, file);
  return fs.statSync(fullPath).isDirectory() && file !== 'skills';
});

const agents = [];

for (const dir of agentDirs) {
  const agentMdPath = path.join(agentsDir, dir, 'AGENTS.md');
  if (fs.existsSync(agentMdPath)) {
    const content = fs.readFileSync(agentMdPath, 'utf8');
    
    // Parse frontmatter
    const frontmatter = {};
    const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (fmMatch) {
      const lines = fmMatch[1].split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const idx = trimmed.indexOf(':');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          frontmatter[key] = val;
        }
      }
    }

    const name = frontmatter.name || dir;
    const display = frontmatter.display || name;
    const description = frontmatter.description || `Cuando trabajes en ${name}`;

    agents.push({
      name,
      display,
      description,
      relPath: `.agents/${name}/AGENTS.md`
    });
  }
}

// Sort alphabetically by name
agents.sort((a, b) => a.name.localeCompare(b.name));

// Generate sub-agents table
let subAgentsTable = '| Cuando trabajes en... | Leer |\n|---|---|\n';
for (const a of agents) {
  subAgentsTable += `| ${a.display} | \`.agents/${a.name}/AGENTS.md\` |\n`;
}
subAgentsTable = subAgentsTable.trim();

// Generate dispatch table
let dispatchTable = '';
for (const a of agents) {
  dispatchTable += `| ${a.description} | → ver \`.agents/${a.name}/AGENTS.md\` |\n`;
}
dispatchTable = dispatchTable.trim();

// Update root AGENTS.md
const mainAgentsPath = path.join(rootDir, 'AGENTS.md');
if (fs.existsSync(mainAgentsPath)) {
  let content = fs.readFileSync(mainAgentsPath, 'utf8');
  
  content = replaceSection(content, 'SUBAGENTS', subAgentsTable);
  content = replaceSection(content, 'SUBAGENT_DISPATCH', dispatchTable);
  
  fs.writeFileSync(mainAgentsPath, content, 'utf8');
  console.log('Successfully updated root AGENTS.md with sub-agents metadata!');
} else {
  console.error('Root AGENTS.md not found!');
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
