# ARENIUM 27 CORE • Tech Festival Operations & Attendance Engine

> A high-performance full-stack Client-Admin-Server management system built for **ARENIUM 27**, powering QR-based team verification, volunteer hourly attendance marking, multi-tiered OD approvals, and daily Excel report generation.

---

## 🎨 Official Color Palette
The interface is strictly styled using the specified palette:
- **`#30AFFF`** • Electric Primary Blue (Action buttons, brand marks, active highlights)
- **`#92EEFF`** • Bright Sky Cyan (Sub-headings, badge borders, QR accents)
- **`#D8FFC5`** • Soft Mint Green (Approval alerts, success badges, table accents)
- **`#C4F7CA`** • Pastel Emerald (Volunteer badges, verified team marks, confirmations)
- **`#FBFBFB`** • Clean Off-White (Canvas background and crisp elevated card surfaces)

---

## 👥 Roles & Pre-configured Credentials

### 1. 🛡️ ADMIN SUPERVISOR
Supervises all operations, approves volunteer registrations, handles the **Requests Portal** (divided into 3 sections: Core Team, Volunteers, Participants), and exports daily Excel spreadsheets.

| Email | Password | Name | Designation |
| :--- | :--- | :--- | :--- |
| `kerenlois@presidencyuniversity.in` | `Kerensois27` | Prof. Keren Lois | Faculty Coordinator & Admin |
| `Kathuriaabhyas0@gmail.com` | `Abhyas2108` | Abhyas Kathuria | Lead Administrator |

### 2. 🎖️ CORE TEAM
Adds volunteers (sent to Admin for approval), and applies for Hourly On-Duty (OD) leaves (Hour 1 to 8) with academic details and responsibilities.

| Email | Password | Name | Academic Roll No |
| :--- | :--- | :--- | :--- |
| `singhkaushal.2507@gmail.com` | `Kaush2507` | Kaushal Singh | `20211CSE0112` |
| `Kathuriaabhyas@gmail.com` | `Abhyas2108` | Abhyas Kathuria | `20211CSE0145` |
| `ashlinsiddharth1@gmail.com` | `Ashlin01` | Ashlin Siddharth | `20211CSE0089` |
| `vimalrajsnkk@gmail.com` | `Vimal69` | Vimal Raj | `20211CSE0204` |

### 3. 🤝 VOLUNTEERS
Once approved by Admin, volunteers can sign in with their email and password.
- **Team QR Verification Scanner**: Scans team QR passes to verify full team presence.
- **Participant Attendance Scanner**: Scans individual participant QR badges to allot hourly basis attendance (Hour 1 to 8) and dispatch to Admin for final approval.

| Email | Password | Name | Status |
| :--- | :--- | :--- | :--- |
| `volunteer1@arenium.com` | `Vol123` | Rohan Verma | Approved (Ready for Duty) |
| `ananya.vol@arenium.com` | `Vol123` | Ananya Sharma | Pending Admin Approval |

*(Core Team can add new volunteers dynamically; Admin approves them in the Requests Portal).*

### 4. 🚀 PARTICIPANTS
Participants log in simply using their **Team Name** (e.g. `CyberKnights`, `QuantumForge`, or any new team name).
- **Pass 1: Team Validation QR**: High-contrast QR presented to volunteers at the arena gate to verify team registration.
- **Pass 2: Member Self-Entry QR**: Individual member badge QR scanned by volunteers to allot hourly attendance.
- **Hourly OD Application**: Apply for OD on a date and hour basis (Hours 1–8).

---

## 🔄 End-to-End Operational Workflow

```
[ PARTICIPANTS ]
      │
      ├─► Displays Team Validation QR ──► [ VOLUNTEERS ]
      │                                         │
      │                                         ├─► Scans Team QR (Verifies Team Presence)
      ├─► Displays Self-Entry QR ───────►       │
      │                                         └─► Scans Participant QR & Allots
      │                                             Hourly Attendance (Hour 1 to 8)
      │                                                      │
      ├─► Directly applies for OD                            ▼
      │                                              [ Dispatched to Admin ]
      ▼                                                      │
[ CORE TEAM ]                                                ▼
      │                                              ┌───────────────────────────────┐
      ├─► Adds Volunteers ──────────────────────────►│      ADMIN REQUESTS PORTAL    │
      │                                              │ 1. CORE TEAM (OD Leaves)      │
      └─► Applies for Hourly OD (Hours 1-8) ────────►│ 2. VOLUNTEERS (Accounts & Att)│
                                                     │ 3. PARTICIPANTS (OD Requests) │
                                                     └───────────────┬───────────────┘
                                                                     │
                                                       [ Approve / Reject ]
                                                                     │
                                                                     ▼
                                                     ┌───────────────────────────────┐
                                                     │    DAILY EXCEL EXPORT (.xlsx) │
                                                     │   sno, name, roll number,     │
                                                     │   section, batch number,      │
                                                     │   hours, school name, hod name│
                                                     └───────────────────────────────┘
```

---

## 📊 Excel Sheet Specification
The daily Excel generator matches the exact required columns:
1. `sno`
2. `name`
3. `roll number`
4. `section`
5. `batch number`
6. `hours` (e.g. `Hour 1, Hour 2, Hour 3, Hour 4`)
7. `school name`
8. `hod name`

---

## 🚀 How to Run the Project

### One-Command Fullstack Start:
In the project root directory (`ARENIUM 27 CORE`):
```bash
npm run dev
```
This concurrently starts:
- **Backend API Server**: `http://localhost:5000`
- **Frontend Client Application**: `http://localhost:5173`

### Individual Running:
- Backend:
  ```bash
  cd server
  npm start
  ```
- Frontend:
  ```bash
  cd client
  npm run dev
  ```

---

## 📱 Optical QR Scanning & Camera Fallbacks
The system includes an optical camera scanner powered by `html5-qrcode`. For development, testing, or desktop computers without webcams, each scanner also features an **Instant 1-Click Mock Preset** and a manual roll number/JSON input bar so you can test team validation and participant attendance in one click!
"# ARENIUM-27-CORE" 
