/**
 * Foundry VTT LevelDB Compendium Builder
 * Requires: npm install level
 */

const fs = require('fs');
const path = require('path');

async function buildCompendium() {
  let level;
  try {
    level = require('level');
  } catch (e) {
    console.error('Error: level package not installed');
    console.error('Run: npm install level');
    process.exit(1);
  }

  const scenesDir = path.join(__dirname, '..', 'scenes');
  const packsDir = path.join(__dirname, '..', 'packs');
  const dbPath = path.join(packsDir, 'scenes.db');

  console.log('Building LevelDB compendium...');
  console.log('Scenes source:', scenesDir);
  console.log('Output:', dbPath);
  console.log('');

  // Check if scenes directory exists
  if (!fs.existsSync(scenesDir)) {
    console.error('Error: Scenes directory not found');
    process.exit(1);
  }

  // Create packs directory
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }

  // Remove old database
  if (fs.existsSync(dbPath)) {
    console.log('Removing old database...');
    fs.rmSync(dbPath, { recursive: true });
  }

  // Create new LevelDB database
  const db = await level(dbPath, { valueEncoding: 'json' });

  try {
    // Read all scene files
    const sceneFiles = fs.readdirSync(scenesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    console.log(`Processing ${sceneFiles.length} scene(s)...`);
    console.log('');

    for (const file of sceneFiles) {
      const filePath = path.join(scenesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const scene = JSON.parse(content);
      
      // Foundry uses the format: !scenes!{id}
      const key = `!scenes!${scene._id}`;
      
      await db.put(key, scene);
      console.log(`  ✓ ${scene.name}`);
    }

    console.log('');
    console.log('Closing database...');
    await db.close();

    console.log('');
    console.log('✓ Compendium built successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure your module.json includes:');
    console.log('   "packs": [{');
    console.log('     "name": "jr-scenes",');
    console.log('     "label": "Jr\'s Scene Collection",');
    console.log('     "path": "packs/scenes.db",');
    console.log('     "type": "Scene",');
    console.log('     "private": false');
    console.log('   }]');
    console.log('');
    console.log('2. Restart Foundry or reload your world');
    console.log('3. Check Compendium Packs for "Jr\'s Scene Collection"');
    console.log('');
    console.log('To import scenes into your world:');
    console.log('- Open the compendium');
    console.log('- Drag scenes to Scenes tab, or');
    console.log('- Right-click → Import');

  } catch (error) {
    console.error('Error:', error);
    await db.close();
    process.exit(1);
  }
}

buildCompendium().catch(console.error);
