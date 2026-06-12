import inquirer from 'inquirer';
import chalk from 'chalk';

const MENU_CHOICES = [
  new inquirer.Separator(chalk.cyan('─── AuraStream Controls ───')),
  { name: '▶  Start Streaming', value: 'media:start_stream' },
  { name: '⏸  Pause', value: 'media:pause' },
  { name: '▶  Continue', value: 'media:play' },
  { name: '⏹  Stop', value: 'media:stop_stream' },
  { name: '🔄 Restart', value: 'media:restart_stream' },
  { name: '⏭  Skip Track', value: 'media:skip' },
  new inquirer.Separator(chalk.cyan('─── Queue & Config ───')),
  { name: '📋  View Queue', value: 'queue:view' },
  { name: '🔑  Configure Stream Key', value: 'config:stream_key' },
  new inquirer.Separator(chalk.cyan('─── System ───')),
  { name: '📜  View Logs', value: 'system:view_logs' },
  { name: '⏱  Set Auto-Shutdown', value: 'timer:set_shutdown' },
  { name: '⏱  Cancel Auto-Shutdown', value: 'timer:cancel' },
  { name: chalk.red('✖  Exit'), value: 'exit' },
];

async function showMenu(): Promise<void> {
  console.clear();
  console.log(chalk.cyan.bold('┌─────────────────────────────┐'));
  console.log(chalk.cyan.bold('│   AuraStream v2.0  CLI      │'));
  console.log(chalk.cyan.bold('└─────────────────────────────┘\n'));

  try {
    const state = await sendCommand('queue:view');
    if (state && (state as any).shutdownCountdown && (state as any).shutdownCountdown > 0) {
      const countdown = (state as any).shutdownCountdown;
      const h = Math.floor(countdown / 3600).toString().padStart(2, '0');
      const m = Math.floor((countdown % 3600) / 60).toString().padStart(2, '0');
      const s = (countdown % 60).toString().padStart(2, '0');
      console.log(chalk.cyan(`⏱ Auto-shutdown in: ${h}:${m}:${s}\n`));
    }
  } catch (e) {
    // Ignore error if server is not reachable
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices: MENU_CHOICES,
    },
  ]);

  if (action === 'exit') {
    console.log(chalk.gray('Goodbye.'));
    process.exit(0);
  }

  console.log(chalk.yellow('[Connecting to server...]'));
  // Story 1.7 implementa a conexão WebSocket real aqui
  await handleAction(action);
}

import { sendCommand } from './cli-ws';

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case 'queue:view': {
      const state = await sendCommand('queue:view');
      if (!state) { showServerError(); break; }
      const queue = (state as any).queue ?? [];
      if (queue.length === 0) {
        console.log(chalk.gray('Queue is empty.'));
      } else {
        queue.forEach((t: any, i: number) => {
          console.log(chalk.cyan(`${i + 1}.`) + ` ${t.filename}`);
        });
      }
      await pause();
      break;
    }

    case 'config:stream_key': {
      const { key } = await inquirer.prompt([{
        type: 'password',
        name: 'key',
        message: 'Enter YouTube Stream Key:',
        mask: '*',
      }]);
      const result = await sendCommand('config:stream_key', key);
      if (!result) { showServerError(); break; }
      console.log(chalk.green('✓ Stream key configured.'));
      await pause();
      break;
    }

    case 'system:view_logs': {
      // Exibe últimas 20 linhas do compliance log
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.join(process.cwd(), 'logs', 'compliance-audit.jsonl');
      if (fs.existsSync(logPath)) {
        const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n').slice(-20);
        lines.forEach((l) => console.log(chalk.gray(l)));
      } else {
        console.log(chalk.gray('No logs yet.'));
      }
      await pause();
      break;
    }

    case 'timer:set_shutdown': {
      const { preset } = await inquirer.prompt([{
        type: 'list',
        name: 'preset',
        message: 'Select auto-shutdown duration:',
        choices: ['1m', '1h', '2h', '4h', '8h', '24h', '3 days', '1 week', '3 weeks'],
      }]);
      const result = await sendCommand('timer:set_shutdown', preset);
      if (!result) { showServerError(); break; }
      console.log(chalk.green(`✓ Auto-shutdown scheduled: ${preset}`));
      await pause();
      break;
    }
    
    case 'timer:cancel': {
      const result = await sendCommand('timer:cancel');
      if (!result) { showServerError(); break; }
      console.log(chalk.green(`✓ Auto-shutdown cancelled.`));
      await pause();
      break;
    }

    default: {
      const isStreamCmd = ['media:start_stream', 'media:stop_stream', 'media:restart_stream'].includes(action);
      if (isStreamCmd) {
        console.log(chalk.yellow('\n⏳ Enviando comando ao servidor... (aguardando até 10s)'));
      }
      const result = await sendCommand(action);
      if (!result) { showServerError(); break; }
      const status = (result as any).status ?? 'unknown';
      const track = (result as any).currentTrack?.filename;
      if (action === 'media:start_stream') {
        console.log(chalk.green(`\n✅ Stream iniciado!`));
        console.log(chalk.cyan(`   Status : ${status}`));
        if (track) console.log(chalk.cyan(`   Track  : ${track}`));
        console.log(chalk.gray('   O FFmpeg está rodando em background. Verifique os logs do servidor.'));
      } else if (action === 'media:stop_stream') {
        console.log(chalk.green(`\n✅ Stream encerrado. Status: ${status}`));
      } else {
        console.log(chalk.green(`\n✅ Comando '${action}' executado. Status: ${status}`));
      }
      await pause();
      break;
    }
  }
  await showMenu();
}

function showServerError(): void {
  console.log(chalk.red('\n❌ ERRO: Servidor não está rodando!'));
  console.log(chalk.yellow('   Inicie o servidor em outro terminal com:'));
  console.log(chalk.cyan('     ./start-dev.sh'));
  console.log(chalk.gray('   ou apenas o backend:'));
  console.log(chalk.cyan('     xvfb-run -a --server-args="-screen 0 1920x1080x24" yarn server'));
}

async function pause(): Promise<void> {
  await inquirer.prompt([{ type: 'input', name: '_', message: 'Press Enter to continue...' }]);
}

// Entry point
showMenu().catch((err) => {
  console.error(chalk.red('[cli] fatal error:'), err);
  process.exit(1);
});
