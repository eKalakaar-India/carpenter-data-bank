import React, { useEffect, useState, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';
import axios from 'axios';
import { 
  Search, 
  Trash2, 
  Download, 
  Edit, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Plus,
  RefreshCw,
  Sparkles,
  GitMerge,
  HelpCircle,
  AlertTriangle,
  Award,
  Shield,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';

const VAULT_FIELDS = [
  { key: 'enrollmentNumber', label: 'Enrollment Number' },
  { key: 'enrollmentDate', label: 'Enrollment Date' },
  { key: 'subdivision', label: 'Subdivision' },
  { key: 'firstName', label: 'First Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'enrollmentNumRegister', label: 'Enrollment Register No' },
  { key: 'enrollmentYear', label: 'Enrollment Year' },
  { key: 'enrollmentMonth', label: 'Enrollment Month' },
  { key: 'reasonFor', label: 'Reason For' },
  { key: 'reasonForEdit', label: 'Reason For Edit' },
  { key: 'carpenterId', label: 'Carpenter ID' },
  { key: 'motherName', label: 'Mother\'s Name' },
  { key: 'fatherName', label: 'Father\'s Name' },
  { key: 'husbandName', label: 'Husband\'s Name' },
  { key: 'religion', label: 'Religion' },
  { key: 'workability', label: 'Workability' },
  { key: 'physicalDisability', label: 'Physical Disability' },
  { key: 'officer', label: 'Officer Name' },
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
  { key: 'nomineeName', label: 'Nominee Name' },
  { key: 'nomineeGender', label: 'Nominee Gender' },
  { key: 'nomineeDOB', label: 'Nominee DOB' },
  { key: 'nomineeRelationship', label: 'Nominee Relationship' },
  { key: 'emptyColumn', label: 'Additional Unmapped Metadata' }
];

export default function Records() {
  const { 
    records, 
    recordsLoading, 
    pagination, 
    filters, 
    aggregates,
    fetchRecords, 
    setFilters, 
    deleteRecord, 
    bulkDeleteRecords,
    updateRecord,
    deduplicateRecords,
    uploadDocument
  } = useVaultStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeVaultRecord, setActiveVaultRecord] = useState(null);
  
  const [searchVal, setSearchVal] = useState(filters.search);

  // Custom searchable dropdown states
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // States for Edit Modal custom searchable dropdowns
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] = useState(false);
  const [editCategorySearch, setEditCategorySearch] = useState('');
  const [editStateDropdownOpen, setEditStateDropdownOpen] = useState(false);
  const [editStateSearch, setEditStateSearch] = useState('');

  // Synchronized scrollbar refs
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  // Hidden File Upload Trigger states
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); // { id, docType }

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters({ search: searchVal });
      fetchRecords(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const handleFilterChange = (key, val) => {
    setFilters({ [key]: val });
    fetchRecords(1);
  };

  const handlePageChange = (newPage) => {
    fetchRecords(newPage);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(records.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} carpenters? This is irreversible.`)) {
      const success = await bulkDeleteRecords(selectedIds);
      if (success) {
        setSelectedIds([]);
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to clear this entry?')) {
      await deleteRecord(id);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateRecord(editingRecord.id, editingRecord);
      setEditingRecord(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDocClick = (id, docType, existingLink) => {
    if (existingLink) {
      if (existingLink.startsWith('http://') || existingLink.startsWith('https://')) {
        window.open(existingLink, '_blank');
      } else {
        // Assume it's a file token or path stored in the backend uploads folder
        window.open(`/uploads/documents/${existingLink}`, '_blank');
      }
    } else {
      // Open upload selector
      setUploadTarget({ id, docType });
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTarget) return;

    try {
      await uploadDocument(uploadTarget.id, uploadTarget.docType, file);
      alert(`${uploadTarget.docType} uploaded successfully.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadTarget(null);
      e.target.value = '';
    }
  };

  const triggerExport = (type) => {
    const idsQuery = selectedIds.length > 0 ? `?ids=${selectedIds.join(',')}` : '';
    axios.get(`/export/${type}${idsQuery}`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Vault_Carpenter_Export_${Date.now()}.${type}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        console.error('Export failed:', err);
        alert('Failed to export files from the vault. Please verify your connection.');
      });
  };

  const categories = ['Master Carpenter', 'Apprentice', 'Cabinet Maker', 'Framer', 'Other'];

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  // Reusable pagination element
  const renderPagination = (positionLabel) => {
    if (recordsLoading || pagination.totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-[#DDE3EA] rounded-xl shadow-sm text-xs">
        <span className="font-semibold text-slate-500">
          Displaying {positionLabel} entries {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-1.5 border border-[#DDE3EA] bg-white rounded-lg hover:bg-[#ECEFF4] disabled:opacity-30 transition-colors text-slate-700 shadow-sm"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-bold px-3 py-1 bg-[#ECEFF4] border border-[#DDE3EA] rounded-md text-[var(--accent-primary)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-1.5 border border-[#DDE3EA] bg-white rounded-lg hover:bg-[#ECEFF4] disabled:opacity-30 transition-colors text-slate-700 shadow-sm"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10 text-slate-800">
      
      {/* Hidden file input for uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Table Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-slate-900">
            Partnership <span className="font-normal italic text-[var(--accent-primary)]">Vault Ledger</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-medium">
            Search, sort, filter, and extract intelligence from active records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => triggerExport('csv')}
            className="btn-frosted text-sm font-semibold flex items-center gap-2"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            onClick={() => triggerExport('xlsx')}
            className="btn-gold text-sm font-semibold"
          >
            <span>Excel Sheet</span>
          </button>
        </div>
      </div>

      {/* Global Search and Bulk Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-[#DDE3EA] rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-2xl">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Global search by Name, Expert, Organization, Specialization..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/65 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to run deduplication on all active database records? This will automatically merge identical or related profiles under the same carpenter name.")) {
                try {
                  const res = await deduplicateRecords();
                  alert(`Deduplication complete! Merged and cleaned ${res.mergedCount} duplicate entries.`);
                } catch (err) {
                  alert(err.message);
                }
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all whitespace-nowrap animate-pulse"
          >
            <GitMerge size={16} />
            <span>Remove Duplicates</span>
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 shadow-sm">
            <span>Selected {selectedIds.length} Entries</span>
            <button 
              onClick={handleBulkDelete}
              className="p-1.5 hover:bg-red-100 rounded-lg border border-red-200 hover:text-red-700 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Filters Area (Horizontal Grid above the table) */}
      <div className="vault-card !overflow-visible grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border-[#DDE3EA]">
        {/* Category */}
        <div className="flex flex-col relative">
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Category</label>
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
          >
            <span>{filters.category || '-- All Categories --'}</span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </button>

          {categoryDropdownOpen && (
            <>
              {/* Invisible Click Overlay to Close */}
              <div className="fixed inset-0 z-30" onClick={() => setCategoryDropdownOpen(false)} />
              
              {/* Dropdown Container */}
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDE3EA] rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto p-2.5 space-y-1 animate-fadeIn"
                style={{ minWidth: '200px' }}
              >
                <input
                  type="text"
                  placeholder="Search category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-primary)] mb-2 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('category', '');
                    setCategoryDropdownOpen(false);
                    setCategorySearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${!filters.category ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                >
                  -- All Categories --
                </button>
                {categories
                  .filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        handleFilterChange('category', c);
                        setCategoryDropdownOpen(false);
                        setCategorySearch('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${filters.category === c ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                    >
                      {c}
                    </button>
                  ))
                }
              </div>
            </>
          )}
        </div>

        {/* State */}
        <div className="flex flex-col relative">
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">State Jurisdiction</label>
          <button
            type="button"
            onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
            className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
          >
            <span>{filters.state || '-- All States --'}</span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </button>

          {stateDropdownOpen && (
            <>
              {/* Invisible Click Overlay to Close */}
              <div className="fixed inset-0 z-30" onClick={() => setStateDropdownOpen(false)} />
              
              {/* Dropdown Container */}
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDE3EA] rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto p-2.5 space-y-1 animate-fadeIn"
                style={{ minWidth: '200px' }}
              >
                <input
                  type="text"
                  placeholder="Search state..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-primary)] mb-2 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('state', '');
                    setStateDropdownOpen(false);
                    setStateSearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${!filters.state ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                >
                  -- All States --
                </button>
                {INDIAN_STATES
                  .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                  .map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        handleFilterChange('state', s);
                        setStateDropdownOpen(false);
                        setStateSearch('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${filters.state === s ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                    >
                      {s}
                    </button>
                  ))
                }
              </div>
            </>
          )}
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchVal('');
              setFilters({ category: '', state: '' });
              fetchRecords(1);
            }}
            className="w-full py-2.5 bg-[#E8ECF2] hover:bg-[#DDE3EA] text-xs text-[var(--accent-primary)] hover:text-red-750 border border-[#DDE3EA] rounded-lg transition-colors font-bold shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Pagination Controls at the Start (Top) of Vault Data */}
      {renderPagination("top")}

      {/* Scrollable Spreadsheet Table Container */}
      <div className="vault-table-container transition-all duration-300">
        {recordsLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white">
            <RefreshCw className="text-[var(--accent-primary)] animate-spin" size={32} />
            <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Unlocking Vault Records...</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Top Horizontal Scrollbar Helper */}
            <div 
              ref={topScrollRef} 
              onScroll={handleTopScroll}
              className="overflow-x-auto w-full border-b border-[#DDE3EA] bg-[#F5F7FA]"
              style={{ height: '12px' }}
            >
              <div style={{ width: '5200px', height: '1px' }} />
            </div>
            
            {/* Table Scrollable Container */}
            <div 
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="overflow-x-auto"
            >
              <table className="vault-table min-w-[5200px]">
              <thead>
                <tr>
                  <th className="w-12 text-center sticky left-0 bg-[#E8ECF2] z-20 border-r border-[#DDE3EA]">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={records.length > 0 && selectedIds.length === records.length}
                      className="rounded border-[#DDE3EA] bg-white text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20 h-4 w-4"
                    />
                  </th>
                  <th className="w-20">Sr No</th>
                  <th className="w-36">Enrollment Date</th>
                  <th className="w-24">Salutation</th>
                  <th className="w-48">Full Name</th>
                  <th className="w-36">Certificate Number</th>
                  <th className="w-36">Candidate Number</th>
                  <th className="w-40 text-center">Credentials Vault</th>
                  <th className="w-32">Date of Birth</th>
                  <th className="w-44">Occupation/Profession</th>
                  <th className="w-32">Marital Status</th>
                  <th className="w-40">Mother's Name</th>
                  <th className="w-40">Guardian's Name</th>
                  <th className="w-28">Religion</th>
                  <th className="w-32">Category</th>
                  <th className="w-28">Disability</th>
                  <th className="w-36">Type of Disability</th>
                  <th className="w-28">Pin Code</th>
                  <th className="w-32">ID Type</th>
                  <th className="w-40">Type of Alternate ID</th>
                  <th className="w-36">ID Number</th>
                  <th className="w-36">Education Level</th>
                  <th className="w-36">Pre-Training Status</th>
                  <th className="w-48">Previous Experience Sector</th>
                  <th className="w-48">No. of Months of Prev. Experience</th>
                  <th className="w-32">Employed Status</th>
                  <th className="w-32">Employment Status</th>
                  <th className="w-44">Employment Details</th>
                  <th className="w-36">Heard About Us</th>
                  <th className="w-44">Nominee Name</th>
                  <th className="w-32">Nominee Gender</th>
                  <th className="w-32">Nominee DOB</th>
                  <th className="w-40">Nominee Relationship</th>
                  <th className="w-40">Additional Metadata</th>
                  <th className="w-56 font-mono">Communication Details</th>
                  <th className="w-32">State</th>
                  <th className="w-32">City / District</th>
                  <th className="w-64">Address details</th>
                  <th className="w-36">Custom Column</th>
                  <th className="w-52">Remarks</th>
                  <th className="w-24 text-center sticky right-0 bg-[#E8ECF2] z-20 border-l border-[#DDE3EA]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr 
                     key={rec.id} 
                     className={selectedIds.includes(rec.id) ? 'bg-[var(--accent-glow)]' : ''}
                  >
                    <td className="text-center sticky left-0 z-10 border-r border-[#DDE3EA] sticky-col">
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectRow(e, rec.id)}
                        checked={selectedIds.includes(rec.id)}
                        className="rounded border-[#DDE3EA] bg-white text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20 h-4 w-4"
                      />
                    </td>
                    <td className="font-semibold text-[var(--accent-primary)]">{rec.srNo || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.enrollmentDate || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.salutation || '-'}</td>
                    <td className="font-serif font-bold text-slate-900 text-sm">{rec.fullName || rec.nameOfCarpenter || '-'}</td>
                    <td className="text-xs text-slate-700">{rec.certificateNumber || '-'}</td>
                    <td className="text-xs text-slate-600 font-mono">{rec.candidateNumber || '-'}</td>
                    
                    {/* Embedded documents icons */}
                    <td className="text-center">
                      <div className="inline-flex gap-2.5 justify-center items-center">
                        <button
                          onClick={() => handleDocClick(rec.id, 'certificate', rec.certificateLink)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            rec.certificateLink 
                              ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' 
                              : 'bg-slate-50 text-slate-400 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border-[#DDE3EA]'
                          }`}
                          title={rec.certificateLink ? "Open Professional Certificate" : "Upload Certificate PDF"}
                        >
                          <Award size={14} />
                        </button>
                        <button
                          onClick={() => handleDocClick(rec.id, 'insurance1', rec.insuranceLink1)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            rec.insuranceLink1 
                              ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                              : 'bg-slate-50 text-slate-400 hover:text-blue-500 hover:border-blue-500 border-[#DDE3EA]'
                          }`}
                          title={rec.insuranceLink1 ? "Open Primary Insurance" : "Upload Primary Insurance PDF"}
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => handleDocClick(rec.id, 'insurance2', rec.insuranceLink2)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            rec.insuranceLink2 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
                              : 'bg-slate-50 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 border-[#DDE3EA]'
                          }`}
                          title={rec.insuranceLink2 ? "Open Secondary Insurance" : "Upload Secondary Insurance PDF"}
                        >
                          <ShieldCheck size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="text-xs text-slate-600">{rec.dateOfBirth || '-'}</td>
                    <td className="text-xs text-slate-700">{rec.occupationProfession || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.maritalStatus || '-'}</td>
                    <td className="text-xs text-slate-700">{rec.motherName || rec.mothersName || '-'}</td>
                    <td className="text-xs text-slate-750">{rec.guardiansName || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.religion || '-'}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.category === 'Master Carpenter' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        rec.category === 'Apprentice' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        rec.category === 'Cabinet Maker' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                        rec.category === 'Framer' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {rec.category}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">{rec.disability || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.typeofDisability || '-'}</td>
                    <td className="text-xs text-slate-600 font-mono">{rec.pinCode || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.idType || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.typeofAlternateID || '-'}</td>
                    <td className="text-xs text-slate-600 font-mono">{rec.idNo || '-'}</td>
                    <td className="text-xs text-slate-700">{rec.educationLevel || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.preTrainingStatus || '-'}</td>
                    <td className="text-xs text-slate-700">{rec.previousExperienceSector || '-'}</td>
                    <td className="text-xs text-slate-600 font-mono">{rec.noofmonthsofpreviousexperience || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.employed || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.employmentStatus || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.employmentDetails || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.heardAboutUs || '-'}</td>
                    <td className="text-xs text-slate-750 font-bold">{rec.nomineeName || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.nomineeGender || '-'}</td>
                    <td className="text-xs text-slate-600">{rec.nomineeDOB || '-'}</td>
                    <td className="text-xs text-slate-650">{rec.nomineeRelationship || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[150px] truncate" title={rec.emptyColumn}>{rec.emptyColumn || '-'}</td>
                    <td className="text-xs font-mono text-slate-650 max-w-[185px] truncate" title={rec.communication}>{rec.communication || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[120px] truncate">{rec.state || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[120px] truncate">{rec.districtCity || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[200px] truncate" title={rec.address}>{rec.address || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[150px] truncate">{rec.customColumn || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-[200px] truncate">{rec.remarks || '-'}</td>
                    <td className="text-center sticky right-0 z-10 border-l border-[#DDE3EA] sticky-col">
                      <div className="inline-flex gap-2">
                        <button 
                          onClick={() => setEditingRecord(rec)}
                          className="p-1 hover:bg-[#F5F7FA] rounded text-slate-550 hover:text-[var(--accent-primary)] transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(rec.id)}
                          className="p-1 hover:bg-[#F5F7FA] rounded text-slate-555 hover:text-red-650 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={41} className="text-center py-24 text-slate-400 text-xs font-medium">No ledger records decrypted matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {/* Pagination Controls at the Bottom of Vault Data */}
      {renderPagination("bottom")}

      {/* Quick Edit Popup Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE3EA] max-w-3xl w-full rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button 
              onClick={() => setEditingRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 flex items-center justify-center"
            >
              <X size={18} />
            </button>
            <h3 className="font-serif text-xl font-bold text-slate-900 mb-6">Modify Ledger Relationship Entry</h3>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Carpenter Name */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Carpenter Name *</label>
                  <input
                    type="text"
                    required
                    value={editingRecord.nameOfCarpenter || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, nameOfCarpenter: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Category Custom Dropdown */}
                <div className="flex flex-col relative">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Category *</label>
                  <button
                    type="button"
                    onClick={() => setEditCategoryDropdownOpen(!editCategoryDropdownOpen)}
                    className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
                  >
                    <span>{editingRecord.category}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>

                  {editCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setEditCategoryDropdownOpen(false)} />
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDE3EA] rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto p-2.5 space-y-1 animate-fadeIn"
                        style={{ minWidth: '200px' }}
                      >
                        <input
                          type="text"
                          placeholder="Search category..."
                          value={editCategorySearch}
                          onChange={(e) => setEditCategorySearch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-primary)] mb-2 font-semibold"
                        />
                        {categories
                          .filter(c => c.toLowerCase().includes(editCategorySearch.toLowerCase()))
                          .map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setEditingRecord({...editingRecord, category: c});
                                setEditCategoryDropdownOpen(false);
                                setEditCategorySearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${editingRecord.category === c ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                            >
                              {c}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>

                {/* Name of Organization */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Organization / Shop</label>
                  <input
                    type="text"
                    value={editingRecord.nameOfOrganization || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, nameOfOrganization: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Specialization / Expertise</label>
                  <input
                    type="text"
                    value={editingRecord.specialization || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, specialization: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Communication */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Communication Numbers / Emails</label>
                  <input
                    type="text"
                    value={editingRecord.communication || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, communication: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* State Custom Dropdown */}
                <div className="flex flex-col relative">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">State Jurisdiction</label>
                  <button
                    type="button"
                    onClick={() => setEditStateDropdownOpen(!editStateDropdownOpen)}
                    className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
                  >
                    <span>{editingRecord.state || '-- Select State --'}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>

                  {editStateDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setEditStateDropdownOpen(false)} />
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDE3EA] rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto p-2.5 space-y-1 animate-fadeIn"
                        style={{ minWidth: '200px' }}
                      >
                        <input
                          type="text"
                          placeholder="Search state..."
                          value={editStateSearch}
                          onChange={(e) => setEditStateSearch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-primary)] mb-2 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord({...editingRecord, state: ''});
                            setEditStateDropdownOpen(false);
                            setEditStateSearch('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F5F7FA]"
                        >
                          -- None --
                        </button>
                        {INDIAN_STATES
                          .filter(s => s.toLowerCase().includes(editStateSearch.toLowerCase()))
                          .map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setEditingRecord({...editingRecord, state: s});
                                setEditStateDropdownOpen(false);
                                setEditStateSearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${editingRecord.state === s ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                            >
                              {s}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>

                {/* District/City */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">District / City</label>
                  <input
                    type="text"
                    value={editingRecord.districtCity || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, districtCity: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Address</label>
                  <input
                    type="text"
                    value={editingRecord.address || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, address: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Custom Column */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Custom Column</label>
                  <input
                    type="text"
                    value={editingRecord.customColumn || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, customColumn: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Remarks</label>
                  <input
                    type="text"
                    value={editingRecord.remarks || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, remarks: e.target.value})}
                    className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {/* Vault Metadata Grid */}
                <div className="md:col-span-2 border-t border-[#DDE3EA] pt-6 mt-2">
                  <h4 className="font-serif text-sm font-bold text-[var(--accent-primary)] mb-4 uppercase tracking-wider">Carpenter Vault Decrypted Fields (21 fields)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {VAULT_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 block">{f.label}</label>
                        <input
                          type="text"
                          value={editingRecord[f.key] || ''}
                          onChange={(e) => setEditingRecord({...editingRecord, [f.key]: e.target.value})}
                          className="w-full bg-[#F5F7FA] border border-[#DDE3EA] focus:border-[var(--accent-primary)]/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#DDE3EA]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="btn-frosted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vault Details Decryption Modal */}
      {activeVaultRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE3EA] max-w-4xl w-full rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button 
              onClick={() => setActiveVaultRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 flex items-center justify-center"
            >
              <X size={18} />
            </button>
            
            <div className="border-b border-[#DDE3EA] pb-4 mb-6">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Vault Record Decrypted
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-2">
                {activeVaultRecord.nameOfCarpenter || 'Unnamed Carpenter'}
              </h3>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-medium">
                Detailed Enrollment & Metadata Vault Dossier
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {VAULT_FIELDS.map((f) => (
                <div key={f.key} className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">
                    {f.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-1 block">
                    {activeVaultRecord[f.key] || <span className="text-slate-300 italic font-normal text-xs">Not Entered</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#DDE3EA] mt-8">
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(activeVaultRecord);
                  setActiveVaultRecord(null);
                }}
                className="btn-gold text-xs font-semibold flex items-center gap-1.5"
              >
                <Edit size={13} />
                <span>Edit Vault Dossier</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveVaultRecord(null)}
                className="btn-frosted text-xs font-semibold"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
