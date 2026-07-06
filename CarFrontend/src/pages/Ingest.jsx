import React, { useState, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { 
  FileUp, 
  Map, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function Ingest({ setCurrentTab }) {
  const { 
    uploadFilePreview, 
    importFileFinal, 
    uploadPreview, 
    uploadLoading, 
    uploadError 
  } = useVaultStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mapping, setMapping] = useState({
    nameOfCarpenter: '',
    nameOfOrganization: '',
    category: '',
    specialization: '',
    communication: [], // Supports array for multi-column consolidation
    state: '',
    districtCity: '',
    address: '',
    certificateLink: '',
    insuranceLink1: '',
    insuranceLink2: '',
    customColumn: '',
    remarks: '',
    enrollmentNumber: '',
    enrollmentDate: '',
    subdivision: '',
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    enrollmentNumRegister: '',
    enrollmentYear: '',
    enrollmentMonth: '',
    reasonFor: '',
    reasonForEdit: '',
    carpenterId: '',
    motherName: '',
    fatherName: '',
    husbandName: '',
    religion: '',
    workability: '',
    physicalDisability: '',
    officer: '',
    officeName: '',
    salutation: '',
    certificateNumber: '',
    candidateNumber: '',
    dateOfBirth: '',
    occupationProfession: '',
    maritalStatus: '',
    guardiansName: '',
    disability: '',
    typeofDisability: '',
    pinCode: '',
    idType: '',
    typeofAlternateID: '',
    idNo: '',
    educationLevel: '',
    preTrainingStatus: '',
    previousExperienceSector: '',
    noofmonthsofpreviousexperience: '',
    employed: '',
    employmentStatus: '',
    employmentDetails: '',
    heardAboutUs: '',
    nomineeFirstName: '',
    nomineeMiddleName: '',
    nomineeLastName: '',
    nomineeGender: '',
    nomineeDOB: '',
    nomineeRelationship: '',
    emptyColumn: ''
  });
  
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Validation Review & Commit
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      await processUpload(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await processUpload(file);
    }
  };

  const processUpload = async (file) => {
    const preview = await uploadFilePreview(file);
    if (preview) {
      // Auto-detect mappings from headers using exact matching for Columns.xlsx
      const headers = preview.headers;
      const findHeader = (patterns) => {
        return headers.find(h => 
          patterns.some(p => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p.toLowerCase().replace(/[^a-z0-9]/g, '')))
        ) || '';
      };

      // Exact header matching for known patterns
      const exactMatch = (target) => headers.find(h => h === target) || '';

      // Communication columns: MobileNo + EmailID
      const commCols = headers.filter(h => 
        ['MobileNo', 'EmailID'].includes(h) ||
        ['phone', 'tel', 'mobile', 'email', 'contact'].some(p => 
          h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p)
        )
      );

      // Address merge columns: PermanentAddressAddress + PermanentAddressPINCode + PermanentAddressTehsil + PermanentAddressConstituency + CommunicationAddress fields
      const addressParts = headers.filter(h => 
        ['PermanentAddressAddress', 'PermanentAddressPINCode', 'PermanentAddressTehsil', 'PermanentAddressConstituency',
         'CommunicationSameasPermanentAddress', 'CommunicationAddressPINCode', 'CommunicationAddressTehsil', 'CommunicationAddressPermanentConstituency'].includes(h)
      );

      // State: pick from DomicileState, PermanentAddressState, CommunicationAddressState
      const stateCol = exactMatch('DomicileState') || exactMatch('PermanentAddressState') || exactMatch('CommunicationAddressState') || findHeader(['state']);
      
      // District/City: pick from PermanentAddressDistrict, PermanentAddressCity, CommunicationAddressDistrict, CommunicationAddressCity
      const districtCol = exactMatch('PermanentAddressDistrict') || exactMatch('PermanentAddressCity') || exactMatch('CommunicationAddressDistrict') || exactMatch('CommunicationAddressCity') || findHeader(['district', 'city']);

      setMapping({
        nameOfCarpenter: exactMatch('Full name') || findHeader(['fullname', 'nameofcarpenter']),
        nameOfOrganization: findHeader(['org', 'company', 'firm', 'shop']),
        category: exactMatch('Category') || findHeader(['category']),
        specialization: findHeader(['specialization', 'spec', 'skill']),
        communication: commCols.length > 0 ? commCols : [],
        state: stateCol,
        districtCity: districtCol,
        address: addressParts.length > 0 ? addressParts[0] : findHeader(['address', 'permanentaddressaddress']),
        certificateLink: exactMatch('Certificate') || findHeader(['certificate']),
        insuranceLink1: headers.find(h => h.startsWith('Insurance 1')) || findHeader(['insurance1', 'ins1']),
        insuranceLink2: exactMatch('Insurance 2') || findHeader(['insurance2', 'ins2']),
        customColumn: findHeader(['custom', 'extra']),
        remarks: exactMatch('Remarks') || exactMatch('Remark') || findHeader(['remarks', 'remark']),
        enrollmentNumber: findHeader(['enrollmentnumber']),
        enrollmentDate: exactMatch('Enrollment Date') || findHeader(['enrollmentdate']),
        subdivision: findHeader(['subdivision']),
        firstName: exactMatch('First Name') || findHeader(['firstname']),
        middleName: exactMatch('Middle Name') || findHeader(['middlename']),
        lastName: exactMatch('Last Name') || findHeader(['lastname']),
        fullName: exactMatch('Full name') || findHeader(['fullname']),
        enrollmentNumRegister: findHeader(['enrollmentnumregister']),
        enrollmentYear: findHeader(['enrollmentyear']),
        enrollmentMonth: findHeader(['enrollmentmonth']),
        reasonFor: findHeader(['reasonfor']),
        reasonForEdit: findHeader(['reasonforedit']),
        carpenterId: findHeader(['carpenterid']),
        motherName: exactMatch('MothersName') || findHeader(['mothersname', 'mothername']),
        fatherName: exactMatch('FathersName') || findHeader(['fathersname', 'fathername']),
        husbandName: findHeader(['husbandname']),
        religion: exactMatch('Religion') || findHeader(['religion']),
        workability: findHeader(['workability']),
        physicalDisability: findHeader(['physicaldisability']),
        officer: findHeader(['officer']),
        officeName: findHeader(['officename']),
        salutation: exactMatch('Salutation') || findHeader(['salutation']),
        certificateNumber: exactMatch('Certificate number') || findHeader(['certificatenumber']),
        candidateNumber: exactMatch('Candidate Number') || findHeader(['candidatenumber']),
        dateOfBirth: exactMatch('DateofBirth (DD/MM/ YYYY)') || findHeader(['dateofbirth']),
        occupationProfession: exactMatch('Occupation_Profession') || findHeader(['occupationprofession', 'occupation']),
        maritalStatus: exactMatch('MaritalStatus') || findHeader(['maritalstatus']),
        guardiansName: exactMatch('GuardiansName') || findHeader(['guardiansname']),
        disability: exactMatch('Disability') || findHeader(['disability']),
        typeofDisability: exactMatch('TypeofDisability') || findHeader(['typeofdisability']),
        pinCode: exactMatch('Pin Code') || findHeader(['pincode']),
        idType: exactMatch('IDType') || findHeader(['idtype']),
        typeofAlternateID: exactMatch('TypeofAlternateID') || findHeader(['typeofalternateid']),
        idNo: exactMatch('IDNo') || findHeader(['idno']),
        educationLevel: exactMatch('EducationLevel') || findHeader(['educationlevel']),
        preTrainingStatus: exactMatch('PreTrainingStatus') || findHeader(['pretrainingstatus']),
        previousExperienceSector: exactMatch('PreviousExperienceSector') || findHeader(['previousexperiencesector']),
        noofmonthsofpreviousexperience: exactMatch('Noofmonthsofpreviousexperience') || findHeader(['noofmonthsofpreviousexperience']),
        employed: exactMatch('Employed') || findHeader(['employed']),
        employmentStatus: exactMatch('EmploymentStatus') || findHeader(['employmentstatus']),
        employmentDetails: exactMatch('EmploymentDetails') || findHeader(['employmentdetails']),
        heardAboutUs: exactMatch('HeardAboutUs') || findHeader(['heardaboutus']),
        nomineeFirstName: exactMatch('First Name_1') || findHeader(['firstname1', 'firstname_1']),
        nomineeMiddleName: exactMatch('Middle Name.1') || findHeader(['middlename1', 'middlename.1']),
        nomineeLastName: exactMatch('Last Name.1') || findHeader(['lastname1', 'lastname.1']),
        nomineeGender: exactMatch('Gender.1') || findHeader(['gender1', 'gender.1']),
        nomineeDOB: exactMatch('Date of Birth') || findHeader(['dateofbirth']),
        nomineeRelationship: exactMatch('Nominee Relationship') || findHeader(['nomineerelationship']),
        emptyColumn: exactMatch('__EMPTY') || findHeader(['__empty'])
      });
      setStep(2);
    }
  };

  const handleMappingChange = (targetField, val) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: val
    }));
  };

  const handleCommitMapping = async () => {
    try {
      const result = await importFileFinal(uploadPreview.filePath, mapping, uploadPreview.fileName);
      setImportResult(result);
      setStep(3);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep(1);
    setImportResult(null);
  };

  const allowedDbColumns = [
    { key: 'nameOfCarpenter', label: 'Carpenter Name *' },
    { key: 'category', label: 'Category Designation' },
    { key: 'nameOfOrganization', label: 'Organization / Shop' },
    { key: 'specialization', label: 'Specialization / Skillset' },
    { key: 'state', label: 'State' },
    { key: 'districtCity', label: 'City / District' },
    { key: 'address', label: 'Address details' },
    { key: 'certificateLink', label: 'Certificate document URL' },
    { key: 'insuranceLink1', label: 'Insurance Contract 1 URL' },
    { key: 'insuranceLink2', label: 'Insurance Contract 2 URL' },
    { key: 'customColumn', label: 'Custom column' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'enrollmentNumber', label: 'Enrollment Number' },
    { key: 'enrollmentDate', label: 'Enrollment Date' },
    { key: 'subdivision', label: 'Subdivision' },
    { key: 'firstName', label: 'First Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'enrollmentNumRegister', label: 'Enrollment Number in Register' },
    { key: 'enrollmentYear', label: 'Enrollment Year' },
    { key: 'enrollmentMonth', label: 'Enrollment Month' },
    { key: 'reasonFor', label: 'Reason for' },
    { key: 'reasonForEdit', label: 'Reason for Edit' },
    { key: 'carpenterId', label: 'Carpenter ID' },
    { key: 'motherName', label: "Mother's Name" },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'husbandName', label: "Husband's Name" },
    { key: 'religion', label: 'Religion' },
    { key: 'workability', label: 'Workability' },
    { key: 'physicalDisability', label: 'Physical Disability' },
    { key: 'officer', label: 'Officer' },
    { key: 'officeName', label: 'Office Name' },
    { key: 'salutation', label: 'Salutation' },
    { key: 'certificateNumber', label: 'Certificate Number' },
    { key: 'candidateNumber', label: 'Candidate Number' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'occupationProfession', label: 'Occupation/Profession' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'guardiansName', label: "Guardian's Name" },
    { key: 'disability', label: 'Disability' },
    { key: 'typeofDisability', label: 'Type of Disability' },
    { key: 'pinCode', label: 'Pin Code' },
    { key: 'idType', label: 'ID Type' },
    { key: 'typeofAlternateID', label: 'Type of Alternate ID' },
    { key: 'idNo', label: 'ID Number' },
    { key: 'educationLevel', label: 'Education Level' },
    { key: 'preTrainingStatus', label: 'Pre-Training Status' },
    { key: 'previousExperienceSector', label: 'Previous Experience Sector' },
    { key: 'noofmonthsofpreviousexperience', label: 'No. of Months of Prev. Experience' },
    { key: 'employed', label: 'Employed Status' },
    { key: 'employmentStatus', label: 'Employment Status' },
    { key: 'employmentDetails', label: 'Employment Details' },
    { key: 'heardAboutUs', label: 'Heard About Us' },
    {key: 'nomineeName', label: 'Nominee Name'},
    {key: 'nomineeGender', label: 'Nominee Gender'},
    {key: 'nomineeDOB', label: 'Nominee DOB'},
    {key: 'nomineeRelationship', label: 'Nominee Relationship'},
    {key: 'emptyColumn', label: 'Additional Unmapped Metadata'}
  ];

  return (
    <div className="space-y-8 pb-10 text-slate-800">
      
      {/* Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-slate-900">
          Smart Ingestion <span className="font-normal italic text-[var(--accent-primary)]">Engine</span>
        </h2>
        <p className="text-slate-550 text-xs mt-1 uppercase tracking-wider font-medium">
          Drag and drop messy spreadsheets and map columns into high-value relationship profiles
        </p>
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Upload Steps Progress Bar */}
          <div className="flex items-center gap-4 max-w-xl bg-white border border-[#DDE3EA] p-4 rounded-2xl text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
            <span className={step === 1 ? 'text-[var(--accent-primary)] font-bold' : 'text-slate-400'}>1. Load Ledger</span>
            <ArrowRight size={12} className="text-slate-300" />
            <span className={step === 2 ? 'text-[var(--accent-primary)] font-bold' : 'text-slate-400'}>2. Align AI Mapping</span>
            <ArrowRight size={12} className="text-slate-300" />
            <span className={step === 3 ? 'text-[var(--accent-primary)] font-bold' : 'text-slate-400'}>3. Commit Vault Records</span>
          </div>

          {/* Step 1: Upload Drag Area */}
          {step === 1 && (
            <div className="w-full">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`h-72 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 relative group ${
                  dragActive 
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' 
                    : 'border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 bg-white hover:bg-slate-50 shadow-sm'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                />
                {uploadLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="text-[var(--accent-primary)] animate-spin" size={40} />
                    <span className="text-slate-800 font-serif italic text-lg">Decrypting dataset rows...</span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-white border border-[#DDE3EA] rounded-2xl text-[var(--accent-primary)] group-hover:scale-110 duration-300 shadow-sm">
                      <FileUp size={32} />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-slate-800 mt-4">Select or drop spreadsheet file</h3>
                    <p className="text-slate-500 text-xs mt-2 max-w-sm">Supports Microsoft Excel (.xlsx, .xls) and standard text delimited CSV exports.</p>
                    <div className="mt-4 px-3 py-1 bg-[#ECEFF4] border border-[#DDE3EA] rounded-full text-[10px] text-[var(--accent-primary)] flex items-center gap-1 font-semibold">
                      <Sparkles size={10} className="text-[var(--accent-primary)] animate-pulse" />
                      <span>Includes automatic location parsing & phone normalizer</span>
                    </div>
                  </>
                )}
              </div>
              {uploadError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-655 rounded-2xl text-xs font-semibold">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Custom Mapping Alignments */}
          {step === 2 && uploadPreview && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Smart Columns Match Board */}
              <div className="xl:col-span-2 space-y-6">
                <div className="vault-card !overflow-visible">
                  <div className="flex items-center justify-between border-b border-[#DDE3EA] pb-4 mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Map size={14} className="text-[var(--accent-primary)]" />
                      <span>Align AI Column Mapping</span>
                    </h3>
                    <button 
                      onClick={handleReset}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 border border-red-200 px-2.5 py-1 rounded-lg bg-red-50 shadow-sm"
                    >
                      <Trash2 size={12} />
                      <span>Discard Ingestion</span>
                    </button>
                  </div>

                  {/* Fields Mapping */}
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                    
                    {allowedDbColumns.map((col) => (
                      <div key={col.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl hover:border-[var(--accent-primary)]/30 transition-colors shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Vault Target Schema Field</span>
                          <span className="text-sm font-serif font-bold text-slate-800 mt-1">{col.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 text-[10px]">← Map From ←</span>
                          <select
                            value={mapping[col.key] || ''}
                            onChange={(e) => handleMappingChange(col.key, e.target.value)}
                            className="bg-white border border-[#DDE3EA] text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-primary)] font-semibold shadow-sm"
                          >
                            <option value="">-- Leave Blank / Ignore --</option>
                            {uploadPreview.headers.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Consolidated Communications selection */}
                    <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl shadow-sm space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Consolidated Communications</span>
                        <span className="text-xs text-slate-400 mt-0.5">Select multiple columns containing telephone, mobile, or emails to join together:</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-white p-3 border border-[#DDE3EA] rounded-lg max-h-32 overflow-y-auto shadow-inner">
                        {uploadPreview.headers.map((h) => (
                          <label key={h} className="flex items-center gap-2 text-xs text-slate-700 font-semibold select-none cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={mapping.communication?.includes(h)}
                              className="rounded border-[#DDE3EA] bg-white text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20 h-4 w-4"
                              onChange={(e) => {
                                const currentComm = mapping.communication || [];
                                if (e.target.checked) {
                                  handleMappingChange('communication', [...currentComm, h]);
                                } else {
                                  handleMappingChange('communication', currentComm.filter(item => item !== h));
                                }
                              }}
                            />
                            <span className="truncate">{h}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#DDE3EA] pt-6 mt-6 flex justify-end gap-3">
                    <button onClick={handleReset} className="btn-frosted text-sm font-semibold">Cancel</button>
                    <button 
                      onClick={handleCommitMapping} 
                      disabled={!mapping.nameOfCarpenter}
                      className="btn-gold disabled:opacity-40"
                    >
                      <span>Commit to Vault Ledger</span>
                      <Database size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded File preview sidebar */}
              <div className="xl:col-span-1 space-y-6">
                <div className="vault-card">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Ingested Spreadsheet Info</h3>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="flex justify-between border-b border-[#DDE3EA] pb-2">
                      <span className="text-slate-500">File Name:</span>
                      <span className="text-slate-800 break-all pl-4 text-right">{uploadPreview.fileName}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#DDE3EA] pb-2">
                      <span className="text-slate-500">Total Records:</span>
                      <span className="text-slate-900 font-bold text-sm">{uploadPreview.totalRows} Rows</span>
                    </div>
                    <div className="flex justify-between border-b border-[#DDE3EA] pb-2">
                      <span className="text-slate-500">Columns Discovered:</span>
                      <span className="text-slate-800">{uploadPreview.headers.length}</span>
                    </div>
                  </div>
                </div>

                <div className="vault-card">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Ingested Rows Sample (First 2)</h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {uploadPreview.previewRows?.slice(0, 2).map((row, idx) => (
                      <div key={idx} className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DDE3EA] text-[10px] space-y-1">
                        {Object.entries(row).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <span className="text-slate-500 font-semibold">{k}:</span>
                            <span className="text-slate-700 truncate text-right">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Step 3: Success logs & Duplicate diagnostic summary */}
          {step === 3 && importResult && (
            <div className="space-y-6">
              <div className="vault-card text-center py-10">
                <div className="inline-flex h-16 w-16 rounded-full bg-emerald-50 border border-emerald-250 items-center justify-center text-emerald-600 mb-4 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">Ingestion Transaction Successful</h3>
                <p className="text-slate-550 text-xs uppercase tracking-widest mt-1 font-bold">Cleared and logged to executive repository</p>
                
                {/* Import Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
                  <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-2xl">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Imported</span>
                    <span className="block text-2xl font-bold text-emerald-600 mt-1">{importResult.success}</span>
                  </div>
                  <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-2xl">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Duplicate Skips</span>
                    <span className="block text-2xl font-bold text-amber-600 mt-1">{importResult.duplicates}</span>
                  </div>
                  <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-2xl">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Malformed Skips</span>
                    <span className="block text-2xl font-bold text-red-650 mt-1">{importResult.failed}</span>
                  </div>
                  <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-2xl">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total File Rows</span>
                    <span className="block text-2xl font-bold text-slate-800 mt-1">{importResult.importLog?.totalRows || 0}</span>
                  </div>
                </div>

                {/* If duplicate warning triggers are present */}
                {importResult.duplicates > 0 && (
                  <div className="max-w-2xl mx-auto mt-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-xs font-semibold flex items-center gap-3">
                    <AlertTriangle size={18} className="shrink-0 animate-bounce text-amber-500" />
                    <span className="text-left leading-relaxed">
                      We identified and bypassed **{importResult.duplicates} duplicate records** using unique email, contact numbers, or name matching values to safeguard ledger integrity.
                    </span>
                  </div>
                )}

                <div className="mt-8 flex justify-center gap-4">
                  <button 
                    onClick={() => setCurrentTab('records')}
                    className="btn-gold text-sm font-semibold"
                  >
                    <span>Navigate to Relationship Table</span>
                  </button>
                  <button 
                    onClick={handleReset}
                    className="btn-frosted text-sm font-semibold"
                  >
                    <span>Upload Another spreadsheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
