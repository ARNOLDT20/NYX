# 🐛 NYX MD - Debugging Guide

## Issues Found & Fixed

### 1. ✅ Package Name Issue (FIXED)
**Problem**: Package name "NYX" contains uppercase letters which violates npm naming conventions
- Pattern requirement: `^(?:(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?/[a-z0-9-._~])|[a-z0-9-~])[a-z0-9-._~]*$`

**Solution**: Changed to `"name": "nyx-md"` in package.json

---

## Common Issues & Solutions

### Issue: Bot Won't Start
**Symptoms**: Process exits immediately or no connection established

**Troubleshooting**:
```bash
# 1. Check Node version
node --version  # Should be >=20

# 2. Install dependencies
npm install

# 3. Verify .env file exists
ls -la .env

# 4. Check for missing SESSION_ID
cat .env | grep SESSION_ID
```

### Issue: Missing Dependencies
**Symptoms**: Module not found errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install

# Or install specific missing package
npm install <package-name>
```

### Issue: Port Already in Use
**Symptoms**: EADDRINUSE error

**Solution**:
```bash
# Windows: Find process using port 3000 (or your port)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or change port in config.js
```

### Issue: Session Errors
**Symptoms**: "Invalid session" or frequent disconnections

**Solution**:
```bash
# Remove old session files
rm -r sessions/*

# Restart the bot to generate new QR code
npm start
```

---

## Dependency Conflicts

### Potential Issues:
1. **fs & path modules**: Built-in modules shouldn't be installed as npm packages
   - Remove from package.json if needed:
     ```bash
     npm uninstall fs path util vm
     ```

2. **FFmpeg**: Requires system FFmpeg installed
   ```bash
   # Windows (with choco)
   choco install ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   ```

3. **SQLite3**: Might need build tools
   ```bash
   npm install --build-from-source sqlite3
   ```

---

## Database Issues

### Reset Database:
```bash
# Backup first
cp -r data/ data.backup/

# Clear database files
rm data/*.db
rm data/*.sqlite

# Restart bot to recreate
npm start
```

---

## Performance Monitoring

### Check Resource Usage:
```bash
# Windows
Get-Process node | Format-Table Handles,CPU,Memory

# Monitor in real-time
pm2 monit
```

---

## Logging & Debugging

### Enable Detailed Logging:
```bash
# Add to index.js before socket creation:
process.env.DEBUG = '*'

# Or set logging level:
const logger = require('pino')({level: 'debug'})
```

### View Logs:
```bash
# PM2 logs
pm2 logs NYX

# System logs
tail -f ~/.pm2/logs/NYX-error.log
```

---

## Testing Commands

### Verify Bot Responds:
```
In WhatsApp chat:
.owner        # Should return bot info
.ping         # Should respond with pong
.help         # Should show commands
```

---

## File Structure Check

```
NYX/
├── index.js           ✅ Main entry point
├── config.js          ✅ Configuration
├── command.js         ✅ Command handler
├── package.json       ✅ (Fixed: name changed to nyx-md)
├── .env              ⚠️ Must contain SESSION_ID
├── plugins/          ✅ 100+ command files
├── lib/              ✅ Utility functions
├── data/             ✅ Database storage
├── sessions/         ✅ WhatsApp sessions
└── assets/           ✅ SVG resources
```

---

## Quick Health Check

```bash
# Run this to verify setup
npm test 2>&1 || echo "No tests configured"
node index.js --check-config
npm ls --depth=0 2>&1 | grep -i error
```

---

## Getting Help

1. **Check logs**: `pm2 logs NYX`
2. **Verify environment**: `echo $SESSION_ID`
3. **Test connection**: `.owner` command in WhatsApp
4. **Restart safely**:
   ```bash
   pm2 stop NYX
   npm install
   pm2 restart NYX
   ```

---

**Last Updated**: January 22, 2026  
**Status**: ✅ Setup verified and optimized
