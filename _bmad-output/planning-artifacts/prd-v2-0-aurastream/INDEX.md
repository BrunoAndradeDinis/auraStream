# 📑 AuraStream v2.0 PRD — Document Index

**Status**: Complete Draft Package ✅
**Created**: 2026-06-06
**Owner**: Bruno Andrade Dinis

---

## 📂 Document Structure

```
_bmad-output/planning-artifacts/prd-v2-0-aurastream/
├── SUMMARY.md                 ← START HERE: 2-min quick reference
├── prd.md                     ← Full PRD: Features, metrics, roadmap
├── .decision-log.md           ← Decision audit trail (15 entries)
├── addendum.md                ← Technical deep-dive
└── INDEX.md                   ← This file
```

---

## 🎯 Reading Guide (Choose Your Path)

### **Path 1: Executive Summary** (5 min)
1. Read: `SUMMARY.md`
   - What's new?
   - How to use?
   - Critical metrics?

### **Path 2: Full Review** (30 min)
1. Read: `SUMMARY.md` (5 min)
2. Read: `prd.md` sections:
   - Visão & Escopo
   - Success Metrics
   - Funcionalidades (FR-1.x thru FR-4.1)
   - User Journey
   - Fases & Rollout

### **Path 3: Deep Technical** (60 min)
1. Full PRD (Path 2)
2. Read: `addendum.md` sections:
   - CLI Architecture
   - FFmpeg Integration Strategy
   - State Machine (Pause vs Stop)
   - Performance Considerations
3. Skim: `.decision-log.md` (reference specific decisions)

### **Path 4: Decision Audit** (15 min)
1. Skim: `SUMMARY.md` (context)
2. Read: `.decision-log.md` (all 15 entries)
3. Reference: `prd.md` sections for details

---

## 📄 Document Details

### **SUMMARY.md** — Quick Reference (High-Level)

**Length**: ~3 pages
**Audience**: Anyone (non-technical OK)
**Contains**:
- What's new in v2.0 (feature table)
- How to use (CLI examples)
- Key metrics & targets
- File structure (where stuff lives)
- Metadata format (JSON example)
- User journey (2h stream walkthrough)
- Sprint breakdown
- Checklist for launch

**When to read**: First! Get oriented.

---

### **prd.md** — Product Requirements Document (Official)

**Length**: ~12 pages
**Audience**: PM, Architect, Dev team
**Contains**:
1. **Visão & Escopo**
   - What is v2.0?
   - Why these 3 fronts?
   - Expected result

2. **Success Metrics**
   - 6 KPIs (uptime, latency, responsiveness, quality, render, precision)

3. **Funcionalidades** (Grouped by phase)
   - **Phase 1: Core Audio Engine**
     - FR-1.1: Sequenciador (loop, crossfade, controls)
     - FR-1.2: RTMP Bridge (YouTube transmit, reconnect)
     - FR-1.3: Asset Sync (file watcher, auto-update)
     - FR-1.4: Stream Controls (Pause/Continue/Stop/Restart) — NEW

   - **Phase 2: UI/UX**
     - FR-2.1: Dashboard (monitoring, config, logs)
     - FR-2.2: MiniPlayer (display overlay, cinematic)
     - FR-2.3: CLI Interface (terminal menu) — NEW

   - **Phase 3: Config & Metadata**
     - FR-3.1: Metadata JSON schema
     - FR-3.2: YouTube Key Management

   - **Phase 4: Automation**
     - FR-4.1: Auto-Shutdown Timers (OPTIONAL) — NEW

4. **User Journey**
   - Scenario: Bruno's 2h streaming session
   - Path 1: CLI (primary, headless)
   - Path 2: Dashboard (secondary, GUI)

5. **Design Decisions & Constraints**
   - Scope excluded (deliberately)
   - Tech constraints
   - Compliance & safety

6. **Metrics & Observability**
   - What we measure
   - Logs & debugging

7. **Fases & Rollout**
   - 5 sprints (1-5 weeks each)
   - Task breakdown per sprint

8. **Dependências & Bloqueadores**
   - External (VM, YouTube, Genkit)
   - Internal (FFmpeg, CLI design)

9. **Open Questions** (RESOLVED ✅)
   - Video loop: 1 arquivo único loopa
   - IA batch latency: na primeira load
   - localStorage security: seguro

---

### **.decision-log.md** — Decision Audit Trail

**Length**: ~5 pages
**Audience**: PM, stakeholders, future reference
**Contains**:
15 entries documenting:
- Entry 1: PRD scope & intent
- Entry 2: Three feature fronts acceptance
- Entry 3: Audio formats & sequencing
- Entry 4: RTMP/SRT strategy
- Entry 5: Asset sync philosophy
- Entry 6: Metadata unification
- Entry 7: YouTube Stream Key security model
- Entry 8: Dashboard scope
- Entry 9: MiniPlayer as pure display
- Entry 10: Sprint phasing
- Entry 11: Metrics & success
- Entry 12: Open questions resolved ✅
- Entry 13: Stream control operations
- Entry 14: Terminal CLI interface
- Entry 15: Auto-shutdown timers

**Each entry contains**:
- Date
- Decision made
- Rationale
- Implementation notes
- Status

**When to read**: Need to understand "why" a specific design choice? Find it here.

---

### **addendum.md** — Technical Deep-Dive

**Length**: ~15 pages
**Audience**: Architect, senior dev, tech leads
**Contains**:

1. **CLI Architecture & State Sync**
   - Why CLI critical (VM headless context)
   - Tech stack (inquirer, chalk, commander)
   - State sync flow (file-based vs WebSocket trade-offs)
   - CLI menu mockup
   - Command examples

2. **FFmpeg Integration Strategy**
   - Option A: Wasm (rejected)
   - Option B: Server-side (chosen)
   - Hybrid flow diagram
   - Latency budget
   - FFmpeg command template

3. **Pause vs Stop: State Machine**
   - Why they're different
   - State machine diagram
   - State persistence (TypeScript types)

4. **Auto-Shutdown Timer Precision**
   - Challenge (drift in JS timers)
   - Server-side solution (±50ms achievable)
   - Optional warning sequence

5. **Performance & Scalability Considerations**
   - Component targets (CLI, Browser, Audio, RTMP, MiniPlayer)
   - Scalability notes (single-operator v2.0, multi-user v3.0)
   - Memory footprint estimate (~350MB)
   - Bandwidth estimate (~5 Mbps)

6. **Alternative Approaches Considered & Rejected**
   - WebSocket vs file-based (why file-based won)
   - Audio streaming vs local loop (why local won)
   - Persistent playlist storage (defer to v2.1)
   - Multi-platform (defer to v2.1)

7. **Deployment & DevOps**
   - VM setup (prerequisites: Node, npm, FFmpeg, PulseAudio)
   - Startup script
   - Monitoring (v2.1 candidate)

8. **Security Considerations**
   - Stream key safety
   - Current approach: localStorage + .env
   - Limitations & mitigations

9. **Testing Strategy**
   - Unit tests (20%)
   - Integration tests (30%)
   - E2E tests (50%)
   - Load/stress testing (8h+)

10. **Known Limitations & Future Considerations**
    - v2.0 limitations (no playlists, no effects, no chat, no presets, no multi-user)
    - v2.1 candidates (playlist presets, normalization, chat)
    - v3.0 vision (multi-user, cloud state, mobile app, AI descriptions, scheduled streams)

---

## 🎬 How These Documents Relate

```
SUMMARY.md
    ↓
    ├─→ prd.md (for details on features)
    │   ├─→ .decision-log.md (for "why" each feature exists)
    │   └─→ addendum.md (for technical "how")
    │
    ├─→ .decision-log.md (for decision audit)
    │   └─→ prd.md (for context of each decision)
    │
    └─→ addendum.md (for technical depth)
        └─→ prd.md (for feature context)
```

---

## 🎯 What Bruno Should Do Next

### **Option 1: Fast-Track (Next 2 hours)**
1. ✅ Read `SUMMARY.md` (5 min)
2. ✅ Skim `prd.md` section "Funcionalidades" (10 min)
3. ✅ Confirm: "Looks good?" Yes/No/Tweaks needed?
4. → Move to **Architecture** phase

### **Option 2: Thorough (Next 4 hours)**
1. ✅ Read `SUMMARY.md` (5 min)
2. ✅ Read full `prd.md` (20 min)
3. ✅ Read `.decision-log.md` (10 min)
4. ✅ Skim `addendum.md` (15 min, technical review)
5. ✅ Notes + questions?
6. → Refine PRD, move to **Architecture**

### **Option 3: Deep Review (Next 8 hours)**
1. ✅ Full read of all 4 documents (full pace, no rush)
2. ✅ Technical team review (if applicable)
3. ✅ Detailed feedback on each section
4. → Incorporate feedback, finalize PRD
5. → Move to **Architecture** + **Epics & Stories**

---

## 🚀 Next Phases (After PRD Finalized)

### **Phase: Architecture** (1-2 days)
Run: `bmad-create-architecture`
- Technical design for FFmpeg pipeline
- CLI + Browser state sync protocol
- Deployment topology
- Risk mitigation

**Output**: `architecture.md`

### **Phase: Epics & Stories** (1 day)
Run: `bmad-create-epics-and-stories`
- Break 7 FRs into ~20-25 user stories
- Story point estimation
- Sprint allocation
- Acceptance criteria

**Output**: `epics.md` + individual story files

### **Phase: Development** (5 weeks)
Run: `bmad-dev-story` per sprint
- Sprint 1-5 execution
- Code reviews
- Testing
- Deployment

**Output**: Running AuraStream v2.0 on YouTube! 🚀

---

## ✅ Quality Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Features defined? | ✅ | 7 FRs fully detailed |
| User journey? | ✅ | CLI + Browser paths |
| Success metrics? | ✅ | 6 KPIs, targets set |
| Scope clear? | ✅ | Included + excluded lists |
| Decisions logged? | ✅ | 15 entries, audit trail |
| Tech stack validated? | ✅ | addendum deep-dive |
| Open questions? | ✅ | 3 resolved, 0 pending |
| Ready for Architecture? | ✅ | Yes! |

---

## 📞 Questions or Issues?

- **"What's the scope again?"** → `SUMMARY.md` "What's New"
- **"Why this design choice?"** → `.decision-log.md` find entry
- **"How does FFmpeg integrate?"** → `addendum.md` section 2
- **"What's the full user journey?"** → `prd.md` section "User Journey"
- **"What are the success metrics?"** → `SUMMARY.md` "Key Metrics"
- **"Tell me all tech decisions"** → `.decision-log.md` (read sequentially)

---

## 📊 Document Statistics

| Document | Pages | Words | Key Sections |
|----------|-------|-------|--------------|
| SUMMARY.md | 3 | ~1500 | 15 sections |
| prd.md | 12 | ~5000 | 9 major sections |
| .decision-log.md | 5 | ~2000 | 15 decision entries |
| addendum.md | 15 | ~7000 | 10 deep-dive sections |
| **TOTAL** | **35** | **15,500** | **49 subsections** |

---

**Package Complete ✅**

**Status**: Ready for review + Architecture phase
**Created**: 2026-06-06
**Owner**: Bruno Andrade Dinis
**Next**: `bmad-create-architecture` (tech design)

---

*This PRD represents a comprehensive, decision-audited, technically-validated plan for AuraStream v2.0. All major decisions are documented. All FRs are detailed. Ready to move forward!*
