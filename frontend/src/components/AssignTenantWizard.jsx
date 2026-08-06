import { useState, useEffect } from 'react'
import axios from 'axios'
import './AssignTenantWizard.css'

function AssignTenantWizard({ isOpen, onClose, initialTenantId = null, properties = [], onRefresh }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tenants, setTenants] = useState([]);
  
  // Selection states
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Form state
  const [leaseForm, setLeaseForm] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: '',
    terms: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial data on mount/open
  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset wizard state
      setCurrentStep(1);
      setSelectedTenant(null);
      setSelectedProperty(null);
      setLeaseForm({
        startDate: '',
        endDate: '',
        monthlyRent: '',
        terms: ''
      });
      setError('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Set initial tenant if provided
  useEffect(() => {
    if (initialTenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t._id === initialTenantId || t.id === initialTenantId);
      if (tenant) {
        setSelectedTenant(tenant);
        setCurrentStep(2); // Skip step 1 if tenant is preselected
      }
    }
  }, [initialTenantId, tenants]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch Tenants list
      const tenantsRes = await axios.get('/api/dashboard/tenants');
      const tenantsList = tenantsRes.data.tenants || [];
      setTenants(tenantsList);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch required database resources.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Step 1: Select Tenant
  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setCurrentStep(2);
    setError('');
  };

  // Step 2: Select Property
  const handleSelectProperty = (property) => {
    setSelectedProperty(property);
    // Auto fill monthly rent from property value
    setLeaseForm(prev => ({
      ...prev,
      monthlyRent: property.rentAmount
    }));
    setCurrentStep(3); // Transition directly to lease generation
    setError('');
  };

  // Step 3: Submit Lease Generation
  const handleSubmitLease = async (e) => {
    e.preventDefault();
    if (!selectedTenant || !selectedProperty) {
      setError('Missing tenant or property selection.');
      return;
    }
    if (!leaseForm.startDate || !leaseForm.endDate || !leaseForm.monthlyRent) {
      setError('Please complete all lease contract details.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        propertyId: selectedProperty._id,
        tenantId: selectedTenant._id || selectedTenant.id,
        startDate: leaseForm.startDate,
        endDate: leaseForm.endDate,
        monthlyRent: Number(leaseForm.monthlyRent),
        terms: leaseForm.terms
      };

      const response = await axios.post('/api/dashboard/leases', payload);
      if (response.data.status === 'success') {
        alert('Lease generated and tenant assigned successfully!');
        onRefresh();
        onClose();
      } else {
        setError(response.data.message || 'Failed to generate lease contract.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while saving lease.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Select Tenant',
    'Choose Property',
    'Generate Lease'
  ];

  // Filters tenants based on search input
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wizard-backdrop">
      <div className="wizard-card-modal">
        {/* Header */}
        <div className="wizard-modal-header">
          <div className="header-titles">
            <span className="subtitle-tag">Rentify Workspace Flow</span>
            <h3>Assign Tenant & Generate Lease</h3>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Stepper Progress */}
        <div className="wizard-stepper">
          {stepTitles.map((title, index) => {
            const stepNum = index + 1;
            let stepClass = 'step-node';
            if (currentStep === stepNum) stepClass += ' active';
            else if (currentStep > stepNum) stepClass += ' completed';

            return (
              <div className="step-wrapper" key={title}>
                <div className={stepClass} onClick={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                }}>
                  {currentStep > stepNum ? '✓' : stepNum}
                </div>
                <span className="step-label">{title}</span>
                {index < 2 && <div className={`step-connector ${currentStep > stepNum ? 'completed' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && <div className="wizard-error-alert">{error}</div>}

        {/* Content Body */}
        <div className="wizard-content-body">
          {loading && (
            <div className="wizard-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Processing request...</p>
            </div>
          )}

          {/* STEP 1: SELECT TENANT */}
          {currentStep === 1 && (
            <div className="step-pane animate-pane">
              <h4>Select a Tenant to Lease</h4>
              <div className="search-bar-row">
                <input 
                  type="text" 
                  placeholder="🔍 Search tenants by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredTenants.length === 0 ? (
                <p className="no-data-msg">No matching registered tenants found.</p>
              ) : (
                <div className="wizard-list-container">
                  {filteredTenants.map(t => (
                    <div 
                      key={t._id} 
                      className={`wizard-item-card ${selectedTenant?._id === t._id ? 'selected' : ''}`}
                      onClick={() => handleSelectTenant(t)}
                    >
                      <div className="item-avatar">👤</div>
                      <div className="item-details">
                        <span className="item-title-lbl">{t.name}</span>
                        <span className="item-subtitle-lbl">{t.email}</span>
                      </div>
                      <button className="select-btn-badge">Select</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHOOSE PROPERTY */}
          {currentStep === 2 && (
            <div className="step-pane animate-pane">
              <div className="pane-header-row">
                <h4>Choose Property</h4>
                {selectedTenant && (
                  <span className="selection-badge">
                    Tenant: <strong>{selectedTenant.name}</strong>
                  </span>
                )}
              </div>

              {properties.length === 0 ? (
                <p className="no-data-msg">No properties registered. Add properties first.</p>
              ) : (
                <div className="wizard-list-container grid-view">
                  {properties.map(p => {
                    const vacantRoomsCount = p.rooms ? p.rooms.filter(r => r.status === 'Vacant').length : 0;
                    return (
                      <div 
                        key={p._id} 
                        className={`wizard-grid-card ${selectedProperty?._id === p._id ? 'selected' : ''}`}
                        onClick={() => handleSelectProperty(p)}
                      >
                        <div className="grid-card-icon">🏠</div>
                        <span className="grid-card-title">{p.name}</span>
                        <span className="grid-card-addr">{p.address}</span>
                        <div className="grid-card-stats">
                          <span>Rent: ${p.rentAmount}/mo</span>
                          <span className={`vacancy-status ${vacantRoomsCount > 0 ? 'vacant' : 'full'}`}>
                            {vacantRoomsCount} Vacant Units
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: GENERATE LEASE */}
          {currentStep === 3 && (
            <div className="step-pane animate-pane">
              <h4>Generate Lease Contract</h4>

              <div className="summary-confirm-layout">
                <div className="summary-box-info">
                  <h5>Flow Summary</h5>
                  <div className="summary-item">
                    <span>Tenant:</span>
                    <strong>{selectedTenant?.name} ({selectedTenant?.email})</strong>
                  </div>
                  <div className="summary-item">
                    <span>Property:</span>
                    <strong>{selectedProperty?.name} - {selectedProperty?.address}</strong>
                  </div>
                </div>

                <form onSubmit={handleSubmitLease} className="wizard-lease-form">
                  <div className="form-row">
                    <div className="form-group-col">
                      <label>Lease Start Date *</label>
                      <input 
                        type="date" 
                        value={leaseForm.startDate}
                        onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group-col">
                      <label>Lease End Date *</label>
                      <input 
                        type="date" 
                        value={leaseForm.endDate}
                        onChange={(e) => setLeaseForm({ ...leaseForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group-col">
                    <label>Monthly Rent Amount ($) *</label>
                    <input 
                      type="number" 
                      value={leaseForm.monthlyRent}
                      onChange={(e) => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-col">
                    <label>Terms & Conditions</label>
                    <textarea 
                      rows="3" 
                      placeholder="e.g. No pets allowed. Rent is due on 1st of month. Security deposit is $500..."
                      value={leaseForm.terms}
                      onChange={(e) => setLeaseForm({ ...leaseForm, terms: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="wizard-submit-btn" disabled={loading}>
                    {loading ? 'Generating Contract...' : 'Create & Activate Lease Contract'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="wizard-modal-footer">
          {currentStep > 1 && (
            <button className="back-btn" onClick={() => setCurrentStep(prev => prev - 1)}>
              ← Back
            </button>
          )}
          <span className="step-indicator-label">Step {currentStep} of 3</span>
        </div>
      </div>
    </div>
  );
}

export default AssignTenantWizard;
