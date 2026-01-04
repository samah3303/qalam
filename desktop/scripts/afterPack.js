const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
  const appDir = context.appOutDir;
  console.log('Rebuilding native modules for Electron...');
  
  try {
    execSync('npm rebuild better-sqlite3 --build-from-source', {
      cwd: appDir,
      stdio: 'inherit'
    });
    console.log('Native modules rebuilt successfully!');
  } catch (error) {
    console.error('Failed to rebuild native modules:', error);
  }
};
