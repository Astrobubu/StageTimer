# Synchronized Timer App - Project Roadmap

## Project Overview
Build a web-based synchronized timer application where one device controls a timer that displays in real-time across multiple viewer devices.

---

## Phase 1: Planning & Design

### Step 1.1: UI Mockup
- [ ] Design **Controller Page** mockup
  - Timer duration input
  - Start/Pause/Reset buttons
  - Current timer display
  - Connection status indicator
  - Share link section
- [ ] Design **Viewer Page** mockup
  - Fullscreen timer display
  - Clean, minimal interface
  - Large, readable numbers
- [ ] Design **Room Creation Page** mockup
  - Simple form to generate new room
  - Display generated room ID/link

**Deliverable:** Wireframes or Figma/Sketch designs

---

## Phase 2: Basic Frontend Structure

### Step 2.1: Project Setup
- [ ] Initialize React/Next.js project (or preferred framework)
- [ ] Set up basic routing:
  - `/` - Home/Room creation
  - `/room/:roomId/controller` - Controller page
  - `/room/:roomId/viewer` - Viewer page
- [ ] Install necessary dependencies (socket.io-client, etc.)

### Step 2.2: Static UI Implementation
- [ ] Build Home page with room creation form
- [ ] Build Controller page (static, no functionality)
- [ ] Build Viewer page (static, no functionality)
- [ ] Implement responsive design
- [ ] Add basic styling/CSS

**Deliverable:** Static pages with proper routing

---

## Phase 3: Backend & Real-time Sync

### Step 3.1: Backend Setup
- [ ] Set up Node.js/Express server
- [ ] Integrate WebSocket library (Socket.io recommended)
- [ ] Create room management system:
  - Generate unique room IDs
  - Store active rooms in memory/database
  - Handle room lifecycle

### Step 3.2: WebSocket Events
- [ ] Define socket events:
  - `join-room` - Client joins a room
  - `timer-update` - Broadcast timer state changes
  - `timer-start` - Start timer
  - `timer-pause` - Pause timer
  - `timer-reset` - Reset timer
  - `connection-status` - Track connected devices
- [ ] Implement server-side event handlers
- [ ] Implement client-side event listeners

**Deliverable:** Working WebSocket connection between clients

---

## Phase 4: Core Timer Functionality

### Step 4.1: Controller Implementation
- [ ] Add timer duration input with validation
- [ ] Implement Start button functionality
- [ ] Implement Pause button functionality
- [ ] Implement Reset button functionality
- [ ] Display current timer state
- [ ] Emit timer events to server

### Step 4.2: Viewer Implementation
- [ ] Receive timer state from server
- [ ] Display countdown in large format
- [ ] Update display in real-time
- [ ] Handle reconnection gracefully

### Step 4.3: Timer Logic
- [ ] Implement countdown mechanism
- [ ] Ensure accurate time tracking
- [ ] Synchronize time across all viewers
- [ ] Handle timer completion (reach 0:00)

**Deliverable:** Working synchronized countdown timer

---

## Phase 5: Enhanced Features

### Step 5.1: Connection Management
- [ ] Display list of connected devices on controller
- [ ] Show connection status (online/offline)
- [ ] Handle disconnections gracefully
- [ ] Auto-reconnect on network issues

### Step 5.2: Multiple Timer Modes
- [ ] Add Count-up mode
- [ ] Add Clock (time of day) mode
- [ ] Allow switching between modes

### Step 5.3: Share Functionality
- [ ] Generate shareable viewer link
- [ ] Add "Copy Link" button
- [ ] Optional: Generate QR code for link

**Deliverable:** Full-featured synchronized timer with connection management

---

## Phase 6: Polish & Additional Features

### Step 6.1: Messaging System
- [ ] Add message input on controller
- [ ] Display messages fullscreen on viewer
- [ ] Queue multiple messages
- [ ] Basic styling options (colors, flash)

### Step 6.2: Sound Alerts
- [ ] Add sound when timer reaches 0:00
- [ ] Allow controller to enable/disable sound
- [ ] Include a few pre-defined alert sounds

### Step 6.3: Timer Scheduling (Optional)
- [ ] Schedule timer to start at specific time
- [ ] Link multiple timers together
- [ ] Auto-advance to next timer

**Deliverable:** Polished app with messaging and alerts

---

## Phase 7: Testing & Deployment

### Step 7.1: Testing
- [ ] Test with multiple devices simultaneously
- [ ] Test connection reliability
- [ ] Test across different browsers
- [ ] Test on mobile devices
- [ ] Load testing with many concurrent rooms

### Step 7.2: Deployment
- [ ] Set up hosting (Vercel, Heroku, AWS, etc.)
- [ ] Configure WebSocket server for production
- [ ] Set up domain (optional)
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring/logging

### Step 7.3: Documentation
- [ ] Write README with setup instructions
- [ ] Document API/socket events
- [ ] Create user guide

**Deliverable:** Production-ready application

---

## Tech Stack Recommendations

### Frontend
- **Framework:** Next.js or React + Vite
- **Styling:** Tailwind CSS or styled-components
- **WebSocket Client:** socket.io-client

### Backend
- **Server:** Node.js + Express
- **WebSocket:** Socket.io
- **Room Storage:** In-memory (Redis for production)

### Deployment
- **Frontend:** Vercel or Netlify
- **Backend:** Railway, Render, or AWS
- **Database:** Optional - PostgreSQL/MongoDB for persistent rooms

---

## Estimated Timeline

- **Phase 1:** 1-2 days
- **Phase 2:** 2-3 days
- **Phase 3:** 3-4 days
- **Phase 4:** 3-4 days
- **Phase 5:** 2-3 days
- **Phase 6:** 2-3 days
- **Phase 7:** 2-3 days

**Total:** ~2-3 weeks for MVP (single developer)

---

## Success Criteria

✅ User can create a room and get a shareable link  
✅ Controller can start/pause/reset timer  
✅ Multiple viewers display timer in sync (< 1 second delay)  
✅ Handles 10+ simultaneous viewers per room  
✅ Works on desktop and mobile browsers  
✅ Reconnects automatically on network disruption
