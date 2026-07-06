import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cities database
let citiesMap = {};
try {
  const citiesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf8');
  citiesMap = JSON.parse(citiesRaw);
} catch (e) {
  console.error("Cities lookup failed to load:", e);
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

const stateNormalizeMap = {};
INDIAN_STATES.forEach(s => {
  stateNormalizeMap[s.toLowerCase().replace(/[^a-z0-9]/g, '')] = s;
});

export function cleanName(name) {
  if (!name) return "";
  // Removes special symbols (* # $ % & ^ @ _ = + [ ] { } | \ < > ? ~ `) and trims double spaces
  let cleaned = name.replace(/[*#$%&^@_=+[\]{}|\\<>?~`]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export function normalizePhoneNumber(phone) {
  if (!phone) return "";
  const str = String(phone);
  
  // Split values by common separators (spaces, commas, slashes)
  const fragments = str.split(/[\s,\/]+/);
  const cleanNums = [];
  
  for (let frag of fragments) {
    let digits = frag.replace(/\D/g, '');
    if (digits.length >= 10) {
      // Strip leading zeros or 91 prefix
      if (digits.startsWith('91') && digits.length > 10) {
        digits = digits.slice(2);
      } else if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
      }
      if (digits.length === 10) {
        cleanNums.push(digits);
      }
    }
  }
  
  // If no 10 digit fragments found, merge entire string and extract digits
  if (cleanNums.length === 0) {
    let allDigits = str.replace(/\D/g, '');
    if (allDigits.startsWith('91') && allDigits.length > 10) {
      allDigits = allDigits.slice(2);
    } else if (allDigits.startsWith('0')) {
      allDigits = allDigits.replace(/^0+/, '');
    }
    if (allDigits.length >= 10) {
      cleanNums.push(allDigits.slice(-10));
    }
  }
  
  return cleanNums.join(', ');
}

export function selectBestName(name1, name2) {
  const n1 = cleanName(name1);
  const n2 = cleanName(name2);
  if (!n1) return n2;
  if (!n2) return n1;
  
  // Checks if name has trailing digits/codes (e.g. "Aakritee Kapoor 11 SW")
  const endsWithCode1 = /\b\d+(\s*[A-Z]+)*$/i.test(n1);
  const endsWithCode2 = /\b\d+(\s*[A-Z]+)*$/i.test(n2);
  
  if (endsWithCode1 && !endsWithCode2) {
    return n2;
  }
  if (endsWithCode2 && !endsWithCode1) {
    return n1;
  }
  return n1.length >= n2.length ? n1 : n2;
}

export function isSamePerson(a, b) {
  // Extract all emails and phone numbers from communication strings
  const getCommTokens = (comm) => {
    if (!comm) return { phones: new Set(), emails: new Set() };
    const phones = new Set();
    const emails = new Set();
    const parts = comm.split(/[\s,]+/);
    for (let p of parts) {
      if (p.includes('@')) {
        emails.add(p.toLowerCase().trim());
      } else {
        const digits = p.replace(/\D/g, '');
        if (digits.length === 10) {
          phones.add(digits);
        }
      }
    }
    return { phones, emails };
  };

  const commA = getCommTokens(a.communication);
  const commB = getCommTokens(b.communication);

  // 1. Shared common email
  for (let e of commA.emails) {
    if (commB.emails.has(e)) return true;
  }

  // 2. Shared common phone
  for (let p of commA.phones) {
    if (commB.phones.has(p)) return true;
  }

  // 3. Exact same clean name with non-conflicting details
  const nameA = cleanName(a.nameOfCarpenter).toLowerCase();
  const nameB = cleanName(b.nameOfCarpenter).toLowerCase();

  if (nameA && nameA === nameB) {
    // If one is missing details, or if there's no conflict
    const hasPhoneConflict = [...commA.phones].some(p => commB.phones.size > 0 && !commB.phones.has(p));
    const hasEmailConflict = [...commA.emails].some(e => commB.emails.size > 0 && !commB.emails.has(e));
    if (!hasPhoneConflict && !hasEmailConflict) {
      return true;
    }
  }

  return false;
}

export function validateRow(row) {
  const result = { ...row };
  
  // Designation Redirection / Location Shift
  const cleanOrg = cleanName(result.nameOfOrganization);
  const cleanSpec = cleanName(result.specialization);
  const cleanNameVal = cleanName(result.nameOfCarpenter);

  const checkAndExtractLocation = (val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    
    // Check states
    for (let key in stateNormalizeMap) {
      if (lower.includes(key)) {
        return { state: stateNormalizeMap[key], match: key };
      }
    }
    // Check cities
    for (let key in citiesMap) {
      if (lower.includes(key)) {
        return { city: key, state: citiesMap[key], match: key };
      }
    }
    return null;
  };

  // 1. Designation Redirection: If designation or org field is purely/mainly a city or state name (optionally followed by HQ/Office)
  const isOrgLocationOnly = (val) => {
    if (!val) return false;
    const cleanStr = val.toLowerCase().replace(/\b(office|hq|branch|center|headquarters)\b/g, '').trim();
    if (!cleanStr) return false;
    return !!(citiesMap[cleanStr] || stateNormalizeMap[cleanStr.replace(/[^a-z0-9]/g, '')]);
  };

  if (isOrgLocationOnly(result.nameOfOrganization)) {
    const loc = checkAndExtractLocation(result.nameOfOrganization);
    if (loc) {
      if (loc.state) result.state = result.state || loc.state;
      if (loc.city) result.districtCity = result.districtCity || (loc.city.charAt(0).toUpperCase() + loc.city.slice(1));
      result.nameOfOrganization = "";
    }
  }

  if (isOrgLocationOnly(result.specialization)) {
    const loc = checkAndExtractLocation(result.specialization);
    if (loc) {
      if (loc.state) result.state = result.state || loc.state;
      if (loc.city) result.districtCity = result.districtCity || (loc.city.charAt(0).toUpperCase() + loc.city.slice(1));
      result.specialization = "";
    }
  }

  // 2. Name Location Extraction: Scan columns for cities/states
  const extractAndStrip = (text) => {
    if (!text) return { text, loc: null };
    const loc = checkAndExtractLocation(text);
    if (loc) {
      // Create regex to strip location word and surrounding brackets
      const escapedMatch = loc.match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\(?\\b${escapedMatch}\\b\\)?`, 'gi');
      let newText = text.replace(regex, '').replace(/\s+/g, ' ').trim();
      return { text: newText, loc };
    }
    return { text, loc: null };
  };

  const nameExtract = extractAndStrip(result.nameOfCarpenter);
  if (nameExtract.loc) {
    result.nameOfCarpenter = nameExtract.text;
    if (nameExtract.loc.state) result.state = result.state || nameExtract.loc.state;
    if (nameExtract.loc.city) result.districtCity = result.districtCity || (nameExtract.loc.city.charAt(0).toUpperCase() + nameExtract.loc.city.slice(1));
  }

  const orgExtract = extractAndStrip(result.nameOfOrganization);
  if (orgExtract.loc) {
    result.nameOfOrganization = orgExtract.text;
    if (orgExtract.loc.state) result.state = result.state || orgExtract.loc.state;
    if (orgExtract.loc.city) result.districtCity = result.districtCity || (orgExtract.loc.city.charAt(0).toUpperCase() + orgExtract.loc.city.slice(1));
  }

  // 3. City-to-State Lookup
  if (result.districtCity && !result.state) {
    const cityKey = result.districtCity.toLowerCase().trim();
    if (citiesMap[cityKey]) {
      result.state = citiesMap[cityKey];
    }
  }

  // Normalization cleanup
  result.nameOfCarpenter = cleanName(result.nameOfCarpenter);
  result.nameOfOrganization = cleanName(result.nameOfOrganization);
  result.specialization = cleanName(result.specialization);

  return result;
}
