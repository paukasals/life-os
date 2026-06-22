import 'dotenv/config';
import { orchestrator } from './src/orchestrator/index.js';

const command = process.argv[2];

if (command === 'run') {
  const agentName = process.argv[3];
  if (!agentName) {
    console.error('Usage: node index.js run <agentName>');
    process.exit(1);
  }
  orchestrator.agents[agentName]
    ? orchestrator.runAgent(agentName).then(() => process.exit(0))
    : (() => { console.error(`Unknown agent: ${agentName}`); process.exit(1); })();
} else if (command === 'run-all') {
  orchestrator.runAll().then(() => process.exit(0));
} else {
  orchestrator.start();
}
