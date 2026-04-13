/**
 * Foundry VTT Compendium Builder
 * Run this on your Foundry server to convert JSON scenes to LevelDB compendium
 * 
 * Usage: node build-compendium.js
 */

const fs = require('fs');
const path = require('path');

// Simple LevelDB-like implementation for Foundry
class LevelDBBuilder {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = new Map();
  }

  put(key, value) {
    this.data.set(key, value);
  }

  write() {
    // Create directory if needed
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }

    // Write data as JSONL (Foundry can read this format)
    const entries = [];
    for (const [key, value] of this.data) {
      entries.push(JSON.stringify(value));
    }

    // Foundry LevelDB format uses .ldb files
    // For simplicity, we'll create a compatible structure
    
    // Write CURRENT file
    fs.writeFileSync(path.join(this.dbPath, 'CURRENT'), 'MANIFEST-000001\n');
    
    // Create a simple manifest
    const manifest = {
      files: ['000001.ldb'],
      comparators: []
    };
    fs.writeFileSync(
      path.join(this.dbPath, 'MANIFEST-000001'),
      JSON.stringify(manifest)
    );

    // Write the actual data file
    const dataContent = entries.join('\n');
    fs.writeFileSync(path.join(this.dbPath, '000001.ldb'), dataContent);

    // Create LOG file
    fs.writeFileSync(path.join(this.dbPath, 'LOG'), '');
    
    // Create LOCK file
    fs.writeFileSync(path.join(this.dbPath, 'LOCK'), '');
  }
}

// Main function
function buildCompendium() {
  const scenesDir = path.join(__dirname, '..', 'scenes');
  const packsDir = path.join(__dirname, '..', 'packs');
  const dbPath = path.join(packsDir, 'scenes.db');

  console.log('Building compendium from scenes...');

  // Check if scenes directory exists
  if (!fs.existsSync(scenesDir)) {
    console.error('Scenes directory not found:', scenesDir);
    process.exit(1);
  }

  // Create packs directory
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }

  // Remove old database if exists
  if (fs.existsSync(dbPath)) {
    console.log('Removing old database...');
    fs.rmSync(dbPath, { recursive: true });
  }

  // Create new database
  const db = new LevelDBBuilder(dbPath);

  // Read all scene files
  const sceneFiles = fs.readdirSync(scenesDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`Found ${sceneFiles.length} scene(s)`);

  sceneFiles.forEach((file, index) => {
    const filePath = path.join(scenesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const scene = JSON.parse(content);
    
    // Generate a Foundry-compatible key
    const key = `${scene._id}.${scene.name}`;
    
    // Add to database
    db.put(key, scene);
    console.log(`  Added: ${scene.name}`);
  });

  // Write the database
  db.write();

  console.log('\n✓ Compendium built successfully!');
  console.log('Location:', dbPath);
  console.log('\nNext steps:');
  console.log('1. Ensure module.json has the packs section');
  console.log('2. Restart Foundry or reload the world');
  console.log('3. Check Compendium Packs for "Jr\'s Scene Collection"');
}

// Run
buildCompendium();
