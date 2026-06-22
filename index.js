import 'dotenv/config';
import { orchestrator } from './src/orchestrator/index.js';
import { initializeCredentials } from './init-credentials.js';

async function main() {
  // Initialize Google Calendar credentials (from file or environment)
  const credentialsReady = await initializeCredentials();
  if (!credentialsReady) {
    console.warn('⚠️  Running without Google Calendar integration');
  }

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
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
