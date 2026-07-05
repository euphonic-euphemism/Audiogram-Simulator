import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const dir = process.cwd();

async function run() {
  await git.init({ fs, dir });
  console.log('Initialized git repo');

  const files = await fs.promises.readdir(dir);
  for (const file of files) {
    if (file !== '.git' && file !== 'node_modules' && file !== 'dist' && file !== 'dist-electron' && file !== '.env') {
      await git.add({ fs, dir, filepath: file });
    }
  }
  // recursive add src, electron, public, .github
  const dirs = ['src', 'electron', 'public', '.github'];
  for (const d of dirs) {
    if (fs.existsSync(path.join(dir, d))) {
      const walk = async (currentDir) => {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          const relPath = path.relative(dir, fullPath);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else {
            await git.add({ fs, dir, filepath: relPath });
          }
        }
      };
      await walk(path.join(dir, d));
    }
  }

  await git.commit({
    fs,
    dir,
    author: {
      name: 'Agent',
      email: 'agent@example.com',
    },
    message: 'Initial commit with Electron desktop app support'
  });
  console.log('Committed files');
}

run().catch(console.error);
