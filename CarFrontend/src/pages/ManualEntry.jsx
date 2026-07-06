import React, { useState, useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { 
  FileText, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Undo
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

const INITIAL_STATE = {
  nameOfCarpenter: '',
  nameOfOrganization: '',
  category: 'Other',
  specialization: '',
  communication: '',
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
  nomineeName: '',
  nomineeGender: '',
  nomineeDOB: '',
  nomineeRelationship: '',
  emptyColumn: ''
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

export default function ManualEntry() {
  const { addRecord } = useVaultStore();
  const [form, setForm] = useState(INITIAL_STATE);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  useEffect(() => {
    const cachedDraft = localStorage.getItem('vault_draft_carpenter_record');
    if (cachedDraft) {
      try {
        setForm(JSON.parse(cachedDraft));
        setIsDraftLoaded(true);
      } catch (err) {
        console.error('Failed to parse cached carpenter draft:', err);
      }
    }
  }, []);

  const handleInputChange = (key, val) => {
    const updatedForm = { ...form, [key]: val };
    setForm(updatedForm);
    localStorage.setItem('vault_draft_carpenter_record', JSON.stringify(updatedForm));
    setFeedback({ type: '', msg: '' });
  };

  const handleClearDraft = () => {
    if (confirm('Clear current drafts?')) {
      setForm(INITIAL_STATE);
      localStorage.removeItem('vault_draft_carpenter_record');
      setIsDraftLoaded(false);
      setFeedback({ type: 'info', msg: 'Draft memory purged.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!form.nameOfCarpenter) {
      setFeedback({ 
        type: 'error', 
        msg: 'Please provide the carpenter name.' 
      });
      return;
    }

    try {
      await addRecord(form);
      setForm(INITIAL_STATE);
      localStorage.removeItem('vault_draft_carpenter_record');
      setIsDraftLoaded(false);
      setFeedback({ 
        type: 'success', 
        msg: 'Record successfully committed to the primary carpenter ledger.' 
      });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const categories = ['Master Carpenter', 'Apprentice', 'Cabinet Maker', 'Framer', 'Other'];

  return (
    <div className="space-y-6 pb-10 text-slate-800">
      
      {/* Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-slate-900">
          Manual <span className="font-normal italic text-[var(--accent-primary)]">Vault Ledger</span>
        </h2>
        <p className="text-slate-550 text-xs mt-1 uppercase tracking-wider font-medium">
          Log high value carpenter profiles directly. Forms are auto-saved in local memory drafts.
        </p>
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-3xl space-y-6">
          
          {feedback.msg && (
            <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-650' :
              'bg-[var(--accent-glow)] border-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 size={16} />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {isDraftLoaded && !feedback.msg && (
            <div className="p-3 bg-[var(--accent-glow)] border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-xl text-xs flex justify-between items-center font-semibold">
              <span>Draft configuration restored from local archive cache.</span>
              <button 
                onClick={handleClearDraft} 
                className="text-[10px] uppercase font-bold text-red-650 hover:text-red-750 transition-colors"
              >
                Purge Draft
              </button>
            </div>
          )}

          {/* Manual Entry Form Card */}
          <div className="vault-card">
            <div className="flex items-center gap-2 border-b border-[#DDE3EA] pb-4 mb-6">
              <FileText className="text-[var(--accent-primary)]" size={16} />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Carpenter Profile Metadata Matrix</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Carpenter Name */}
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Carpenter Name *</label>
                  <input
                    type="text"
                    required
                    value={form.nameOfCarpenter}
                    onChange={(e) => handleInputChange('nameOfCarpenter', e.target.value)}
                    placeholder="Full professional name"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col relative">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Category Designation *</label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
                  >
                    <span>{form.category}</span>
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
                        {categories
                          .filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                handleInputChange('category', c);
                                setCategoryDropdownOpen(false);
                                setCategorySearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${form.category === c ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
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
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Organization / Wood Shop Name</label>
                  <input
                    type="text"
                    value={form.nameOfOrganization}
                    onChange={(e) => handleInputChange('nameOfOrganization', e.target.value)}
                    placeholder="Company or Woodworking shop name"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Specialization */}
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mb-2">Specialization / Skillset</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    placeholder="e.g. Modular Kitchens, Teak Carving"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Communication */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mb-2">Communication Details (Phone numbers / Email)</label>
                  <input
                    type="text"
                    value={form.communication}
                    onChange={(e) => handleInputChange('communication', e.target.value)}
                    placeholder="e.g. 9876543210, mail@carpenter.com"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* State */}
                <div className="flex flex-col relative">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">State Jurisdiction</label>
                  <button
                    type="button"
                    onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                    className="bg-[#F5F7FA] border border-[#DDE3EA] hover:border-[var(--accent-primary)]/40 text-slate-800 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] font-semibold flex justify-between items-center w-full shadow-sm text-left transition-all"
                  >
                    <span>{form.state || '-- Select State --'}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>

                  {stateDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setStateDropdownOpen(false)} />
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
                            handleInputChange('state', '');
                            setStateDropdownOpen(false);
                            setStateSearch('');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${!form.state ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
                        >
                          -- Select State --
                        </button>
                        {INDIAN_STATES
                          .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                          .map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                handleInputChange('state', s);
                                setStateDropdownOpen(false);
                                setStateSearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold ${form.state === s ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold' : 'text-slate-700 hover:bg-[#F5F7FA] transition-colors'}`}
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
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">District / City</label>
                  <input
                    type="text"
                    value={form.districtCity}
                    onChange={(e) => handleInputChange('districtCity', e.target.value)}
                    placeholder="HQ city location"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Street Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Plot no, landmark details..."
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Custom Column */}
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mb-2">Custom Value</label>
                  <input
                    type="text"
                    value={form.customColumn}
                    onChange={(e) => handleInputChange('customColumn', e.target.value)}
                    placeholder="Extra identifiers"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Remarks */}
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Remarks</label>
                  <input
                    type="text"
                    value={form.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Additional context"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Certificate Link */}
                <div className="flex flex-col md:col-span-2 border-t border-[#DDE3EA]/40 pt-4">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Certificate Document Link</label>
                  <input
                    type="text"
                    value={form.certificateLink}
                    onChange={(e) => handleInputChange('certificateLink', e.target.value)}
                    placeholder="e.g. CAN_39599502-27j8dnaf..."
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Insurance Links */}
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Primary Insurance Link</label>
                  <input
                    type="text"
                    value={form.insuranceLink1}
                    onChange={(e) => handleInputChange('insuranceLink1', e.target.value)}
                    placeholder="Enter link/text for Primary Insurance"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Secondary Insurance Link</label>
                  <input
                    type="text"
                    value={form.insuranceLink2}
                    onChange={(e) => handleInputChange('insuranceLink2', e.target.value)}
                    placeholder="Enter link/text for Secondary Insurance"
                    className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                  />
                </div>

                {/* Additional Vault Metadata Section */}
                <div className="md:col-span-2 border-t border-[#DDE3EA] pt-6 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif text-sm font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                      Additional Carpenter Vault Fields (21 fields)
                    </h4>
                    <span className="text-[10px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-bold uppercase tracking-wider">
                      Vault
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {VAULT_FIELDS.map((f) => (
                      <div key={f.key} className="flex flex-col">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          value={form[f.key] || ''}
                          onChange={(e) => handleInputChange(f.key, e.target.value)}
                          placeholder={`Enter ${f.label}`}
                          className="bg-[#F5F7FA] border border-[#DDE3EA] text-slate-800 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[var(--accent-primary)]/80 focus:ring-1 focus:ring-[var(--accent-primary)]/20 font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* CTA Footer */}
              <div className="border-t border-[#DDE3EA] pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="btn-frosted text-sm font-semibold flex items-center gap-2"
                >
                  <Undo size={14} />
                  <span>Discard Ledger Form</span>
                </button>
                <button
                  type="submit"
                  className="btn-gold text-sm font-semibold flex items-center gap-2"
                >
                  <Save size={14} />
                  <span>Log relationship entry</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
