# 🔴 AuraStream v2.0 — Critical Updates (Production & Compliance)

**Date**: 2026-06-06
**Status**: ⚠️ **Two Critical Considerations Added to PRD**
**Owner**: Bruno Andrade Dinis

---

## 📋 What Changed

You raised 2 critical points. We've incorporated them into the PRD:

### **1️⃣ Production Server** 🖥️

**Your Concern**:
> "Estou usando `python3 -m http.server` pra rodar o projeto. Algo mais alinhado com mercado?"

**Our Decision** (Decision 16):
- ❌ **Not**: python http.server (quick-and-dirty, não production-grade)
- ✅ **Yes**: Express.js + systemd (ou PM2)

**Why**:
- Graceful shutdown (SIGTERM handling)
- Proper logging + monitoring
- Static file caching headers
- Auto-restart on crash
- Aligns with Node.js stack

**Implementation**:
```bash
# src/server/index.ts (simple Express server)
npm run server
# Or auto-start via: systemctl start aurastream
```

**Full Guide**: See `compliance-and-deployment.md` section 1

---

### **2️⃣ NCS Compliance** 🎵⚖️

**Your Concern**:
> "Músicas do ncs.io, importante estar alinhado com políticas NCS e ToS pra não tomar strikes"

**Our Decision** (Decision 17):
- ✅ **CRITICAL**: Validação de source (ONLY oficial NCS sources)
- ✅ **CRITICAL**: Metadata `.json` source field obrigatório
- ✅ **CRITICAL**: Crediting format em stream description
- ✅ **CRITICAL**: Compliance audit trail pra defesa contra claims

**Why**:
- NCS é "claim-free" MAS só se usar oficial NCS
- Se misturar NCS + non-NCS = você é responsável
- Audit trail protege você se receber strike
- Compliance checker previne erros

**Key Rules** (locked forever):
1. Audio files: ONLY download from ncs.io, NCS YouTube, NCS Spotify, etc.
2. Never use: Third-party downloaders, re-uploads, songs not on official NCS
3. Metadata: EVERY track precisa de `source: "https://ncs.io/..."`
4. Credit: Stream description with NCS credit format
5. If claim: Contact NCS (they investigate + resolve in 5-10 days)

**Full Guide**: See `compliance-and-deployment.md` section 2

---

## 📊 Files Updated

### **New Document Created**
- ✅ `compliance-and-deployment.md` (comprehensive guide, 11 sections)

### **Decision Log Updated**
- ✅ Entry 16: Production Server (Express + systemd)
- ✅ Entry 17: NCS Compliance (source verification)

### **Addendum Updated**
- ✅ Section 11: Deployment & Compliance (CRITICAL)

---

## 🎯 Before You Start Development

### **Production Server - Decide Now**

Pick one:
- [ ] **Express.js + systemd** (recommended for VM Magalu)
- [ ] **Express.js + PM2** (if you prefer process manager)
- [ ] **Nginx reverse proxy** (if you want load balancing later)

**Recommendation**: Express + systemd (simplest for your use case)

### **NCS Compliance - Understand Now**

Confirm you'll:
- [ ] **Only download** audio from official NCS sources (verify URLs)
- [ ] **Add source field** to every metadata `.json` file
- [ ] **Credit properly** in stream description (format in guide)
- [ ] **No mixing** NCS + other music in same stream (important!)
- [ ] **Keep audit trail** (which tracks, when, from where)

---

## 📋 Pre-Launch Compliance Checklist

### **Before First Stream (Required)**

- [ ] **Server**: Express + systemd installed and tested
- [ ] **All Audio**: Downloaded ONLY from official NCS
- [ ] **Metadata**: Every `.json` file has `source` field with official NCS link
- [ ] **Credits**: Stream description ready with NCS credit format
- [ ] **Verification**: Run compliance check (validates all sources)

### **During Stream (Required)**

- [ ] **Description**: Include full credits (can copy from metadata)
- [ ] **Monitoring**: Watch for any YouTube claims (rare if using NCS only)

### **If You Get a Claim (Procedure)**

1. Check if it's from Featherstone Music or AEI Group
   - If YES: Ignore (false positive)
   - If NO: Go to step 2
2. Go to: https://ncs.io/usage-policy/3/i-received-a-claim-strike
3. Fill form with video URL + track name
4. NCS investigates (5-10 business days)
5. Claim resolved

---

## 🚀 Impact on v2.0 Timeline

**No timeline impact** — both decisions integrate seamlessly:

- **Server** (Decision 16): Add `src/server/index.ts` + systemd file (2h)
- **Compliance** (Decision 17): Add source field to metadata schema (already in FR-3.1 + validation logic)

**Optional Feature** (FR-5.0): Compliance checker module (dashboard + CLI pre-stream verification)

---

## 📂 Related Documents

| Document | Covers | Read If... |
|----------|--------|-----------|
| `prd.md` | Full spec | You want to understand FRs |
| `.decision-log.md` | All decisions + rationale | You want to know "why" |
| `addendum.md` | Technical deep-dive | You're an architect/dev |
| **`compliance-and-deployment.md`** | **Server + NCS rules** | **You want detailed setup** |
| `SUMMARY.md` | Quick 2-min reference | You want TL;DR |

---

## 🎯 Decision Summary

| Decision | Topic | Choice | Locked |
|----------|-------|--------|--------|
| #16 | Server | Express + systemd | ✅ Yes |
| #17 | NCS Compliance | Source verification | ✅ Yes |

**Both Critical** for v2.0 launch ⚠️

---

## 💬 Questions?

**On Server Setup**?
→ Read `compliance-and-deployment.md` section 1
→ Choose Express + systemd option

**On NCS Compliance**?
→ Read `compliance-and-deployment.md` section 2
→ Bookmark: https://ncs.io/usage-policy/
→ Key rule: ONLY official NCS sources

---

## ✅ Ready?

**Next Steps**:
1. Read `compliance-and-deployment.md` (15 min)
2. Decide: "Express + systemd?" → Confirm
3. Understand: NCS source-only rule → Confirm
4. → Proceed to Architecture phase

---

**Status**: Critical Updates Complete ✅
**Files Affected**: 3 (decision log, addendum, + new compliance doc)
**Timeline Impact**: None
**Critical?**: Yes (compliance blocks launch if not done right)
**Owner**: Bruno Andrade Dinis

**Everything is ready. Let's go!** 🚀
