# 🏗️ AuraStream v2.0 — Architecture Handoff

**Date**: 2026-06-06
**Status**: ✅ PRD Complete → Architecture Phase Ready
**Owner**: Bruno Andrade Dinis
**Next Phase**: Technical Architecture Design (1-2 days)

---

## ✅ 3 Critical Decisions CONFIRMED

### **Decision 16: Production Server** 🖥️

| Aspect | Decision |
|--------|----------|
| **Choice** | Express.js + systemd (not python http.server) |
| **Confirmed By** | Bruno Andrade Dinis |
| **Rationale** | Production-grade (graceful shutdown, logging, caching, auto-restart) |
| **Implementation** | `src/server/index.ts` + systemd service file |
| **Timeline Impact** | None (simple to add, Sprint 2 or 5) |
| **Status** | ✅ LOCKED |

---

### **Decision 17: NCS Music Compliance** 🎵⚖️

| Aspect | Decision |
|--------|----------|
| **Choice** | Source validation + metadata verification (NCS-only enforcement) |
| **Confirmed By** | Bruno Andrade Dinis |
| **Key Rule** | Audio ONLY from official NCS sources (ncs.io, YouTube NCS, Spotify NCS, etc.) |
| **Implementation** | Metadata source field validation + audit logger |
| **Timeline Impact** | None (already in metadata schema FR-3.1) |
| **Status** | ✅ LOCKED |

---

### **Decision 18: FR-5.0 Compliance Module** ✅

| Aspect | Decision |
|--------|----------|
| **Choice** | Implement FR-5.0 as formal v2.0 feature (not optional/postponed) |
| **Confirmed By** | Bruno Andrade Dinis |
| **Scope** | Dashboard widget + CLI compliance checker + audit trail |
| **Features** | Pre-stream verification, source validation, NCS strike helper |
| **Timeline** | Sprint 4 (integrated with UI elevation phase) |
| **Status** | ✅ APPROVED FOR v2.0 |

---

## 🎯 PRD Package Status

| Metric | Value | Status |
|--------|-------|--------|
| **Total Features** | 7 core + 1 compliance (FR-1.1 to FR-5.0) | ✅ Complete |
| **Total Decisions** | 18 entries (all locked) | ✅ Locked |
| **Documentation** | 9 files, 120 KB, 3,000+ lines | ✅ Complete |
| **User Journeys** | 2 paths (CLI primary + Dashboard secondary) | ✅ Detailed |
| **Success Metrics** | 7 key metrics with targets | ✅ Defined |
| **Timeline Estimate** | 5 sprints (~5 weeks) | ✅ Validated |

---

## 🚀 Feature List (v2.0 FINAL)

### **Tier 1: Core Audio & Streaming**
- ✅ FR-1.1: Sequenciador de Áudio (queue + loop + crossfade)
- ✅ FR-1.2: RTMP Bridge (YouTube transmission)
- ✅ FR-1.3: Asset Sync (file watcher)
- ✅ FR-1.4: Stream Controls (Pause/Continue/Stop/Restart)

### **Tier 2: User Interfaces**
- ✅ FR-2.1: Dashboard (browser monitoring UI)
- ✅ FR-2.2: MiniPlayer (cinematic overlay)
- ✅ FR-2.3: CLI Interface (terminal menu, primary for VM)

### **Tier 3: Configuration & Metadata**
- ✅ FR-3.1: Metadata JSON Schema
- ✅ FR-3.2: YouTube Key Management

### **Tier 4: Automation**
- ✅ FR-4.1: Auto-Shutdown Timers (optional preset durations)

### **Tier 5: Compliance & Audit**
- ✅ FR-5.0: Compliance Module (NCS validation + audit trail)

**Total**: 11 features (10 core + 1 optional automation)

---

## 📊 Sprint Allocation (Finalized)

| Sprint | Duration | Features | Owner |
|--------|----------|----------|-------|
| **Sprint 1** | Week 1-2 | FR-1.1, FR-1.4 | Dev team |
| **Sprint 2** | Week 2-3 | FR-2.3, FR-1.2, FR-3.2 | Dev team |
| **Sprint 3** | Week 3 | FR-1.3, FR-3.1 | Dev team |
| **Sprint 4** | Week 4 | FR-2.1, FR-2.2, FR-5.0 | Dev team |
| **Sprint 4.5** | Week 4 end | FR-4.1 (optional) | Dev team |
| **Sprint 5** | Week 5 | Integration, testing, deploy | Dev team |

**Critical Path**: FR-1.1 → FR-1.2 → FR-2.3 (CLI ready by Sprint 2 end)

---

## 🔄 Technical Decisions Locked

| Decision | Topic | Choice | Locked |
|----------|-------|--------|--------|
| #1 | Scope | Evolve MVP to production radio streaming | ✅ |
| #2 | Video | 1 file infinite loop | ✅ |
| #3 | AI | Batch generation on first load | ✅ |
| #4 | Audio Streaming | FFmpeg server-side (not Wasm) | ✅ |
| #5 | State Sync | File-based (not WebSocket) | ✅ |
| #6 | localStorage | Pragmatic for stream key | ✅ |
| #7 | Build | Static export `output: 'export'` | ✅ |
| #8 | Music | NCS.io only (licensing) | ✅ |
| #9 | Uptime | 99% target | ✅ |
| #10 | Stream Pause | Audio pauses, RTMP continues | ✅ |
| #11 | Metadata | JSON schema with source + credit | ✅ |
| #12 | localStorage | Secure (confirmed) | ✅ |
| #13 | Controls | Pause/Continue/Stop/Restart states | ✅ |
| #14 | CLI | Terminal menu (primary for VM) | ✅ |
| #15 | Auto-Shutdown | 1h-3w presets (optional) | ✅ |
| **#16** | **Server** | **Express + systemd** | **✅ CONFIRMED** |
| **#17** | **NCS Compliance** | **Source validation** | **✅ CONFIRMED** |
| **#18** | **FR-5.0** | **Compliance module** | **✅ APPROVED** |

**Status**: 18/18 decisions locked and confirmed ✅

---

## 📋 What Architecture Phase Needs to Cover

### **1. FFmpeg Pipeline** 🎬
- Server-side FFmpeg bridge (Decision #4)
- Input: Local audio loop + video background
- Output: RTMP stream to YouTube
- Behavior: Pause (pause audio, continue RTMP) vs Stop (close RTMP)
- **Deliverable**: FFmpeg subprocess architecture document

### **2. CLI ↔ Browser State Sync** 🔄
- File-based state (Decision #5)
- `state.json` as bridge between CLI process + browser process
- Watch mechanism for real-time sync
- Conflict resolution (CLI priority during startup)
- **Deliverable**: State machine diagram + protocol specification

### **3. Deployment Topology** 📍
- Express.js server on Magalu VM (Decision #16)
- systemd service configuration
- Auto-restart behavior
- Environmental setup (PORT, NODE_ENV, etc.)
- **Deliverable**: Deployment diagram + systemd spec

### **4. NCS Compliance Validation** ⚖️
- Source URL whitelist (Decision #17 + #18)
- Metadata validation logic
- Audit logger implementation
- Block-if-invalid behavior
- **Deliverable**: Compliance validation flowchart + audit schema

### **5. CLI Architecture** 🖥️
- inquirer.js menu structure
- Command routing (start, pause, continue, stop, compliance check, etc.)
- Real-time feedback (<200ms)
- Error handling + recovery
- **Deliverable**: CLI command tree + state flow

### **6. Dashboard State Management** 📊
- Real-time updates from state.json (polling vs watch)
- Compliance status widget
- Live indicator integration
- **Deliverable**: Dashboard component hierarchy + state flow

---

## 🎯 Pre-Architecture Confirmation

**Before proceeding, confirm:**

- [ ] **Decision 16 (Express + systemd)**: Understood and locked
- [ ] **Decision 17 (NCS source validation)**: Understood and locked
- [ ] **Decision 18 (FR-5.0 compliance)**: Approved for v2.0
- [ ] **5-sprint timeline**: Realistic and acceptable
- [ ] **PRD completeness**: Ready for Architecture detail

**If all checked**: Proceed to Architecture Phase ✅

---

## 📞 Handoff Information

| Role | Name | Responsibility |
|------|------|-----------------|
| **Product Manager** | John | PRD ownership, priority decisions |
| **Architect** | Winston | Technical design (Architecture phase) |
| **Lead Dev** | Amelia | Sprint execution + code ownership |
| **Test Architect** | Murat | Test strategy + automation |
| **Operator** | Bruno | Decision confirmation + business rules |

---

## 🔗 Reference Documents

| Doc | Purpose | Read If... |
|-----|---------|-----------|
| `prd.md` | Full feature specs | You want to understand FRs |
| `.decision-log.md` | All decisions with rationale | You want to know "why" |
| `compliance-and-deployment.md` | Server + NCS guide | You're setting up production |
| `addendum.md` | Technical deep-dives | You're an architect/dev |
| `CRITICAL-UPDATES.md` | What changed | You want a summary |
| `PACKAGE-STATUS.md` | Overall status | You want quick overview |

---

## ✅ Sign-Off

**PRD Phase**: COMPLETE ✅
**Decisions**: ALL LOCKED (18/18) ✅
**Features**: FULLY SPECIFIED (11 total) ✅
**Timeline**: REALISTIC (5 sprints) ✅
**Compliance**: CRITICAL PATH CONFIRMED ✅

**Status**: 🟢 **READY FOR ARCHITECTURE PHASE**

---

## 🚀 Next Actions

### **Immediate (Today)**
1. ✅ Review this handoff document
2. ✅ Confirm: "All 3 decisions understood?"
3. ✅ Confirm: "Ready for Architecture?"

### **Next Phase (Architecture — 1-2 days)**
1. **Architect (Winston)** leads:
   - FFmpeg pipeline design
   - CLI state sync protocol
   - Deployment topology
   - NCS compliance validation logic

2. **Output**: `architecture.md` with:
   - Technical design decisions
   - Component interaction diagrams
   - Data flow models
   - Deployment specs

3. **Following Phase**: Epics & Stories (break FRs into ~20-25 executable stories)

---

## 💬 Questions Before Architecture?

**On Production Server?** → See `compliance-and-deployment.md` section 1
**On NCS Compliance?** → See `compliance-and-deployment.md` section 2
**On FR-5.0 Scope?** → See `prd.md` FR-5.0 section
**On Timeline?** → Sprint breakdown in this doc (above)
**On Any Decision?** → See `.decision-log.md` entries 1-18

---

**Everything is locked. We're ready to build. Let's design the architecture!** 🏗️

**Proceed to Architecture Phase?** → YES ✅
