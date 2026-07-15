import fs from 'fs';
import path from 'path';

const required = [
  'package.json',
  'config/package-solution.json',
  'config/copilot-agent.json',
  'copilot/declarativeAgent.json',
  'copilot/ai-plugin.json',
  'copilot/manifest.json',
  'copilot/outline.png',
  'src/copilotComponents/readinessActionCentre/ReadinessActionCentreCopilotComponent.manifest.json',
  'src/copilotComponents/readinessActionCentre/ReadinessActionCentreCopilotComponent.tsx',
  'src/copilotComponents/readinessActionCentre/ReadinessActionCentreCopilotComponentProperties.ts',
  'src/copilotComponents/readinessActionCentre/components/ReadinessApp.tsx',
  'src/copilotComponents/readinessActionCentre/components/ReadinessThemeProvider.tsx',
  'src/copilotComponents/readinessActionCentre/components/ReadinessInline.tsx',
  'src/copilotComponents/readinessActionCentre/components/ReadinessFullscreen.tsx',
  'src/copilotComponents/readinessActionCentre/services/IReadinessDataService.ts',
  'src/copilotComponents/readinessActionCentre/services/MockReadinessDataService.ts',
  'src/copilotComponents/readinessActionCentre/services/SharePointReadinessDataService.ts',
  'scripts/provision.ps1',
  'agentic-creation-rules.md'
];

let bad = false;
for (const f of required) {
  if (!fs.existsSync(path.resolve(f))) {
    console.error('Missing:', f);
    bad = true;
  }
}

for (const f of required.filter((x) => x.endsWith('.json'))) {
  try {
    JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    console.error('Invalid JSON:', f, e.message);
    bad = true;
  }
}

// Packaging checks for Teams "Add to Teams"
const propsPath = path.resolve(
  'src/copilotComponents/readinessActionCentre/ReadinessActionCentreCopilotComponentProperties.ts'
);
const propsSrc = fs.readFileSync(propsPath, 'utf8');
if (!propsSrc.includes('zodToJsonSchema')) {
  console.error('Properties file must export zodToJsonSchema(...) as default');
  bad = true;
}
if (/export default propertiesSchema\s*;/.test(propsSrc)) {
  console.error('Do not export a live Zod schema as default — breaks Teams packaging');
  bad = true;
}

if (bad) process.exit(1);
console.log('Project structure and packaging guards validated successfully.');
