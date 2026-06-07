# AuraStream v2.0 — Compliance & Deployment Guide

**Date**: 2026-06-06
**Owner**: Bruno Andrade Dinis
**Critical**: Yes (affects launch readiness)

---

## 📋 Índice

1. **Production Server Configuration**
2. **NCS Music Compliance & Copyright Protection**
3. **Pre-Launch Compliance Checklist**
4. **What If: Strike or Claim Resolution**

---

## 1️⃣ Production Server Configuration

### **Current Setup (Not Recommended for Streaming)**

```bash
python3 -m http.server -d ./out/
```

**Issues**:
- ❌ No graceful shutdown (SIGTERM handling)
- ❌ No logging/monitoring
- ❌ No compression (gzip not automatic)
- ❌ No static file caching headers
- ❌ Single-threaded (not production-grade)
- ❌ No SSL/TLS support (needed if upstream proxy uses it)

---

### **Recommended: Node.js Express (Aligned with Project)**

**Why Express**:
✅ Aligns with existing Next.js/Node.js stack
✅ Simple setup (5 lines of code)
✅ Production-ready
✅ Can run in background (systemd service)
✅ Proper logging

**Setup**:

```typescript
// src/server/index.ts
import express from 'express'
import path from 'path'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 9002

// Serve static files from build output
app.use(express.static(path.join(__dirname, '../../out'), {
  maxAge: '1d',  // Cache 1 day
  etag: false    // Use last-modified instead
}))

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../out/index.html'))
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

const server = app.listen(PORT, () => {
  console.log(`✅ AuraStream server running on port ${PORT}`)
})
```

**Build & Run**:

```bash
# Build (static export)
npm run build

# Run server
node src/server/index.ts
# or as background service (see below)
```

---

### **Deployment Options**

#### **Option A: systemd Service (Recommended for VM)**

Create `/etc/systemd/system/aurastream.service`:

```ini
[Unit]
Description=AuraStream v2.0 Production Server
After=network.target

[Service]
Type=simple
User=aurastream
WorkingDirectory=/home/aurastream/aurastream
Environment="NODE_ENV=production"
Environment="PORT=9002"
ExecStart=/usr/bin/node src/server/index.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Usage**:

```bash
# Start service
sudo systemctl start aurastream

# Auto-start on boot
sudo systemctl enable aurastream

# Monitor
sudo systemctl status aurastream
journalctl -u aurastream -f
```

---

#### **Option B: PM2 (Process Manager, Also Recommended)**

```bash
npm install -g pm2

# Start with PM2
pm2 start src/server/index.ts --name aurastream

# Monitor
pm2 status
pm2 logs aurastream

# Auto-restart on system boot
pm2 startup
pm2 save
```

---

#### **Option C: Nginx Reverse Proxy (Best for Scaling)**

If you want Nginx in front:

```nginx
# /etc/nginx/sites-available/aurastream
upstream aurastream {
  server localhost:3000;
}

server {
  listen 80;
  server_name yourdomain.com;

  location / {
    proxy_pass http://aurastream;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

### **Recommendation for AuraStream v2.0**

**Pick**: **Express + systemd** (Option A)

**Why**:
- Simplest setup (few lines of code)
- No extra dependencies (Express already a dependency candidate)
- Auto-restart on crash
- Integrates with Linux standard practices
- Minimal overhead on VM

**Implementation**:
- Add `src/server/index.ts` to project
- Add to `package.json` scripts: `"server": "node src/server/index.ts"`
- Add to build pipeline

---

## 2️⃣ NCS Music Compliance & Copyright Protection

### **Key Points from NCS Policy** ✅

**You Qualify as "Independent Creator"** if:
- ✅ Individual or small group creating UGC
- ✅ Publishing on your own channel (YouTube, Twitch, etc.)
- ✅ No direct commercial gain (ad revenue is OK)
- ✅ Not a corporation/org with other primary activities

**Your Use Case**: YouTube radio stream = ✅ Qualifies

---

### **What You're Allowed to Do**

✅ **ALLOWED**:
- Use NCS music in YouTube streams
- Monetize via YouTube ads
- Credit artist/track in description
- Use audio loops (non-exclusive use)
- Sync audio with video (your background video)

❌ **NOT ALLOWED**:
- Edit/alter NCS music (beyond timing)
- Use music outside official NCS sources
- Use NCS to endorse products
- Mix with other non-NCS music for the same stream
- Claim the music as your own

---

### **Critical: Must Credit Correctly**

**Where to Credit**:
- ✅ YouTube stream description
- ✅ Stream title (optional but good)
- ✅ Metadata in your track JSON files

**Credit Format** (from NCS docs):
```
Track Title — Artist Name
Music provided by NoCopyrightSounds
Download/Stream: [Link from NCS track page]
Watch: [YouTube link if available]
```

**Example**:
```
Pull Me Down — CERES x TAME
Music provided by NoCopyrightSounds
Download/Stream: https://ncs.io/c_pullmedown
Watch: https://www.youtube.com/c/NoCopyrightSounds
```

---

### **Critical: Source Verification**

⚠️ **ONLY use music from official NCS sources**:

✅ **Official NCS sources**:
- ncs.io (website)
- youtube.com/c/NoCopyrightSounds (official channel)
- spotify.com/nocopyrightsounds (official profile)
- soundcloud.com/nocopyrightsounds (official)
- ncs.lnk.to/* (official NCS short links)

❌ **NOT official** (don't use):
- Third-party downloaders claiming NCS music
- Re-uploads from other channels
- "NCS music" from non-NCS sources
- Songs by NCS artists NOT released on NCS official channels

**Implementation in AuraStream**:
- Metadata `.json` files **must** include `source` field with official NCS link
- On first load, validate source URL matches official NCS domains
- Log all sources for compliance audit

**Example valid metadata**:
```json
{
  "id": "ceres-tame-pull-me-down",
  "title": "Pull Me Down",
  "artist": "CERES x TAME",
  "source": "https://ncs.io/c_pullmedown",
  "creditLine": "Music provided by NoCopyrightSounds"
}
```

---

### **Claim-Free Promise (But Know the Exception)**

**NCS Promise**: Their music is "claim-free"
**Reality**: Sometimes claims happen due to:
- Data mismatches in YouTube's database
- Fraudsters claiming content
- Rights disputes

**If You Get a Claim** ⚠️:
1. Check if it's from "Featherstone Music" or "AEI Group" → **Don't submit** (false positives)
2. Check if it shows ❌ icon or claiming party info → **Submit dispute to NCS**
3. NCS will investigate and resolve (they take this seriously)

---

### **Compliance Monitoring** (FR-5.0 New)

**Proposal**: Add compliance monitoring to AuraStream:

```typescript
// src/lib/compliance.ts

interface ComplianceCheck {
  musicSourceVerified: boolean
  creditPresent: boolean
  ncsOnlyStreaming: boolean
  validMetadataFiles: boolean
}

async function verifyCompliance(): Promise<ComplianceCheck> {
  // 1. Check all audio files have metadata
  // 2. Verify source URLs are official NCS
  // 3. Validate credit line in metadata
  // 4. Warn if non-NCS music detected
  // 5. Log compliance status
}
```

**Adds to Dashboard**:
- Compliance status indicator (green = all good, yellow = warning, red = issue)
- List of tracks with source verification
- Credit line preview for stream description

---

## 3️⃣ Pre-Launch Compliance Checklist

### **Before First Stream**

- [ ] **Server**: Express + systemd configured (not python http.server)
- [ ] **Build**: `npm run build` completes without errors
- [ ] **Server Start**: `npm run server` starts and logs "Server running on port 9002"
- [ ] **Browser Access**: Can open `http://localhost:9002` in browser (or VM IP:9002)

### **Before Adding Music**

- [ ] **NCS Account**: Signed up at ncs.io
- [ ] **Music Source**: All audio files downloaded from official NCS sources only
- [ ] **Metadata Files**: All `.json` files include `source` with official NCS link
- [ ] **Credit Lines**: Each track has proper NCS credit line in metadata

### **Before First YouTube Stream**

- [ ] **YouTube Stream Key**: Saved in `.env` or Dashboard
- [ ] **Stream Title**: Includes "AuraStream" or channel name
- [ ] **Stream Description**: Includes full credit lines for all tracks playing
- [ ] **NCS Compliance**: Review compliance checklist (below)

### **NCS Compliance Verification**

- [ ] All audio files from ncs.io, NCS YouTube, or official links
- [ ] No music from non-NCS sources mixed in
- [ ] Credit format: "[Title] — [Artist] | Music by NoCopyrightSounds | [Link]"
- [ ] Source field in all metadata `.json` files
- [ ] No alterations to original audio files
- [ ] Personal use only (independent creator confirmation)

### **Operational**

- [ ] Server running via systemd or PM2 (not manual terminal)
- [ ] Logs being saved for audit trail
- [ ] Uptime monitoring enabled
- [ ] Backup procedure documented (if music files on VM only)

---

## 4️⃣ What If: Strike or Claim Resolution

### **Scenario 1: You Get a YouTube Copyright Claim**

**Steps**:

1. **Check Claim Details**:
   - Go to YouTube Studio → Content → Copyright claims
   - Identify which track triggered it
   - Note the claiming party (company name)

2. **Is it Featherstone Music or AEI Group?**
   - ✅ If YES: **Don't dispute**. These are false positives. Ignore.
   - ❌ If NO: **Proceed to step 3**

3. **Contact NCS**:
   - Go to: https://ncs.io/usage-policy/3/i-received-a-claim-strike
   - Fill form with:
     - YouTube video URL
     - Track name
     - Your confirmation: "I used ONLY NCS music"
   - Submit

4. **NCS Investigates** (1-5 business days):
   - They verify your track against their rights database
   - If valid NCS track: They send takedown request to YouTube, claim removed
   - If issue: They notify you

5. **YouTube Responds**:
   - Claim removed → No strike
   - Status shows in YouTube Studio

**Timeline**: 5-10 business days

---

### **Scenario 2: You Accidentally Use Non-NCS Music**

**If you mix NCS + non-NCS**:
- ❌ NCS **cannot** help you with non-NCS parts
- ❌ You're fully responsible for non-NCS claims
- ⚠️ Multiple claims can lead to strikes/channel termination

**Prevention**:
- ✅ Only source from NCS official channels
- ✅ Validate metadata sources before stream
- ✅ Use compliance checker in AuraStream (proposed FR-5.0)

---

### **Scenario 3: You Get a Strike** (Rare if following rules)

**Steps**:
1. YouTube notifies you (email + Studio warning)
2. Identify which video caused it
3. **If false claim from fraudster**:
   - File counter-notification to YouTube
   - Contact NCS with evidence (they may help)
4. **If legitimate claim from you using non-NCS music**:
   - Only solution: Remove that music from video
   - Wait 90 days for strike to expire
   - 3 strikes = channel terminated

**Prevention**: Don't use non-NCS music. Period.

---

## 📋 Implementation in AuraStream v2.0

### **New Feature (FR-5.0): Compliance & Audit**

Add to v2.0 roadmap:

```markdown
### Compliance & Audit Module (FR-5.0)
**What**: Dashboard + CLI compliance verification

**Components**:
- Compliance status indicator (Dashboard)
- Source verification for all tracks
- Credit line generator
- Pre-stream compliance check
- Audit log (all tracks streamed, sources, dates)

**Integrates with**:
- Metadata JSON files (source field)
- Dashboard (compliance card)
- CLI (pre-stream check)

**Prevents**:
- Non-NCS music mixing
- Missing credits
- Unverified sources
```

---

## ✅ Updated PRD Decisions

### **Decision 16: Production Server**

**Date**: 2026-06-06
**Decision**: Use Express.js + systemd (not python http.server)

**Rationale**:
- Production-grade (graceful shutdown, logging, caching)
- Aligns with Node.js stack
- Systemd standard on Linux VMs
- No extra infra (Nginx optional)

**Implementation**: `src/server/index.ts` + systemd service

**Status**: ✅ Locked for v2.0

---

### **Decision 17: NCS Compliance Strategy**

**Date**: 2026-06-06
**Decision**: Implement metadata source verification + compliance module

**Rationale**:
- NCS music only (all sources validated against official NCS)
- Metadata `.json` enforces source field
- Dashboard + CLI pre-stream compliance checks
- Prevents accidental non-NCS mixing
- Audit trail for claim defense

**Key Rules**:
1. Only download from official NCS sources
2. Credit in stream description (NCS format)
3. Metadata source field = official NCS link
4. If claim: Contact NCS with evidence

**Status**: ✅ Locked for v2.0 (+ optional FR-5.0)

---

## 📊 Impact on PRD v2.0

**No changes to existing FRs** (1-4)
**Adds considerations**:
- Server deployment (now recommended Express + systemd)
- NCS compliance audit (metadata source validation)
- Pre-stream checklist (compliance verification)

**New optional FR**:
- FR-5.0: Compliance & Audit module (Dashboard + CLI)

---

## 🎯 Action Items for Bruno

### **Before v2.0 Development**

- [ ] Review NCS ToS at provided links (already analyzed above)
- [ ] Create account at ncs.io
- [ ] Start sourcing audio from official NCS only
- [ ] Confirm: "I'll use Express.js server + systemd" (vs python http.server)
- [ ] Confirm: "I understand NCS rules and will credit properly"

### **During v2.0 Development**

- [ ] Implement Express server (Sprint 2 or 5)
- [ ] Add source field to metadata JSON schema (already in FR-3.1)
- [ ] (Optional) Implement compliance checker module

### **Before Launch**

- [ ] Run pre-stream compliance check (all metadata valid)
- [ ] Verify all audio from official NCS sources
- [ ] Prepare stream description with credits
- [ ] Set up systemd service for auto-restart

---

## 📞 NCS Support Contact

**If you get a claim**:
- Email: hello@ncs.io
- Claim form: https://ncs.io/usage-policy/3/i-received-a-claim-strike
- Expected response: 1-5 business days

---

**Status**: Compliance guide complete ✅
**Incorporated into PRD**: Yes (Decision 16-17)
**Next**: Update main PRD files with these decisions
**Owner**: Bruno Andrade Dinis
