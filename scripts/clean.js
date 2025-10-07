// scripts/clean.js
const rimraf = require('rimraf');
const path = require('path');

module.exports = async function beforePack(context) {
  // context.appOutDir enthält den Ziel-Ordner, context.packager etc.
  const distPath = path.join(__dirname, '..', 'dist');
  rimraf.sync(distPath);
  console.log('Dist-Ordner wurde geleert.');
};
