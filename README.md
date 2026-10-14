# 🚀 CausalFunnel - Production-Grade User Analytics & Heatmap Platform

A high-performance, resilient, end-to-end User Analytics and Visual Heatmap Intelligence application built for the **CausalFunnel** Senior Full-Stack Engineering assessment.

---

## 🌟 Key Features

1. **Autonomous Embedded Tracker (`public/tracker.js`)**:
   - Zero-dependency, lightweight vanilla JavaScript snippet.
   - Embeddable via a single `<script>` tag on any third-party website, web app, or e-commerce store.
   - **Intelligent Session Management**: Generates cryptographic UUID v4 sessions; reuses active session across page loads and tabs; handles 30-minute sliding inactivity timeouts.
   - **Normalized Heatmap Coordinates**: Automatically scales document and viewport coordinates into normalized values `(0.0000 - 1.0000)` so heatmaps render responsively across mobile, tablet, and desktop viewports.
   - **Reliable Ingestion & Batching**: Buffers events in an in-memory queue, flushing in batches via `navigator.sendBeacon` (Blob format) with Keep-Alive `fetch()` and `XMLHttpRequest` fallback.
   - **Unload & Visibility Handlers**: Flushes immediately on `visibilitychange` (tab switch) and `beforeunload` / `pagehide` so trailing clicks are never lost.
   - **Error Isolation**: All listener and transport logic is defensive wrapped in `try/catch` to guarantee zero impact on the host client application.

2. **Backend & Ingestion APIs (Next.js 14 App Router & Node.js)**:
   - **`POST /api/events`**: Batch event ingestion, Zod schema validation, CORS preflight (`OPTIONS`), IP extraction, user agent parsing.
   - **`GET /api/sessions`**: Paginated session listing with total page views, click counts, durations, device/browser metadata, search query filtering.
   - **`GET /api/sessions/:sessionId`**: Chronological event stream reconstructing step-by-step user journeys with relative time deltas.
   - **`GET /api/heatmap?url=...`**: Filtered coordinate retrieval, click density calculation, and top clicked elements leaderboard.
   - **`GET /api/stats`**: High-level KPI metrics (active visitors now, total events, avg duration, device breakdown).
   - **`POST /api/seed`**: UI one-click seed generator for instant reviewer evaluation.

3. **Database Architecture & Resilient Dual-Engine**:
   - **MongoDB + Mongoose**: Full schema with compound indexes:
     - `{ sessionId: 1, timestamp: 1 }` (fast chronological user journey retrieval)
     - `{ url: 1, type: 1, timestamp: -1 }` (instant heatmap aggregation by URL)
     - `{ url: 1, timestamp: -1 }` (time-series pageview analysis)
   - **Zero-Friction In-Memory Fallback Engine**: If a local or remote MongoDB instance is not configured, the app automatically switches to a built-in in-memory engine pre-seeded with realistic user journeys. **Reviewers can clone and run `npm run dev` immediately without setting up a database.**

4. **Analytics Dashboard (`/dashboard`)**:
   - Dark-mode first UI using Tailwind CSS, glassmorphism, and Lucide icons.
   - **View 1: User Journeys**: Searchable sessions table with detailed modal showing step-by-step journey timeline (`Visited /demo -> Clicked #pricing-pro-btn`).
   - **View 2: Visual Heatmaps**:
     - HTML5 Canvas overlay rendering smooth Gaussian heat blobs (blue -> green -> yellow -> red intensity).
     - Pin Hotspots radar mode with interactive hover tooltips displaying element tag, ID, text, and click frequency.
     - Device viewports: Desktop (100%), Tablet (768px), Mobile (390px).
   - **View 3: Live Realtime Stream**: Real-time event feed polling every 2.5s with raw JSON inspector.
   - **View 4: Embedded Snippet Generator**: Copy-paste `<script>` snippet for external websites.

5. **Live Interactive Demo Site (`/demo`)**:
   - "NovaCloud AI" SaaS landing page preloaded with `tracker.js`.
   - Rich interactive targets (buttons, tabs, forms, pricing toggles) to test live click generation.

---

## 🏛️ System Architecture & Data Flow

```
[ Client Page / External Website ]
       │
       ▼
 [ tracker.js ] ── (UUID Session, Click Normalization, Batch Queue)
       │
       ├── navigator.sendBeacon(Blob)
       └── Keep-Alive fetch() fallback
       │
       ▼
 [ POST /api/events ] ── (Zod Validation, CORS Headers)
       │
       ├── MongoDB (Mongoose with Compound Indexes)
       └── In-Memory Store Fallback (Zero-Config Mode)
       │
       ▼
 [ Analytics Dashboard (/dashboard) ]
       ├── User Journey Stepper Modal
       ├── HTML5 Canvas Heatmap Overlay
       └── Real-Time Stream Inspector
```

---

## ⚡ Quick Start & Run Guide

### Prerequisites
- Node.js >= 18 (Tested on v22.17.0)
- npm >= 9

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment (Optional)
A `.env.local` file is already created. If you have MongoDB running locally, uncomment the URI:
```env
# Optional: defaults to built-in in-memory engine if not provided
MONGODB_URI=mongodb://localhost:27017/causalfunnel_analytics
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Start the Development Server
```bash
npm run dev
```

Open your browser:
- **Analytics Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Interactive Demo Site**: [http://localhost:3000/demo](http://localhost:3000/demo)
- **Overview Gateway**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing the Live Tracking Loop

1. Open [http://localhost:3000/demo](http://localhost:3000/demo) in one browser tab.
2. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) in another tab.
3. Click buttons, pricing cards, or tabs on `/demo`.
4. Switch to `/dashboard`:
   - Watch the **Live Stream** show incoming events.
   - Click **User Journeys** to view your session timeline.
   - Switch to **Heatmap Overlay** to see heat blobs forming over the clicked elements.

---

## 🏗️ Architectural Trade-offs & Production Considerations

### 1. Event Batching & Beacon API vs. Fetch
- **Trade-off**: Sending an HTTP request for every click causes network congestion on high-interaction sites.
- **Solution**: We implement an in-memory queue buffer (`batchSize: 5`, `flushInterval: 2500ms`).
- **Beacon API**: For page exits and backgrounding (`visibilitychange`, `beforeunload`), `navigator.sendBeacon` guarantees transmission even after page teardown without blocking the browser thread.

### 2. Responsive Heatmap Coordinate Normalization
- **Challenge**: Users browse on screens ranging from 375px (iPhone) to 2560px (Ultra-wide). Storing absolute pixel coordinates (`clientX`, `clientY`) causes heatmap dots to drift on different screen sizes.
- **Solution**: We normalize coordinates as ratios `x = pageX / docWidth` and `y = pageY / docHeight` (between `0.0000` and `1.0000`). During heatmap rendering on Canvas, the coordinates are multiplied by the container's current width and height: `px = x * canvas.width`.

### 3. Database Indexing Strategy
- Analytical queries require fast time-series aggregation and session grouping.
- **Compound Indexes implemented**:
  - `{ sessionId: 1, timestamp: 1 }`: Enables indexed B-tree scans for session journey reconstruction without in-memory sorting.
  - `{ url: 1, type: 1, timestamp: -1 }`: Queries for heatmap clicks (`type: "click"`, specific URL) execute in sub-millisecond time.

### 4. Cross-Origin Resource Sharing (CORS)
- Since `tracker.js` can be embedded on any external domain (e.g. `client-site.com`), the `/api/events` endpoint includes explicit CORS headers and responds to `OPTIONS` preflight requests with `204 No Content`.

### 5. High-Scale Architecture (Next Steps for 10M+ Events/Day)
- In a production environment with millions of events per hour, direct synchronous database writes should be decoupled:
  - Route `/api/events` to an ingestion gateway running on AWS Lambda or Cloudflare Workers.
  - Publish events directly to an Apache Kafka or AWS Kinesis topic.
  - Consume events via ClickHouse or TimescaleDB for sub-second analytical aggregations.

---

## 📂 Project Directory Structure

```
├── public/
│   └── tracker.js                   # Lightweight autonomous tracking snippet
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout & SEO meta tags
│   │   ├── globals.css              # Dark mode styling & animations
│   │   ├── page.tsx                 # Overview landing page
│   │   ├── demo/
│   │   │   └── page.tsx             # Interactive demo site preloaded with tracker.js
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Analytics Dashboard
│   │   └── api/
│   │       ├── events/route.ts      # POST /api/events (batch ingestion, CORS)
│   │       ├── events/recent/route.ts# GET /api/events/recent (live feed stream)
│   │       ├── sessions/route.ts    # GET /api/sessions (paginated sessions)
│   │       ├── sessions/[sessionId]/route.ts # GET /api/sessions/:id (user journey)
│   │       ├── heatmap/route.ts     # GET /api/heatmap (coordinate analytics)
│   │       ├── stats/route.ts       # GET /api/stats (KPI metrics)
│   │       └── seed/route.ts        # POST /api/seed (UI test session seeder)
│   ├── components/
│   │   ├── Navbar.tsx               # Header with live ingestion indicator
│   │   ├── StatsOverview.tsx        # KPI cards (Sessions, Clicks, Pageviews)
│   │   ├── SessionList.tsx          # Searchable session table
│   │   ├── UserJourneyModal.tsx     # Step-by-step timeline drawer
│   │   ├── HeatmapViewer.tsx        # HTML5 Canvas heatmap + hotspot radar
│   │   ├── RealtimeFeed.tsx         # Live incoming stream + JSON inspector
│   │   ├── SnippetModal.tsx         # Embed script code generator
│   │   └── ui/                      # Button, Card, Badge primitives
│   ├── lib/
│   │   ├── db.ts                    # Mongoose connector + unified data repository
│   │   ├── inMemoryStore.ts         # High-performance zero-config store
│   │   ├── utils.ts                 # Formatting & journey builder helpers
│   │   ├── models/Event.ts          # Mongoose Event schema & indexes
│   │   └── schemas/eventSchema.ts   # Zod validation schema
│   └── types/analytics.ts           # TypeScript interfaces & types
└── package.json
```
