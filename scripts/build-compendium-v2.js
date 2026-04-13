/**
 * Foundry VTT LevelDB Compendium Builder v2
 * Properly formats data for Foundry compendium packs
 */

const fs = require('fs');
const path = require('path');

async function buildCompendium() {
  let Level;
  try {
    const levelModule = require('level');
    Level = levelModule.Level || levelModule;
  } catch (e) {
    console.error('Error: level package not installed');
    console.error('Run: npm install level');
    process.exit(1);
  }

  const scenesDir = path.join(__dirname, '..', 'scenes');
  const packsDir = path.join(__dirname, '..', 'packs');
  const dbPath = path.join(packsDir, 'scenes.db');

  console.log('Building Foundry VTT LevelDB compendium...');
  console.log('Source:', scenesDir);
  console.log('Output:', dbPath);
  console.log('');

  // Check if scenes directory exists
  if (!fs.existsSync(scenesDir)) {
    console.error('Error: Scenes directory not found at', scenesDir);
    process.exit(1);
  }

  // Create packs directory
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }

  // Remove old database completely
  if (fs.existsSync(dbPath)) {
    console.log('Removing old database...');
    fs.rmSync(dbPath, { recursive: true, force: true });
  }

  // Create new LevelDB database
  // Foundry uses specific options for compendium packs
  const db = new Level(dbPath, {
    valueEncoding: 'json',
    keyEncoding: 'utf8'
  });

  try {
    // Read all scene files
    const sceneFiles = fs.readdirSync(scenesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    console.log(`Found ${sceneFiles.length} scene file(s)`);
    console.log('');

    for (const file of sceneFiles) {
      const filePath = path.join(scenesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const scene = JSON.parse(content);
      
      // Foundry uses the format: !scenes!{document_id}
      // The key MUST be in this exact format
      const key = `!scenes!${scene._id}`;
      
      // Ensure scene has required fields
      if (!scene._id) {
        console.log(`  ⚠ Skipping ${file}: missing _id`);
        continue;
      }
      
      // Add/update metadata
      scene.type = 'Scene';
      
      await db.put(key, scene);
      console.log(`  ✓ Added: ${scene.name} (${scene._id})`);
    }

    console.log('');
    console.log('Closing database...');
    await db.close();

    // Verify the database was created
    const dbFiles = fs.readdirSync(dbPath);
    console.log('');
    console.log('Database files created:');
    dbFiles.forEach(f => console.log(`  - ${f}`));

    console.log('');
    console.log('✓ Compendium built successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart Foundry or reload your world');
    console.log('2. Open Compendium Packs → Jr\'s Scene Collection');
    console.log('3. Scenes should now be visible!');
    console.log('');
    console.log('If scenes still don\'t appear:');
    console.log('- Check browser console for errors');
    console.log('- Verify scenes have valid _id fields');

  } catch (error) {
    console.error('Error:', error);
    await db.close().catch(() => {});
    process.exit(1);
  }
}

// Check if being run directly
if (require.main === module) {
  buildCompendium().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { buildCompendium };
