const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with logActivity
const files = execSync('find app -name "*.ts" -exec grep -l "logActivity(" {} \\;', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Pattern: logActivity(userId, action, entityType, entityId, description, metadata, request)
    const pattern = /logActivity\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/g;
    
    content = content.replace(pattern, (match, userId, action, entityType, entityId, description, metadata, request) => {
      return `logActivity({\n      userId: ${userId.trim()},\n      action: ${action.trim()},\n      entityType: ${entityType.trim()},\n      entityId: ${entityId.trim()},\n      description: ${description.trim()},\n      metadata: ${metadata.trim()},\n      request: ${request.trim()},\n    })`;
    });
    
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('Done!');

