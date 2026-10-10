# Zyron — The Department of Zyron ⚡🏛️

> Official interactive Department of Intake & Whitelist Quest Experience for **Zyron** ([@platform_360](https://x.com/platform_360) · [zy-ron.tech](https://www.zy-ron.tech/)).

An immersive, point-and-click retro bureaucratic Department experience inspired by `fomies.family`, featuring real-time desk interactions, Clerk eye tracking, animated soundscapes, whitelist quest verification, 3D interactive business cards, noticeboard dispatches, collection gallery, and a full-featured Mission Control Admin Panel.

---

## 🚀 Features

### 🏛️ The Clerk's Intake Office (`index.html`)
- **Interactive Point-and-Click Bureaucracy**: Explore the Hallway (`#s-gate`) and the Intake Office (`#s-room`).
- **Clerk Eye Tracking**: Real-time iris tracking following user cursor movements across the desk.
- **Dynamic Desk Bell & Dialogues**: Ring the bell to hear randomized Clerk responses and trigger sound effects.
- **3D Business Card**: Interactive 3D flip card with official Zyron links:
  - Official X: [@platform_360](https://x.com/platform_360)
  - OpenSea collection shortcut
  - Department direct line: `555-ZYRON ext. 3`
  - Intake email: `intake@zy-ron.tech`
- **Noticeboard Dispatches**: Official bulletin board with pinned directives and community updates.
- **Framed Collection Gallery**: 3D tilt gallery showcasing Zyron collection characters (`ZYRON #01` to `ZYRON #06`).
- **Atmospheric Audio Engine**: Ambient room hum, desk bell, squeaky doors, page rustles, and typewriter feedback with master volume control.

### 📋 Whitelist Quests Modal (`#tasks`)
- **Dynamic Clipboard Engine**: Loaded in real-time from `ZyronDB` (with zero build-step client storage).
- **Core Verification Quests**:
  - Follow [@platform_360](https://x.com/platform_360) on X
  - Like, Repost & Comment on Pinned Post
  - Submit EVM Wallet Address (`0x...`)
- **Case Reference Generator**: Generates official `#ZYRON-[ID]` case numbers upon submission.
- **Status Sync**: Automatically updates status and pauses when toggled from Mission Control.

### ⚡ Mission Control Admin Panel (`admin.html`)
- **PIN Protected Access**: Security PIN authentication (Default: `zyron2026`).
- **Live Metrics Dashboard**: Real-time counters for Total Applications, Approved, Pending, Rejected, and Active Quests.
- **Applications & Proofs Management**:
  - Filter by status (`All`, `Pending`, `Approved`, `Rejected`)
  - Real-time search across wallet addresses, handles, and case IDs
  - Inline and bulk status updates (`Approve`, `Reject`, `Delete`)
  - Proof inspection modal with direct links to applicant X handles and verification posts
- **Quests & Tasks Manager**:
  - Create new tasks (Twitter Follow, Engagement, Wallet, Discord, or Custom)
  - Edit and reorder tasks (move up / down)
  - Reset to official Zyron defaults
- **Export & Import Hub**:
  - Export applications as `.csv`
  - 1-Click copy approved EVM wallet addresses (Newline, Comma, or JSON Array format)
  - Full database JSON backup and restore

---

## 🛠️ Tech Stack
- **HTML5 & Vanilla CSS3**: Highly optimized, responsive, and framework-free.
- **JavaScript (ES6+)**: High-performance interaction engine and modular storage architecture (`ZyronDB` with backward-compatible `HomiesDB` aliasing).
- **No external heavy dependencies**: Instant load times with zero build step required.

---

## 💻 Running Locally

You can serve the files with any static HTTP server. For example, using Python:

```bash
# Python 3
python3 -m http.server 3000
```

Then visit:
- **Public Department**: [http://localhost:3000](http://localhost:3000)
- **Mission Control Admin**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html) *(Default PIN: `zyron2026`)*

---

## 📜 Credits & Brand
- **Brand**: Zyron ([zy-ron.tech](https://www.zy-ron.tech/))
- **Official X**: [@platform_360](https://x.com/platform_360)
- © 2026 Zyron. All rights reserved.
