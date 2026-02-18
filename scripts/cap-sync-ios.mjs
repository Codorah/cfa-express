import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const capBin = path.resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'cap.cmd' : 'cap'
);

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child =
      process.platform === 'win32'
        ? spawn(command, args, {
            stdio: 'inherit',
            shell: true,
          })
        : spawn(command, args, {
            stdio: 'inherit',
            shell: false,
          });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

const main = async () => {
  if (!existsSync('ios')) {
    console.log('[cap-sync-ios] ios/ not found, running: cap add ios');
    await run(capBin, ['add', 'ios']);
  }

  console.log('[cap-sync-ios] running: cap sync ios');
  await run(capBin, ['sync', 'ios']);
};

main().catch((error) => {
  console.error('[cap-sync-ios] error:', error.message);
  process.exit(1);
});
