import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import csvParser from 'csv-parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');
import {
  cleanName,
  normalizePhoneNumber,
  selectBestName,
  isSamePerson,
  validateRow
} from './utils/validator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'carpenter_vault_luxury_secret_key';

app.use(cors());
app.use(express.json());

// // Setup static uploads folder
// const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// // Configure Multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage: storage });

// Temporary upload preview parser storage
const tempUpload = multer({ dest: path.join(__dirname, '..', 'uploads', 'temp') });

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = user;
    next();
  });
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  return res.status(403).json({ error: 'Public registration is disabled.' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Seed default admin account if table is empty
    if (!user && email === 'ekalakaartech@gmail.com' && password === 'eK_admin@2025') {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Super Admin',
          role: 'ADMIN'
        }
      });
    }

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        details: `Logged in successfully`
      }
    });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// Ledger Records CRUD API
// ----------------------------------------------------
app.get('/api/records', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const { search, state, category, sortCol, sortDir } = req.query;

    const where = { isDeleted: false };

    if (state) {
      where.state = state;
    }
    if (category) {
      where.category = category;
    }

    if (search) {
      const searchTerms = String(search).trim();
      where.OR = [
        { nameOfCarpenter: { contains: searchTerms } },
        { nameOfOrganization: { contains: searchTerms } },
        { specialization: { contains: searchTerms } },
        { communication: { contains: searchTerms } },
        { districtCity: { contains: searchTerms } },
        { address: { contains: searchTerms } },
        { remarks: { contains: searchTerms } }
      ];
    }

    const orderBy = {};
    if (sortCol) {
      orderBy[sortCol] = sortDir === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.srNo = 'asc';
    }

    const [records, total] = await prisma.$transaction([
      prisma.record.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.record.count({ where })
    ]);

    // Fetch aggregates
    const stateCounts = await prisma.record.groupBy({
      by: ['state'],
      where: { isDeleted: false },
      _count: { id: true }
    });

    const categoryCounts = await prisma.record.groupBy({
      by: ['category'],
      where: { isDeleted: false },
      _count: { id: true }
    });

    res.json({
      records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      aggregates: {
        states: stateCounts.map(s => ({ state: s.state || 'Unknown', count: s._count.id })),
        categories: categoryCounts.map(c => ({ category: c.category || 'Other', count: c._count.id }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/records', authenticateToken, async (req, res) => {
  try {
    const rawData = req.body;
    const validated = validateRow(rawData);

    // Calculate sequential re-indexing srNo
    const maxRecord = await prisma.record.findFirst({
      where: { isDeleted: false },
      orderBy: { srNo: 'desc' }
    });
    const nextSrNo = maxRecord ? (maxRecord.srNo || 0) + 1 : 1;

    const record = await prisma.record.create({
      data: {
        srNo: nextSrNo,
        category: validated.category || 'Other',
        nameOfCarpenter: validated.nameOfCarpenter || '',
        nameOfOrganization: validated.nameOfOrganization || '',
        specialization: validated.specialization || '',
        communication: validated.communication || '',
        state: validated.state || '',
        districtCity: validated.districtCity || '',
        address: validated.address || '',
        certificateLink: validated.certificateLink || '',
        insuranceLink1: validated.insuranceLink1 || '',
        insuranceLink2: validated.insuranceLink2 || '',
        customColumn: validated.customColumn || '',
        remarks: validated.remarks || '',
        enrollmentNumber: validated.enrollmentNumber || rawData.enrollmentNumber || '',
        enrollmentDate: validated.enrollmentDate || rawData.enrollmentDate || '',
        subdivision: validated.subdivision || rawData.subdivision || '',
        firstName: validated.firstName || rawData.firstName || '',
        middleName: validated.middleName || rawData.middleName || '',
        lastName: validated.lastName || rawData.lastName || '',
        fullName: validated.fullName || rawData.fullName || '',
        enrollmentNumRegister: validated.enrollmentNumRegister || rawData.enrollmentNumRegister || '',
        enrollmentYear: validated.enrollmentYear || rawData.enrollmentYear || '',
        enrollmentMonth: validated.enrollmentMonth || rawData.enrollmentMonth || '',
        reasonFor: validated.reasonFor || rawData.reasonFor || '',
        reasonForEdit: validated.reasonForEdit || rawData.reasonForEdit || '',
        carpenterId: validated.carpenterId || rawData.carpenterId || '',
        motherName: validated.motherName || rawData.motherName || '',
        fatherName: validated.fatherName || rawData.fatherName || '',
        husbandName: validated.husbandName || rawData.husbandName || '',
        religion: validated.religion || rawData.religion || '',
        workability: validated.workability || rawData.workability || '',
        physicalDisability: validated.physicalDisability || rawData.physicalDisability || '',
        officer: validated.officer || rawData.officer || '',
        officeName: validated.officeName || rawData.officeName || '',
        salutation: rawData.salutation || '',
        certificateNumber: rawData.certificateNumber || '',
        candidateNumber: rawData.candidateNumber ? String(rawData.candidateNumber) : '',
        dateOfBirth: rawData.dateOfBirth ? String(rawData.dateOfBirth) : '',
        occupationProfession: rawData.occupationProfession || '',
        maritalStatus: rawData.maritalStatus || '',
        guardiansName: rawData.guardiansName || '',
        disability: rawData.disability || '',
        typeofDisability: rawData.typeofDisability || '',
        pinCode: rawData.pinCode ? String(rawData.pinCode) : '',
        idType: rawData.idType || '',
        typeofAlternateID: rawData.typeofAlternateID || '',
        idNo: rawData.idNo ? String(rawData.idNo) : '',
        educationLevel: rawData.educationLevel || '',
        preTrainingStatus: rawData.preTrainingStatus || '',
        previousExperienceSector: rawData.previousExperienceSector || '',
        noofmonthsofpreviousexperience: rawData.noofmonthsofpreviousexperience ? String(rawData.noofmonthsofpreviousexperience) : '',
        employed: rawData.employed || '',
        employmentStatus: rawData.employmentStatus || '',
        employmentDetails: rawData.employmentDetails || '',
        heardAboutUs: rawData.heardAboutUs || '',
        nomineeName: rawData.nomineeName || '',
        nomineeGender: rawData.nomineeGender || '',
        nomineeDOB: rawData.nomineeDOB ? String(rawData.nomineeDOB) : '',
        nomineeRelationship: rawData.nomineeRelationship || '',
        emptyColumn: rawData.emptyColumn || ''
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'CREATE_RECORD',
        details: `Created record Sr No: ${nextSrNo} (${record.nameOfCarpenter})`
      }
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rawData = req.body;
    const validated = validateRow(rawData);

    const record = await prisma.record.update({
      where: { id },
      data: {
        category: validated.category,
        nameOfCarpenter: validated.nameOfCarpenter,
        nameOfOrganization: validated.nameOfOrganization,
        specialization: validated.specialization,
        communication: validated.communication,
        state: validated.state,
        districtCity: validated.districtCity,
        address: validated.address,
        certificateLink: validated.certificateLink,
        insuranceLink1: validated.insuranceLink1,
        insuranceLink2: validated.insuranceLink2,
        customColumn: validated.customColumn,
        remarks: validated.remarks,
        enrollmentNumber: validated.enrollmentNumber || rawData.enrollmentNumber || '',
        enrollmentDate: validated.enrollmentDate || rawData.enrollmentDate || '',
        subdivision: validated.subdivision || rawData.subdivision || '',
        firstName: validated.firstName || rawData.firstName || '',
        middleName: validated.middleName || rawData.middleName || '',
        lastName: validated.lastName || rawData.lastName || '',
        fullName: validated.fullName || rawData.fullName || '',
        enrollmentNumRegister: validated.enrollmentNumRegister || rawData.enrollmentNumRegister || '',
        enrollmentYear: validated.enrollmentYear || rawData.enrollmentYear || '',
        enrollmentMonth: validated.enrollmentMonth || rawData.enrollmentMonth || '',
        reasonFor: validated.reasonFor || rawData.reasonFor || '',
        reasonForEdit: validated.reasonForEdit || rawData.reasonForEdit || '',
        carpenterId: validated.carpenterId || rawData.carpenterId || '',
        motherName: validated.motherName || rawData.motherName || '',
        fatherName: validated.fatherName || rawData.fatherName || '',
        husbandName: validated.husbandName || rawData.husbandName || '',
        religion: validated.religion || rawData.religion || '',
        workability: validated.workability || rawData.workability || '',
        physicalDisability: validated.physicalDisability || rawData.physicalDisability || '',
        officer: validated.officer || rawData.officer || '',
        officeName: validated.officeName || rawData.officeName || '',
        salutation: rawData.salutation || '',
        certificateNumber: rawData.certificateNumber || '',
        candidateNumber: rawData.candidateNumber ? String(rawData.candidateNumber) : '',
        dateOfBirth: rawData.dateOfBirth ? String(rawData.dateOfBirth) : '',
        occupationProfession: rawData.occupationProfession || '',
        maritalStatus: rawData.maritalStatus || '',
        guardiansName: rawData.guardiansName || '',
        disability: rawData.disability || '',
        typeofDisability: rawData.typeofDisability || '',
        pinCode: rawData.pinCode ? String(rawData.pinCode) : '',
        idType: rawData.idType || '',
        typeofAlternateID: rawData.typeofAlternateID || '',
        idNo: rawData.idNo ? String(rawData.idNo) : '',
        educationLevel: rawData.educationLevel || '',
        preTrainingStatus: rawData.preTrainingStatus || '',
        previousExperienceSector: rawData.previousExperienceSector || '',
        noofmonthsofpreviousexperience: rawData.noofmonthsofpreviousexperience ? String(rawData.noofmonthsofpreviousexperience) : '',
        employed: rawData.employed || '',
        employmentStatus: rawData.employmentStatus || '',
        employmentDetails: rawData.employmentDetails || '',
        heardAboutUs: rawData.heardAboutUs || '',
        nomineeName: rawData.nomineeName || '',
        nomineeGender: rawData.nomineeGender || '',
        nomineeDOB: rawData.nomineeDOB ? String(rawData.nomineeDOB) : '',
        nomineeRelationship: rawData.nomineeRelationship || '',
        emptyColumn: rawData.emptyColumn || ''
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'UPDATE_RECORD',
        details: `Updated record ID: ${id} (${record.nameOfCarpenter})`
      }
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.record.update({
      where: { id },
      data: { isDeleted: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'DELETE_RECORD',
        details: `Soft deleted record ID: ${id} (${record.nameOfCarpenter})`
      }
    });

    // Re-index sequentially from 1 to N
    await reindexRecords();

    res.json({ message: 'Record deleted and vault re-indexed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/records/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Missing or invalid list IDs' });
    }

    await prisma.record.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'BULK_DELETE',
        details: `Bulk deleted ${ids.length} records`
      }
    });

    await reindexRecords();

    res.json({ message: `Successfully deleted ${ids.length} records` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Re-index remaining active records sequentially
async function reindexRecords() {
  const activeRecords = await prisma.record.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' }
  });

  for (let i = 0; i < activeRecords.length; i++) {
    await prisma.record.update({
      where: { id: activeRecords[i].id },
      data: { srNo: i + 1 }
    });
  }
}

// ----------------------------------------------------
// DSU Deduplication Engine (O(N) Disjoint-Set Forest)
// ----------------------------------------------------
app.post('/api/records/deduplicate', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.record.findMany({
      where: { isDeleted: false },
      orderBy: { srNo: 'asc' } // Preserve historical ordering
    });

    const n = records.length;
    const parent = Array.from({ length: n }, (_, i) => i);

    function find(i) {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]); // Path compression
      return parent[i];
    }

    function union(i, j) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        // Direct j parent linkage
        parent[rootJ] = rootI;
      }
    }

    // High performance lookup index maps for O(1) matching checks
    const phoneMap = new Map();
    const emailMap = new Map();

    const parseCommTokens = (comm) => {
      if (!comm) return { phones: [], emails: [] };
      const phones = [];
      const emails = [];
      const parts = comm.split(/[\s,]+/);
      for (let p of parts) {
        if (p.includes('@')) {
          emails.push(p.toLowerCase().trim());
        } else {
          const digits = p.replace(/\D/g, '');
          if (digits.length === 10) {
            phones.push(digits);
          }
        }
      }
      return { phones, emails };
    };

    // Construct indexes and union matching nodes
    for (let i = 0; i < n; i++) {
      const rec = records[i];
      const nameKey = cleanName(rec.nameOfCarpenter).toLowerCase();
      const comm = parseCommTokens(rec.communication);

      // Check phone matches
      for (let p of comm.phones) {
        if (phoneMap.has(p)) {
          union(phoneMap.get(p), i);
        } else {
          phoneMap.set(p, i);
        }
      }

      // Check email matches
      for (let e of comm.emails) {
        if (emailMap.has(e)) {
          union(emailMap.get(e), i);
        } else {
          emailMap.set(e, i);
        }
      }

      // Check name compatible matching targets
      if (nameKey) {
        for (let j = 0; j < i; j++) {
          if (find(i) === find(j)) continue; // Already grouped
          const otherRec = records[j];
          const otherNameKey = cleanName(otherRec.nameOfCarpenter).toLowerCase();
          
          if (nameKey === otherNameKey) {
            // Check compatibility (no conflicting phone or email)
            const otherComm = parseCommTokens(otherRec.communication);
            const hasPhoneConflict = comm.phones.some(p => otherComm.phones.length > 0 && !otherComm.phones.includes(p));
            const hasEmailConflict = comm.emails.some(e => otherComm.emails.length > 0 && !otherComm.emails.includes(e));
            
            if (!hasPhoneConflict && !hasEmailConflict) {
              union(j, i);
            }
          }
        }
      }
    }

    // Group items by root
    const groups = new Map();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root).push(records[i]);
    }

    let mergedCount = 0;
    const ops = [];

    // Process merges in database transactions
    for (let [rootIdx, group] of groups.entries()) {
      if (group.length <= 1) continue;

      // Group sorted by age (oldest srNo starts target index)
      group.sort((a, b) => (a.srNo || 999999) - (b.srNo || 999999));
      const target = group[0];
      const duplicates = group.slice(1);

      // Aggregate fields into the oldest target record
      const categories = new Set(group.map(g => g.category).filter(Boolean));
      const organizations = new Set(group.map(g => g.nameOfOrganization).filter(Boolean));
      const specializations = new Set(group.map(g => g.specialization).filter(Boolean));
      const remarksList = new Set(group.map(g => g.remarks).filter(Boolean));
      const customCols = new Set(group.map(g => g.customColumn).filter(Boolean));

      // Reconstruct combined communication entries
      const allPhones = new Set();
      const allEmails = new Set();
      group.forEach(g => {
        const comm = parseCommTokens(g.communication);
        comm.phones.forEach(p => allPhones.add(p));
        comm.emails.forEach(e => allEmails.add(e));
      });

      const combinedComm = [
        ...[...allPhones].map(p => normalizePhoneNumber(p)),
        ...allEmails
      ].join(', ');

      // Pick longest available document assets
      const certificate = group.map(g => g.certificateLink).find(Boolean) || '';
      const ins1 = group.map(g => g.insuranceLink1).find(Boolean) || '';
      const ins2 = group.map(g => g.insuranceLink2).find(Boolean) || '';

      const updatedCategory = categories.has('Master Carpenter') ? 'Master Carpenter' : [...categories][0] || 'Other';
      const updatedOrg = [...organizations].join(' / ');
      const updatedSpec = [...specializations].join(', ');
      const updatedRemarks = [...remarksList].join(' | ');
      const updatedCustom = [...customCols].join(' | ');

      // Target update promise transaction operations
      ops.push(
        prisma.record.update({
          where: { id: target.id },
          data: {
            category: updatedCategory,
            nameOfOrganization: updatedOrg,
            specialization: updatedSpec,
            communication: combinedComm,
            certificateLink: certificate,
            insuranceLink1: ins1,
            insuranceLink2: ins2,
            customColumn: updatedCustom,
            remarks: updatedRemarks
          }
        })
      );

      // Soft delete remaining duplicates
      const dupIds = duplicates.map(d => d.id);
      ops.push(
        prisma.record.updateMany({
          where: { id: { in: dupIds } },
          data: { isDeleted: true }
        })
      );

      mergedCount += duplicates.length;
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops);
    }

    // Sequence re-indexing
    await reindexRecords();

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'DEDUPLICATE',
        details: `Deduplication complete. Merged ${mergedCount} duplicates.`
      }
    });

    res.json({ message: 'Deduplication completed successfully', mergedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// File Upload & Data Ingestion Pipeline
// ----------------------------------------------------
app.post('/api/upload/preview', authenticateToken, tempUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const isExcel = req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls');
    const previewRows = [];
    let headers = [];
    let totalRows = 0;

    if (isExcel) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Scan worksheet for hyperlink targets and insert them directly into values
      function parseExcelDate(serial) {
        const num = Number(serial);
        if (isNaN(num) || num <= 0) return String(serial);
        const utc_days = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const day = String(date_info.getDate()).padStart(2, '0');
        const month = String(date_info.getMonth() + 1).padStart(2, '0');
        const year = date_info.getFullYear();
        return `${day}.${month}.${year}`;
      }

      for (let cellRef in sheet) {
        if (cellRef[0] === '!') continue;
        const cell = sheet[cellRef];
        if (!cell) continue;
        if (cell.l && cell.l.Target) {
          cell.v = cell.l.Target; // Use the actual target link
        } else if (cell.t === 'n' && (cell.v > 10000 && cell.v < 60000) && (cellRef.startsWith('M') || cellRef.startsWith('BC') || cellRef.startsWith('B') || cellRef.startsWith('BD') || cellRef.startsWith('BE') || cellRef.startsWith('BF'))) {
          cell.v = parseExcelDate(cell.v);
          cell.t = 's';
        }
      }

      const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
      if (json.length > 0) {
        headers = Object.keys(json[0]);
        // Filter out empty rows (where all values are blank/whitespace)
        const filtered = json.filter(row => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== ''));
        totalRows = filtered.length;
        previewRows.push(...filtered.slice(0, 5));
      }
    } else {
      // Parse CSV File Preview
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('headers', (h) => {
            headers = h;
          })
          .on('data', (data) => {
            // Filter empty rows for CSV too
            const hasData = Object.values(data).some(v => v !== null && v !== undefined && String(v).trim() !== '');
            if (hasData) {
              totalRows++;
              if (previewRows.length < 5) {
                previewRows.push(data);
              }
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // Keep temporary file path reference returned to frontend store mapping confirmation
    res.json({
      filePath: req.file.filename,
      fileName: req.file.originalname,
      headers,
      previewRows,
      totalRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/import', authenticateToken, async (req, res) => {
  try {
    const { filePath, mapping, fileName } = req.body;
    if (!filePath || !mapping) return res.status(400).json({ error: 'Missing import configurations' });

    const tempPath = path.join(__dirname, '..', 'uploads', 'temp', filePath);
    if (!fs.existsSync(tempPath)) {
      return res.status(404).json({ error: 'Temp data upload session expired or not found' });
    }

    const checkName = fileName || filePath || '';
    const isExcel = checkName.endsWith('.xlsx') || checkName.endsWith('.xls');
    let parsedRows = [];

    if (isExcel) {
      const workbook = xlsx.readFile(tempPath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Scan worksheet for hyperlink targets and insert them directly into values
      function parseExcelDate(serial) {
        const num = Number(serial);
        if (isNaN(num) || num <= 0) return String(serial);
        const utc_days = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const day = String(date_info.getDate()).padStart(2, '0');
        const month = String(date_info.getMonth() + 1).padStart(2, '0');
        const year = date_info.getFullYear();
        return `${day}.${month}.${year}`;
      }

      for (let cellRef in sheet) {
        if (cellRef[0] === '!') continue;
        const cell = sheet[cellRef];
        if (!cell) continue;
        if (cell.l && cell.l.Target) {
          cell.v = cell.l.Target; // Use the actual target link
        } else if (cell.t === 'n' && (cell.v > 10000 && cell.v < 60000) && (cellRef.startsWith('M') || cellRef.startsWith('BC') || cellRef.startsWith('B') || cellRef.startsWith('BD') || cellRef.startsWith('BE') || cellRef.startsWith('BE') || cellRef.startsWith('BF'))) {
          cell.v = parseExcelDate(cell.v);
          cell.t = 's';
        }
      }

      const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
      // Filter out empty rows where all values are blank
      parsedRows = rawRows.filter(row => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== ''));
    } else {
      await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(tempPath)
          .pipe(csvParser())
          .on('data', (data) => rows.push(data))
          .on('end', () => {
            parsedRows = rows;
            resolve();
          })
          .on('error', reject);
      });
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const diagnostics = [];

    // Preload active database cache names and communication map list structures
    const existingRecords = await prisma.record.findMany({ where: { isDeleted: false } });
    const maxRecord = await prisma.record.findFirst({
      where: { isDeleted: false },
      orderBy: { srNo: 'desc' }
    });
    let currentMaxSr = maxRecord ? (maxRecord.srNo || 0) : 0;

    const importOps = [];

    for (let index = 0; index < parsedRows.length; index++) {
      const row = parsedRows[index];
      
      try {
        let nameOfCarpenter = row[mapping.fullName] || row[mapping.nameOfCarpenter] || "";
        if (!nameOfCarpenter) {
          const parts = [];
          if (mapping.firstName && row[mapping.firstName]) parts.push(row[mapping.firstName]);
          if (mapping.middleName && row[mapping.middleName]) parts.push(row[mapping.middleName]);
          if (mapping.lastName && row[mapping.lastName]) parts.push(row[mapping.lastName]);
          nameOfCarpenter = parts.join(' ').trim();
        }
        nameOfCarpenter = nameOfCarpenter.trim();

        let nomineeName = row[mapping.nomineeName] || "";
        if (!nomineeName) {
          const nomineeParts = [];
          if (mapping.nomineeFirstName && row[mapping.nomineeFirstName]) nomineeParts.push(row[mapping.nomineeFirstName]);
          if (mapping.nomineeMiddleName && row[mapping.nomineeMiddleName]) nomineeParts.push(row[mapping.nomineeMiddleName]);
          if (mapping.nomineeLastName && row[mapping.nomineeLastName]) nomineeParts.push(row[mapping.nomineeLastName]);
          nomineeName = nomineeParts.join(' ').trim();
        }

        const nameOfOrganization = String(row[mapping.nameOfOrganization] || "").trim();
        const specialization = String(row[mapping.specialization] || "").trim();
        const remarks = String(row[mapping.remarks] || "").trim();
        const customColumn = String(row[mapping.customColumn] || "").trim();

        // Smart State resolution: try multiple state columns, pick first non-empty
        const stateVal = row[mapping.state] || "";
        let resolvedState = stateVal;
        if (!resolvedState) {
          const stateCandidates = ['DomicileState', 'PermanentAddressState', 'CommunicationAddressState'];
          for (const sc of stateCandidates) {
            if (row[sc] && String(row[sc]).trim()) { resolvedState = String(row[sc]).trim(); break; }
          }
        }

        // Smart District/City resolution: try multiple columns, pick first non-empty
        const distVal = row[mapping.districtCity] || "";
        let resolvedDistrict = distVal;
        if (!resolvedDistrict) {
          const distCandidates = ['PermanentAddressDistrict', 'PermanentAddressCity', 'CommunicationAddressDistrict', 'CommunicationAddressCity'];
          for (const dc of distCandidates) {
            if (row[dc] && String(row[dc]).trim()) { resolvedDistrict = String(row[dc]).trim(); break; }
          }
        }

        // Smart Address consolidation: merge multiple address columns
        const addressCols = ['PermanentAddressAddress', 'PermanentAddressPINCode', 'PermanentAddressTehsil', 'PermanentAddressConstituency'];
        const addressParts = [];
        if (mapping.address && row[mapping.address]) {
          addressParts.push(String(row[mapping.address]).trim());
        }
        // Also pull from known address columns directly
        for (const ac of addressCols) {
          if (row[ac] && String(row[ac]).trim() && !addressParts.includes(String(row[ac]).trim())) {
            addressParts.push(String(row[ac]).trim());
          }
        }
        const address = addressParts.join(', ');
        
        // Multi-column mapping consolidation for communications
        const commParts = [];
        if (mapping.communication && Array.isArray(mapping.communication)) {
          mapping.communication.forEach(col => {
            if (row[col]) commParts.push(String(row[col]).trim());
          });
        } else if (mapping.communication && row[mapping.communication]) {
          commParts.push(String(row[mapping.communication]).trim());
        }
        // Also directly check MobileNo and EmailID columns
        if (row['MobileNo'] && !commParts.includes(String(row['MobileNo']).trim())) commParts.push(String(row['MobileNo']).trim());
        if (row['EmailID'] && !commParts.includes(String(row['EmailID']).trim())) commParts.push(String(row['EmailID']).trim());
        
        const communicationStr = commParts.join(', ');

        const rawRecord = {
          nameOfCarpenter,
          nameOfOrganization,
          specialization,
          communication: communicationStr,
          state: resolvedState,
          districtCity: resolvedDistrict,
          address,
          certificateLink: String(row[mapping.certificateLink] || ""),
          insuranceLink1: String(row[mapping.insuranceLink1] || ""),
          insuranceLink2: String(row[mapping.insuranceLink2] || ""),
          customColumn,
          remarks,
          enrollmentNumber: String(row[mapping.enrollmentNumber] || ""),
          enrollmentDate: String(row[mapping.enrollmentDate] || ""),
          subdivision: String(row[mapping.subdivision] || ""),
          firstName: String(row[mapping.firstName] || ""),
          middleName: String(row[mapping.middleName] || ""),
          lastName: String(row[mapping.lastName] || ""),
          fullName: nameOfCarpenter,
          enrollmentNumRegister: String(row[mapping.enrollmentNumRegister] || ""),
          enrollmentYear: String(row[mapping.enrollmentYear] || ""),
          enrollmentMonth: String(row[mapping.enrollmentMonth] || ""),
          reasonFor: String(row[mapping.reasonFor] || ""),
          reasonForEdit: String(row[mapping.reasonForEdit] || ""),
          carpenterId: String(row[mapping.carpenterId] || ""),
          motherName: String(row[mapping.motherName] || ""),
          fatherName: String(row[mapping.fatherName] || ""),
          husbandName: String(row[mapping.husbandName] || ""),
          religion: String(row[mapping.religion] || ""),
          workability: String(row[mapping.workability] || ""),
          physicalDisability: String(row[mapping.physicalDisability] || ""),
          officer: String(row[mapping.officer] || ""),
          officeName: String(row[mapping.officeName] || ""),
          salutation: String(row[mapping.salutation] || ""),
          certificateNumber: String(row[mapping.certificateNumber] || ""),
          candidateNumber: String(row[mapping.candidateNumber] || ""),
          dateOfBirth: String(row[mapping.dateOfBirth] || ""),
          occupationProfession: String(row[mapping.occupationProfession] || ""),
          maritalStatus: String(row[mapping.maritalStatus] || ""),
          guardiansName: String(row[mapping.guardiansName] || ""),
          disability: String(row[mapping.disability] || ""),
          typeofDisability: String(row[mapping.typeofDisability] || ""),
          pinCode: String(row[mapping.pinCode] || ""),
          idType: String(row[mapping.idType] || ""),
          typeofAlternateID: String(row[mapping.typeofAlternateID] || ""),
          idNo: String(row[mapping.idNo] || ""),
          educationLevel: String(row[mapping.educationLevel] || ""),
          preTrainingStatus: String(row[mapping.preTrainingStatus] || ""),
          previousExperienceSector: String(row[mapping.previousExperienceSector] || ""),
          noofmonthsofpreviousexperience: String(row[mapping.noofmonthsofpreviousexperience] || ""),
          employed: String(row[mapping.employed] || ""),
          employmentStatus: String(row[mapping.employmentStatus] || ""),
          employmentDetails: String(row[mapping.employmentDetails] || ""),
          heardAboutUs: String(row[mapping.heardAboutUs] || ""),
          nomineeName: String(nomineeName || ""),
          nomineeGender: String(row[mapping.nomineeGender] || ""),
          nomineeDOB: String(row[mapping.nomineeDOB] || ""),
          nomineeRelationship: String(row[mapping.nomineeRelationship] || ""),
          emptyColumn: String(row[mapping.emptyColumn] || "")
        };

        // Ingestion Validator & Cleanups
        const validated = validateRow(rawRecord);

        // O(1) Memory duplicates check
        const isDuplicate = existingRecords.some(r => isSamePerson(r, validated));

        if (isDuplicate) {
          duplicates++;
          diagnostics.push({ row: index + 1, status: 'DUPLICATE', details: `Duplicate carpenter found: ${validated.nameOfCarpenter}` });
          continue;
        }

        currentMaxSr++;
        importOps.push(
          prisma.record.create({
            data: {
              srNo: currentMaxSr,
              category: row[mapping.category] || 'Other',
              nameOfCarpenter: validated.nameOfCarpenter,
              nameOfOrganization: validated.nameOfOrganization,
              specialization: validated.specialization,
              communication: validated.communication,
              state: validated.state,
              districtCity: validated.districtCity,
              address: validated.address,
              certificateLink: validated.certificateLink,
              insuranceLink1: validated.insuranceLink1,
              insuranceLink2: validated.insuranceLink2,
              customColumn: validated.customColumn,
              remarks: validated.remarks,
              enrollmentNumber: validated.enrollmentNumber,
              enrollmentDate: validated.enrollmentDate,
              subdivision: validated.subdivision,
              firstName: validated.firstName,
              middleName: validated.middleName,
              lastName: validated.lastName,
              fullName: validated.fullName,
              enrollmentNumRegister: validated.enrollmentNumRegister,
              enrollmentYear: validated.enrollmentYear,
              enrollmentMonth: validated.enrollmentMonth,
              reasonFor: validated.reasonFor,
              reasonForEdit: validated.reasonForEdit,
              carpenterId: validated.carpenterId,
              motherName: validated.motherName,
              fatherName: validated.fatherName,
              husbandName: validated.husbandName,
              religion: validated.religion,
              workability: validated.workability,
              physicalDisability: validated.physicalDisability,
              officer: validated.officer,
              officeName: validated.officeName,
              salutation: validated.salutation,
              certificateNumber: validated.certificateNumber,
              candidateNumber: validated.candidateNumber,
              dateOfBirth: validated.dateOfBirth,
              occupationProfession: validated.occupationProfession,
              maritalStatus: validated.maritalStatus,
              guardiansName: validated.guardiansName,
              disability: validated.disability,
              typeofDisability: validated.typeofDisability,
              pinCode: validated.pinCode,
              idType: validated.idType,
              typeofAlternateID: validated.typeofAlternateID,
              idNo: validated.idNo,
              educationLevel: validated.educationLevel,
              preTrainingStatus: validated.preTrainingStatus,
              previousExperienceSector: validated.previousExperienceSector,
              noofmonthsofpreviousexperience: validated.noofmonthsofpreviousexperience,
              employed: validated.employed,
              employmentStatus: validated.employmentStatus,
              employmentDetails: validated.employmentDetails,
              heardAboutUs: validated.heardAboutUs,
              nomineeName: validated.nomineeName,
              nomineeGender: validated.nomineeGender,
              nomineeDOB: validated.nomineeDOB,
              nomineeRelationship: validated.nomineeRelationship,
              emptyColumn: validated.emptyColumn
            }
          })
        );
        success++;
      } catch (err) {
        failed++;
        diagnostics.push({ row: index + 1, status: 'FAILED', details: err.message });
      }
    }

    if (importOps.length > 0) {
      await prisma.$transaction(importOps);
    }

    // Remove temp file
    fs.unlinkSync(tempPath);

    // Save Ingestion Diagnostics Log
    const importLog = await prisma.import.create({
      data: {
        fileName: filePath,
        fileType: isExcel ? 'EXCEL' : 'CSV',
        totalRows: parsedRows.length,
        successfullyImported: success,
        failedRows: failed,
        duplicateRows: duplicates,
        status: failed === 0 ? 'COMPLETED' : (success > 0 ? 'PARTIAL' : 'FAILED'),
        logDetails: JSON.stringify(diagnostics)
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'IMPORT',
        details: `Imported file ${filePath}. Successfully added: ${success}, duplicates ignored: ${duplicates}, failures: ${failed}`
      }
    });

    res.json({
      importLog,
      success,
      failed,
      duplicates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.post('/api/records/:id/upload-document', authenticateToken, upload.single('file'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { docType } = req.body; // 'certificate', 'insurance1', 'insurance2'

//     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

//     const localAssetPath = `/uploads/documents/${req.file.filename}`;
//     const updateData = {};

//     if (docType === 'certificate') {
//       updateData.certificateLink = localAssetPath;
//     } else if (docType === 'insurance1') {
//       updateData.insuranceLink1 = localAssetPath;
//     } else if (docType === 'insurance2') {
//       updateData.insuranceLink2 = localAssetPath;
//     } else {
//       return res.status(400).json({ error: 'Invalid document target parameter' });
//     }

//     const updated = await prisma.record.update({
//       where: { id },
//       data: updateData
//     });

//     await prisma.activityLog.create({
//       data: {
//         userId: req.user.id,
//         userName: req.user.name,
//         action: 'UPLOAD_DOCUMENT',
//         details: `Uploaded ${docType} for ${updated.nameOfCarpenter}`
//       }
//     });

//     res.json({ message: 'Document uploaded successfully', path: localAssetPath });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// ----------------------------------------------------
// Export Ledger Data Endpoints
// ----------------------------------------------------
app.get('/api/export/csv', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.record.findMany({
      where: { isDeleted: false },
      orderBy: { srNo: 'asc' }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=carpenter_registry_export.csv');

    // Build standard headers
    let csvContent = "Sr No,Category,Carpenter Name,Organization,Specialization,Communication,State,City/District,Address,Certificate Link,Insurance Link 1,Insurance Link 2,Custom Column,Remarks\n";

    records.forEach(r => {
      const line = [
        r.srNo,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.nameOfCarpenter || '').replace(/"/g, '""')}"`,
        `"${(r.nameOfOrganization || '').replace(/"/g, '""')}"`,
        `"${(r.specialization || '').replace(/"/g, '""')}"`,
        `"${(r.communication || '').replace(/"/g, '""')}"`,
        `"${(r.state || '').replace(/"/g, '""')}"`,
        `"${(r.districtCity || '').replace(/"/g, '""')}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        `"${(r.certificateLink || '').replace(/"/g, '""')}"`,
        `"${(r.insuranceLink1 || '').replace(/"/g, '""')}"`,
        `"${(r.insuranceLink2 || '').replace(/"/g, '""')}"`,
        `"${(r.customColumn || '').replace(/"/g, '""')}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += line + "\n";
    });

    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/export/xlsx', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.record.findMany({
      where: { isDeleted: false },
      orderBy: { srNo: 'asc' }
    });

    const data = records.map(r => ({
      "Sr No": r.srNo,
      "Category": r.category,
      "Carpenter Name": r.nameOfCarpenter,
      "Organization": r.nameOfOrganization,
      "Specialization": r.specialization,
      "Communication": r.communication,
      "State": r.state,
      "City/District": r.districtCity,
      "Address": r.address,
      "Certificate Link": r.certificateLink,
      "Insurance Link 1": r.insuranceLink1,
      "Insurance Link 2": r.insuranceLink2,
      "Custom Column": r.customColumn,
      "Remarks": r.remarks
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Carpenter Registry");

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=carpenter_registry_export.xlsx');
    res.send(buf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// System Logs & Ingestion History Endpoints
// ----------------------------------------------------
app.get('/api/imports', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.import.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activity-logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Administrator permissions required.' });
    }
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// System Dashboard Executive Intelligence Analytics
// ----------------------------------------------------
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const totalRecords = await prisma.record.count({
      where: { isDeleted: false }
    });

    const categoryCounts = await prisma.record.groupBy({
      by: ['category'],
      where: { isDeleted: false },
      _count: { id: true }
    });

    const stateCounts = await prisma.record.groupBy({
      by: ['state'],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Calculate document completeness for "Reliability" chart
    const activeRecs = await prisma.record.findMany({
      where: { isDeleted: false }
    });

    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;

    activeRecs.forEach(r => {
      const hasCert = !!r.certificateLink;
      const hasInsurance = !!(r.insuranceLink1 || r.insuranceLink2);
      
      if (hasCert && hasInsurance) {
        highCount++;
      } else if (hasCert || hasInsurance) {
        medCount++;
      } else {
        lowCount++;
      }
    });

    const reliabilityDist = [
      { reliability: 'High', count: highCount },
      { reliability: 'Medium', count: medCount },
      { reliability: 'Low', count: lowCount }
    ];

    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const lastImport = await prisma.import.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      totalRecords,
      categoryDist: categoryCounts.map(c => ({ category: c.category || 'Other', count: c._count.id })),
      stateDist: stateCounts.map(s => ({ state: s.state || 'Unknown', count: s._count.id })),
      reliabilityDist,
      recentActivities,
      imports: lastImport || { successfullyImported: 0, failedRows: 0, duplicateRows: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default app;

