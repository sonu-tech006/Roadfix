# RoadFix — Road Damage Reporting & Repair Accountability Platform

RoadFix is a civic infrastructure accountability application engineered to bridge citizens and public road maintenance authorities. It empowers citizens to report potholes, damaged asphalt surfaces, fractured road dividers, and broken stormwater covers with geotagged photographic evidence. Concurrently, it equips three levels of administration (Panchayat/Local Ward, District Magistrate, and State Public Works Department) to coordinate inspections, assign maintenance contractors, upload before/after completion proof, and verify repairs before closing complaints.

---

## 1. Key Features

### Citizen Portal & Public Experience
- **10 Core Road Infrastructure Damage Categories**: Pothole, Broken surface, Road subsidence, Waterlogging, Damaged footpath, Broken manhole cover, Road divider damage, Missing road signs, Unsafe obstruction, and Other road defects.
- **Genuine Photograph Uploads**: Multi-photo uploads supporting camera capture and desktop selection with image previews, type and size validation, and preservation of timestamps and metadata.
- **Geospatial & GPS Pin Placement**: Automatic browser Geolocation with manual pin drag fallback on OpenStreetMap / Leaflet.
- **Geospatial Duplicate Detection**: Scans nearby active complaints within a 600m radius using Haversine coordinates and category matching to prevent duplicate work orders while empowering citizens to follow existing tickets.
- **Public Accountability Tracker**: Public tracking by unique reference (e.g. `RF-2026-8941`) with privacy safeguards (citizen contact details redacted).
- **Interactive 3D Digital Road Twin**: Built with Three.js, visualizes asphalt layer cross-section, sub-base compaction, crater void analysis, and LiDAR scan grid overlay.

### Three Administrative Tiers
1. **Panchayat / Local-Level Admin (Ward 14)**:
   - Scoped strictly to assigned village/ward jurisdiction.
   - Field inspection logging and contractor dispatch.
   - **Section 8 Workflow**: "Mark repair work as completed" checkbox revealing required completion description, team name, completion date, and post-repair photographic proof.
2. **District-Level Admin (Bengaluru Urban District)**:
   - District-wide oversight across authorized subordinate wards.
   - High-priority, overdue, and escalated ticket triage.
   - **Resolution Verification Queue**: Side-by-side inspection of before and after photographs with "Approve" (marks Resolved) or "Return" (rework needed) decisions.
   - CSV export of authorized records and performance charts.
3. **State-Level Admin (State PWD Chief)**:
   - Statewide aggregate analytics across all 31 districts.
   - Recurring damage hotspot detection (identifying structural sub-base failures).
   - SLA compliance monitoring and delegation of jurisdictional authorities.
   - Immutable audit log reviewing.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express 4, TypeScript via `tsx` runner.
- **Database & Schemas**: Mongoose with MongoDB Atlas schemas, 2dsphere indexes, and resilient in-memory fallback.
- **Authentication**: JWT, bcryptjs password hashing, role-based middleware.
- **3D Graphics & GIS**: Three.js WebGL digital twin, Leaflet with OpenStreetMap tiles.
- **Analytics**: Recharts data visualization.
- **Image Storage**: Multipart uploads with Cloudinary integration and local disk persistence.

---

## 3. Environment Variables (.env)

| Variable | Description |
|---|---|
| `PORT` | Server listening port (default: 3000) |
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Secret key for signing session tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud name (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret (optional) |

---

## 4. Test Demo Credentials

RoadFix includes a one-click **Persona Switcher** in the top navigation bar to test all user roles instantly without manual credential entry:

- **Citizen**: `priya.citizen@roadfix.org` / `RoadFix@2026`
- **Panchayat / Ward Admin**: `ramesh.localadmin@roadfix.org` / `RoadFix@2026` (Ward 14)
- **District Admin**: `sunita.districtadmin@roadfix.org` / `RoadFix@2026` (Bengaluru Urban)
- **State Admin**: `ananth.stateadmin@roadfix.org` / `RoadFix@2026` (State PWD)
