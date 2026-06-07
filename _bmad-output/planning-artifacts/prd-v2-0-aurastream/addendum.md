# AuraStream v2.0 — Addendum & Technical Deep-Dive

**Project**: AuraStream v2.0
**Version**: 2.0-addendum
**Date**: 2026-06-06

---

## 📋 Índice

1. **CLI Architecture & State Sync**
2. **FFmpeg Integration Strategy**
3. **Pause vs Stop: State Machine**
4. **Auto-Shutdown Timer Precision**
5. **Performance & Scalability Considerations**
6. **Alternative Approaches Considered**

---

## 1. CLI Architecture & State Sync

### **Why CLI is Critical**

VM Magalu Cloud rodando headless 99% do tempo → Bruno interage via SSH terminal, não GUI. Dashboard é secondary (nice-to-have); CLI é primary.

### **Tech Stack Decision**

```
CLI Layer (Node.js)
├── inquirer.js        (interactive menu)
├── chalk              (colored output)
├── commander.js       (arg parsing, help)
└── shared state       (file-based or Redis)
        ↓
Browser/Backend Layer
├── Web Audio API      (audio playback)
├── FFmpeg bridge      (RTMP encode/transmit)
└── Express/Next.js    (serve state + receive commands)
        ↓
Shared State Store
├── ./src/store/state.json  (OR redis if available)
├── Current track
├── Pause flag
├── Stream key
├── Timer state
└── Logs
```

### **State Sync Flow**

**CLI to Browser**: CLI writes to state file → Browser polls (500ms) → UI updates
**Browser to CLI**: Browser writes to state file → CLI polls (1s) → CLI reflects change

**Why file-based** (not WebSocket): VM environment may have constraints; file I/O is universal.

### **Example CLI Menu**

```
╭─ AuraStream CLI v2.0 ────────────────────╮
│ 🔴 Status: OFFLINE                       │
│ ⏱️  Uptime: 0s                            │
│ 🎵 Now playing: (not started)             │
│ ⏰ Timer: Not set                          │
├──────────────────────────────────────────┤
│ ? Select action:                         │
│  Start streaming                         │
│  Pause (keep transmitting)               │
│  Continue                                │
│  Stop streaming                          │
│  View queue                              │
│  Configure stream key                    │
│  Set auto-shutdown timer                 │
│  View logs                               │
│  Exit                                    │
╰──────────────────────────────────────────╯
```

### **Command Examples**

```bash
# Start streaming with defaults
npm run cli -- start

# Start with specific duration
npm run cli -- start --duration 2h

# Pause (doesn't stop RTMP)
npm run cli -- pause

# Continue after pause
npm run cli -- continue

# Stop everything
npm run cli -- stop

# Set timer
npm run cli -- timer 3h

# View current state
npm run cli -- status

# Skip to next track
npm run cli -- skip
```

---

## 2. FFmpeg Integration Strategy

### **Two Viable Approaches**

#### **Option A: FFmpeg Wasm (Browser-native)**
✅ Pros:
- Browser captures render directly
- No VM dependency on FFmpeg binary
- Works offline

❌ Cons:
- Wasm FFmpeg can be slow (~500MB bundle)
- Latency higher (may not meet <50ms audio sync)
- GPU acceleration limited

**Verdict**: Risky for streaming; requires perf testing first.

---

#### **Option B: FFmpeg Server (Recommended for v2.0)**
✅ Pros:
- Runs on VM (native speed)
- CPU acceleration available
- Can use screen capture APIs
- Time-tested pipeline

❌ Cons:
- Dependency on FFmpeg binary in VM
- Need to pipe audio/video from browser to server

**Verdict**: Pick this for v2.0. Fallback to Option A if VM permits.

### **Hybrid Flow (Recommended)**

```
Browser                        Server (VM)
┌─────────────────────┐        ┌──────────────────┐
│  Canvas + Audio     │        │                  │
│  (Web Audio API)    │──HTTP──│ Node.js Server   │
│                     │        │                  │
│                     │        │ FFmpeg child_proc│
└─────────────────────┘        └─────────┬────────┘
                                         │
                          RTMP Stream ──→ YouTube
```

**Steps**:
1. Browser streams video frames + audio chunks via WebRTC or HTTP chunked upload
2. Server receives chunks, feeds to FFmpeg stdin
3. FFmpeg encodes → outputs RTMP to YouTube
4. Server broadcasts uptime + status back to CLI/Browser

**Latency Budget**:
- Network: ~20ms (localhost in VM)
- Audio encode: ~50ms
- RTMP transmit: ~100ms
- **Total**: ~170ms (still acceptable for YouTube)

### **FFmpeg Command Template**

```bash
ffmpeg \
  -f video4linux2 -i /dev/video0 \  # Screen capture (or X11grab on Linux)
  -f pulse -i default \               # Audio input (PulseAudio)
  -c:v libx264 \                     # H.264 video codec
  -preset fast \                     # Encoding speed
  -b:v 3500k \                       # Video bitrate (from config)
  -c:a aac \                         # Audio codec
  -b:a 128k \                        # Audio bitrate
  -f flv \                           # Output format (FLV for RTMP)
  rtmp://a.rtmp.youtube.com/live2/STREAM_KEY
```

**Alternative (if screen capture unavailable)**: Use Canvas framebuffer capture lib + pipe to FFmpeg.

---

## 3. Pause vs Stop: State Machine

### **Why Pause ≠ Stop**

**Pause**: Audio stops, but RTMP transmit **continues**
- Use case: Bruno adding tracks to queue
- YouTube viewers see: MiniPlayer static, no music, but "LIVE" indicator on
- Duration: until Continue clicked

**Stop**: Everything stops
- RTMP closes gracefully
- Stream ends on YouTube
- Viewers see: "Stream ended"

### **State Machine Diagram**

```
                    ┌──────────────┐
                    │    IDLE      │
                    │ (not started)│
                    └───────┬──────┘
                            │
                       Start│
                            ↓
                    ┌──────────────┐
                 ┌─→│    LIVE      │←─┐
                 │  │ (audio+RTMP) │  │ Continue
                 │  └───────┬──────┘  │
                 │          │ Pause   │
                 │          ↓         │
         Restart │  ┌──────────────┐  │
                 │  │   PAUSED     │──┘
                 │  │(RTMP only)   │
                 │  └───────┬──────┘
                 │          │ Stop
                 │          ↓
                 └─────────────────┘
                        ↓
                    ┌──────────────┐
                    │   STOPPED    │
                    │ (all offline) │
                    └──────────────┘
```

### **State Persistence**

```typescript
type StreamState = {
  status: 'idle' | 'live' | 'paused' | 'stopped'
  uptime: number        // seconds since start
  currentTrackId: string
  streamKey: string     // from localStorage or .env
  rtmpConnection: boolean
  audioPlaying: boolean
  pausedAt: number      // timestamp when paused
  lastError?: string
}
```

**File**: `./src/store/state.json` (shared between CLI + Browser)

---

## 4. Auto-Shutdown Timer Precision

### **Challenge**

Timers em JavaScript podem ter ±100ms drift em 1h+. Para v2.0, ±5s é aceitável; se Bruno quer ±1s, precisa de estratégia diferente.

### **Recommended: Server-side Timer**

```typescript
// server.ts
const scheduledShutdownTime = Date.now() + (duration * 1000)

const timerInterval = setInterval(() => {
  const now = Date.now()
  const remaining = scheduledShutdownTime - now

  if (remaining <= 0) {
    // SHUTDOWN
    gracefulStop()
    clearInterval(timerInterval)
  } else if (remaining <= 5 * 60 * 1000) {
    // 5min warning
    notifyUser(`Shutting down in ${remaining / 1000}s`)
  }

  // Broadcast to CLI + Browser
  updateState({ timerRemaining: remaining })
}, 500) // Poll every 500ms for precision
```

**Precision Achievable**: ±50ms (server-side) vs ±500ms (client-side)

### **Optional: Warning Sequence**

```
-5 min: Toast "Shutting down in 5 minutes"
-1 min: Toast + Audio tone (optional: 1s beep)
-10s:   Countdown display
0s:     Graceful shutdown:
        1. Pause audio
        2. Wait 5s
        3. Close RTMP
        4. Log event
        5. Idle
```

---

## 5. Performance & Scalability Considerations

### **Targets**

| Component | Target | Achievable? |
|-----------|--------|-----------|
| CLI menu response | <200ms | ✅ Yes (polling state file) |
| Browser UI update | <100ms | ✅ Yes (500ms polling) |
| Audio crossfade | <1s | ✅ Yes (Web Audio API) |
| RTMP latency | <2s | ✅ Yes (encoded + buffering) |
| MiniPlayer render | 60fps | ✅ Yes (simple CSS animations) |

### **Scalability**

v2.0 is **single-operator** (Bruno only), so:
- No concurrent connections to manage
- No auth/authorization layer needed
- State management can be file-based (no DB)
- Logging can be in-memory + file append

**If multi-user later** (v3.0+):
- Move state to Redis
- Add per-user sessions
- Implement WebSocket for real-time sync
- Add audit logging

### **Memory Footprint (Estimated)**

- Browser: ~100MB (React + Web Audio buffers)
- FFmpeg process: ~200MB (encoding buffers)
- Node.js server: ~50MB (Base)
- **Total**: ~350MB (well within VM specs)

### **Network Bandwidth (VM ↔ YouTube)**

- Outbound (RTMP): 3-5 Mbps (YouTube upload)
- Inbound (state sync): <1 Mbps (polling CLI)
- **Total**: ~5 Mbps (typical Magalu cloud allowance)

---

## 6. Alternative Approaches Considered & Rejected

### **A. WebSocket State Sync (vs File-based)**

❌ **Rejected** because:
- Adds complexity (server + client library)
- May not work in VM with firewall constraints
- File I/O is universal, proven

✅ **File-based picked** because:
- Universal (any OS)
- Easy to debug (can `cat state.json`)
- No extra dependencies

---

### **B. Audio File Streaming (vs Local Loop)**

Considered: Stream audio from server instead of Web Audio API playing locally

❌ **Rejected** because:
- Adds latency (server → browser network)
- Complicates crossfade (server-side mixing)
- Overkill for single-operator

✅ **Local Web Audio picked** because:
- <50ms latency (local)
- Smooth crossfade (Web Audio API)
- Simpler architecture

---

### **C. Persistent Playlist Storage (v2.1 candidate)**

Considered: Save playlist state, resume mid-transmission

❌ **Rejected for v2.0** because:
- Out of scope (Bruno doesn't need it yet)
- Adds DB dependency
- v2.1 feature candidate

---

### **D. Multi-Platform Streaming (YouTube + Twitch)**

Considered: RTMP to multiple platforms simultaneously

❌ **Rejected for v2.0** because:
- Doubles complexity
- YouTube is sole target for Bruno's channel
- v2.1+ feature

✅ **YouTube-only picked** because:
- Simplifies FFmpeg config
- One stream key management
- Meets current needs

---

## 7. Deployment & DevOps

### **VM Setup (Magalu Cloud)**

**Prerequisites**:
```bash
# On VM
sudo apt-get install -y nodejs npm ffmpeg pulseaudio

# Verify
node --version    # v18+
npm --version      # v10+
ffmpeg -version   # N-XXXXXX+
```

### **Startup Script** (`start.sh`)

```bash
#!/bin/bash

# Set env vars
export NODE_ENV=production
export YOUTUBE_STREAM_KEY=${YOUTUBE_STREAM_KEY:-}
export FFMPEG_BITRATE=3500k

# Start server
npm run build
npm run start &

# Wait for server ready
sleep 2

# Start CLI (optional for attendant monitoring)
npm run cli
```

### **Monitoring** (v2.1 candidate)

- Systemd service with auto-restart
- Health check endpoint (`/health`)
- Prometheus metrics export
- Alerting on uptime < 95%

---

## 8. Security Considerations

### **Stream Key Safety**

✅ **Current approach** (v2.0):
- localStorage (browser) + .env (server)
- No logs, no console output
- Masked input

⚠️ **Limitation**:
- If VM is compromised, key is readable
- No end-to-end encryption

✅ **Mitigation**:
- Rotate key monthly
- Store in encrypted env var (optional: use AWS Secrets Manager)
- Never commit `.env` to git

---

## 9. Testing Strategy (v2.0)

### **Unit Tests** (20%)
- Audio looping logic
- Crossfade math
- State machine transitions

### **Integration Tests** (30%)
- CLI menu interactions
- state.json sync
- FFmpeg subprocess spawning

### **E2E Tests** (50%)
- Full streaming session (1h mock)
- Pause/continue cycle
- Auto-shutdown with timer
- Dashboard + CLI parity

### **Load/Stress Testing**
- 8h+ continuous stream
- Network drop + reconnect
- Pause/continue rapid toggle

---

## 10. Known Limitations & Future Considerations

### **v2.0 Limitations**

1. **Single video background** (no playlist)
2. **No audio effects** (EQ, reverb, normalization)
3. **No chat integration** (YouTube chat ignored)
4. **No playlist save/resume** (always starts from queue top)
5. **File-based state** (not scalable to multi-user)

### **v2.1 Candidates**

- Playlist presets
- Audio normalization (LUFS targeting)
- Chat reader/integration
- Web UI polish (design system refinement)
- Multi-platform support (Twitch, etc.)
- Compliance module (FR-5.0) — audit + source verification

### **v3.0 Vision**

- Multi-user dashboard
- Cloud state (Firebase/Supabase)
- Mobile companion app
- AI-powered auto-description for any audio
- Scheduled streams (calendar)

---

## 11. Deployment & Compliance (CRITICAL) ⚠️

**See separate document**: `compliance-and-deployment.md`

This comprehensive guide covers:

**Production Server**:
- Express.js + systemd (not python http.server)
- PM2 alternative (process manager)
- Nginx reverse proxy (optional, for scaling)

**NCS Music Compliance** (CRITICAL for YouTube):
- Source verification (official NCS only)
- Metadata `.json` source field validation
- Crediting format (required for claim-free protection)
- Strike resolution procedure
- Pre-launch compliance checklist

**Key Locked Decisions**:
- **Decision 16**: Use Express.js + systemd
- **Decision 17**: NCS music source verification + compliance module

**Before Launch, You Must**:
- ✅ All audio from official NCS sources (ncs.io, NCS YouTube, etc.)
- ✅ Metadata `.json` files include `source` with official NCS link
- ✅ Stream description includes proper NCS credits
- ✅ Express server + systemd running (not python http.server)
- ✅ Compliance check passes (no non-NCS music mixing)

**If You Get a Claim**:
- Check claiming party (some are false positives)
- Contact NCS with evidence (they investigate)
- Expected: 5-10 business days resolution

---

## 📝 Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-06 | 2.0-addendum | Initial creation (sections 1-10) |
| 2026-06-06 | 2.0-addendum-v2 | Added section 11 (deployment & compliance) |

---

**Status**: Addendum \u2192 Ready for Architecture & Epics phases
**Owner**: Bruno Andrade Dinis
**Next**: `bmad-create-architecture` (tech design deep-dive)
