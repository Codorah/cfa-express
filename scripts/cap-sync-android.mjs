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
  if (!existsSync('android')) {
    console.log('[cap-sync-android] android/ not found, running: npx cap add android');
    await run(capBin, ['add', 'android']);
  }

  console.log('[cap-sync-android] running: npx cap sync android');
  await run(capBin, ['sync', 'android']);
};

main().catch((error) => {
  console.error('[cap-sync-android] error:', error.message);
  process.exit(1);
});
