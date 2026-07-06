# Carpenter Vault Bank

A premium, secure Web UI portal designed for administrative lookup, data verification, ledger management, and certificate/insurance archiving for carpenter profiles.

## Technical Architecture & Core Features

### 1. Smart Spreadsheet Data Ingestion (`Smart Ingest`)
* **Flexible Column Auto-mapping**: Maps custom uploaded spreadsheets (CSV or `.xlsx`) to standardized database fields via semantic header string distance checks.
* **Hyperlink Link Extraction**: Scans Excel worksheet cells to automatically parse and extract raw OneDrive hyperlink target URLs (e.g. converting visual values like `CAN_39599502...` directly to their underlying active sharing URLs).
* **Safe Number Format Parsing**: Automatic translation of Excel floating point serial numbers into standardized `DD.MM.YYYY` strings for dates of birth and enrollments.

### 2. Secure Ledger Management
* **Manual Relationship Log**: Built-in Manual entry forms to directly write records to the vault ledger.
* **Smart Duplicates Filtering**: High-performance Disjoint-Set Union (DSU) deduplication forest algorithm that automatically identifies identical carpenter profiles based on name similarity, phone patterns, and emails, allowing clean profile merging with a single click.
* **Credentials Embedding**: Interactive document links for Professional Certificates, Primary Insurance, and Secondary Insurance rendered as active badge icons (`Award`, `Shield`, `ShieldCheck`) that open OneDrive documents or local assets in safe browser tabs.

### 3. Tech Stack
* **Frontend**: React.js, Vite, TailwindCSS, Zustand (State Management), Lucide Icons, Axios.
* **Backend**: Node.js, Express, Multer (multipart handling), `xlsx` (advanced spreadsheet workbook parser).
* **Database**: Prisma ORM, SQLite.

---

## Getting Started

### Prerequisites
* **Node.js**: `v18.x` or later.
* **npm**: `v9.x` or later.

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PabitraMaharana006/Carpenter-Data-Bank.git
   cd Carpenter-Data-Bank
   ```

2. **Install Backend & Client Dependencies**:
   From the repository root:
   ```bash
   npm install
   cd CarFrontend
   npm install
   cd ..
   ```

3. **Configure Database Schema**:
   Generate the Prisma client and push the schema definitions to SQLite:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Launch Application Servers**:
   Run both frontend and backend development instances:
   ```bash
   # Start backend API server (listens on port 5000)
   npm run dev:server

   # Start frontend Vite server (runs on port 3000)
   npm run dev:client
   ```

### Default Credentials
* Secure Email: `ekalakaartech@gmail.com`
* Passcode: `eK_admin@2025`
* *Note: Public self-registration is fully disabled on the login screen and blocked on API endpoints for security.*
