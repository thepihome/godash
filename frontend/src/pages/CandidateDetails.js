import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { FiEdit, FiSave, FiX, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import './CandidateDetails.css';

const CandidateDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [logLimit, setLogLimit] = useState(5);
  const [logSearch, setLogSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [logAction, setLogAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const searchTimeoutRef = useRef(null);

  const { data: candidate, isLoading } = useQuery(
    ['candidate', id],
    () => api.get(`/candidates/${id}`).then(res => res.data),
    {
      onSuccess: (data) => {
        if (data.profile) {
          setProfileData(data.profile);
        }
      }
    }
  );

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(logSearch);
      setLogPage(1); // Reset to first page on search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [logSearch]);

  // Validate date range
  const dateRangeValid = useMemo(() => {
    if (!logDateFrom || !logDateTo) return true;
    return new Date(logDateFrom) <= new Date(logDateTo);
  }, [logDateFrom, logDateTo]);

  // Build activity logs query params
  const activityLogsParams = useMemo(() => {
    const params = new URLSearchParams();
    if (candidate?.profile?.id) {
      params.append('entity_type', 'candidate_profile');
      params.append('entity_id', candidate.profile.id);
    }
    params.append('limit', String(logLimit));
    params.append('offset', String((logPage - 1) * logLimit));
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (logDateFrom) params.append('date_from', logDateFrom);
    if (logDateTo) params.append('date_to', logDateTo);
    if (logAction) params.append('action', logAction);
    return params.toString();
  }, [candidate?.profile?.id, logLimit, logPage, debouncedSearch, logDateFrom, logDateTo, logAction]);

  // Fetch activity logs
  const { 
    data: activityLogsData, 
    isLoading: isLoadingLogs, 
    isError: isErrorLogs,
    error: errorLogs,
    refetch: refetchLogs 
  } = useQuery(
    ['activity-logs', 'candidate_profile', candidate?.profile?.id, activityLogsParams],
    () => {
      if (!candidate?.profile?.id) return { logs: [], total: 0, hasMore: false };
      return api.get(`/activity-logs?${activityLogsParams}`)
        .then(res => {
          // Handle both old format (array) and new format (object)
          if (Array.isArray(res.data)) {
            return { logs: res.data, total: res.data.length, hasMore: false };
          }
          return res.data;
        })
        .catch((err) => {
          console.error('Error fetching activity logs:', err);
          throw err;
        });
    },
    {
      enabled: !!candidate?.profile?.id && (user?.role === 'consultant' || user?.role === 'admin'),
      keepPreviousData: true,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  const activityLogs = activityLogsData?.logs || [];
  const totalLogs = activityLogsData?.total || 0;
  const hasMoreLogs = activityLogsData?.hasMore || false;

  // Calculate pagination
  const canLoadMore = hasMoreLogs && !isLoadingLogs;

  const handleClearFilters = () => {
    setLogSearch('');
    setLogDateFrom('');
    setLogDateTo('');
    setLogAction('');
    setLogPage(1);
    setLogLimit(5);
  };

  const handleLoadMore = () => {
    setLogLimit(prev => prev + 10);
  };

  const handleShowLess = () => {
    setLogLimit(5);
    setLogPage(1);
  };

  const hasActiveFilters = debouncedSearch || logDateFrom || logDateTo || logAction;
  const showingMoreThanDefault = logLimit > 5;

  const updateProfileMutation = useMutation(
    (data) => api.post('/candidate-profiles', { user_id: parseInt(id), ...data }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['candidate', id]);
        queryClient.invalidateQueries(['activity-logs']);
        setIsEditing(false);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleCancel = () => {
    if (candidate?.profile) {
      setProfileData(candidate.profile);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="loading">Loading candidate details...</div>;
  }

  if (!candidate) {
    return <div className="error">Candidate not found</div>;
  }

  const profile = candidate.profile || {};
  const canEdit = user?.role === 'admin' || user?.role === 'consultant' || user?.id === parseInt(id);

  return (
    <div className="candidate-details">
      <div className="candidate-header">
        <h1>{candidate.first_name} {candidate.last_name}</h1>
        {canEdit && !isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <FiEdit /> Edit Profile
          </button>
        )}
      </div>
      
      <div className="candidate-info">
        <p><strong>Email:</strong> {candidate.email}</p>
        {candidate.phone && <p><strong>Phone:</strong> {candidate.phone}</p>}
      </div>

      <div className="candidate-section">
        <div className="section-header">
          <h2>Profile Information</h2>
          {isEditing && (
            <div className="edit-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={updateProfileMutation.isLoading}>
                <FiSave /> {updateProfileMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <FiX /> Cancel
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="profile-edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profileData.date_of_birth || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  name="years_of_experience"
                  value={profileData.years_of_experience || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={profileData.address || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={profileData.state || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={profileData.country || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  name="zip_code"
                  value={profileData.zip_code || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Job Title</label>
                <input
                  type="text"
                  name="current_job_title"
                  value={profileData.current_job_title || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Current Company</label>
                <input
                  type="text"
                  name="current_company"
                  value={profileData.current_company || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={profileData.linkedin_url || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Portfolio URL</label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={profileData.portfolio_url || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>GitHub URL</label>
                <input
                  type="url"
                  name="github_url"
                  value={profileData.github_url || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Availability</label>
                <select
                  name="availability"
                  value={profileData.availability || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select availability</option>
                  <option value="available">Available</option>
                  <option value="not-available">Not Available</option>
                  <option value="available-soon">Available Soon</option>
                  <option value="contract-only">Contract Only</option>
                </select>
              </div>
              <div className="form-group">
                <label>Work Authorization</label>
                <input
                  type="text"
                  name="work_authorization"
                  value={profileData.work_authorization || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., US Citizen, H1B, etc."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expected Salary Min</label>
                <input
                  type="number"
                  name="expected_salary_min"
                  value={profileData.expected_salary_min || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Expected Salary Max</label>
                <input
                  type="number"
                  name="expected_salary_max"
                  value={profileData.expected_salary_max || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="willing_to_relocate"
                  checked={profileData.willing_to_relocate || false}
                  onChange={handleInputChange}
                />
                Willing to Relocate
              </label>
            </div>

            <div className="form-group">
              <label>Preferred Locations (comma-separated)</label>
              <input
                type="text"
                name="preferred_locations"
                value={Array.isArray(profileData.preferred_locations) 
                  ? profileData.preferred_locations.join(', ') 
                  : (profileData.preferred_locations || '')}
                onChange={(e) => handleArrayChange('preferred_locations', e.target.value)}
                placeholder="e.g., San Francisco, New York, Remote"
              />
            </div>

            <div className="form-group">
              <label>Professional Summary</label>
              <textarea
                name="summary"
                value={profileData.summary || ''}
                onChange={handleInputChange}
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="additional_notes"
                value={profileData.additional_notes || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="profile-grid">
            {profile.date_of_birth && (
              <div className="profile-item">
                <strong>Date of Birth:</strong> {new Date(profile.date_of_birth).toLocaleDateString()}
              </div>
            )}
            {profile.years_of_experience && (
              <div className="profile-item">
                <strong>Experience:</strong> {profile.years_of_experience} years
              </div>
            )}
            {(profile.address || profile.city || profile.state || profile.country) && (
              <div className="profile-item">
                <strong>Address:</strong> {[profile.address, profile.city, profile.state, profile.country, profile.zip_code].filter(Boolean).join(', ')}
              </div>
            )}
            {profile.current_job_title && (
              <div className="profile-item">
                <strong>Current Position:</strong> {profile.current_job_title} {profile.current_company && `at ${profile.current_company}`}
              </div>
            )}
            {profile.availability && (
              <div className="profile-item">
                <strong>Availability:</strong> {profile.availability.replace('-', ' ')}
              </div>
            )}
            {profile.linkedin_url && (
              <div className="profile-item">
                <strong>LinkedIn:</strong> <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">{profile.linkedin_url}</a>
              </div>
            )}
            {profile.portfolio_url && (
              <div className="profile-item">
                <strong>Portfolio:</strong> <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">{profile.portfolio_url}</a>
              </div>
            )}
            {profile.github_url && (
              <div className="profile-item">
                <strong>GitHub:</strong> <a href={profile.github_url} target="_blank" rel="noopener noreferrer">{profile.github_url}</a>
              </div>
            )}
            {(profile.expected_salary_min || profile.expected_salary_max) && (
              <div className="profile-item">
                <strong>Expected Salary:</strong> ${profile.expected_salary_min || 'N/A'} - ${profile.expected_salary_max || 'N/A'}
              </div>
            )}
            {profile.work_authorization && (
              <div className="profile-item">
                <strong>Work Authorization:</strong> {profile.work_authorization}
              </div>
            )}
            <div className="profile-item">
              <strong>Willing to Relocate:</strong> {profile.willing_to_relocate ? 'Yes' : 'No'}
            </div>
            {profile.preferred_locations && (Array.isArray(profile.preferred_locations) ? profile.preferred_locations.length > 0 : profile.preferred_locations) && (
              <div className="profile-item">
                <strong>Preferred Locations:</strong> {Array.isArray(profile.preferred_locations) ? profile.preferred_locations.join(', ') : profile.preferred_locations}
              </div>
            )}
            {profile.summary && (
              <div className="profile-item full-width">
                <strong>Professional Summary:</strong>
                <p>{profile.summary}</p>
              </div>
            )}
            {profile.additional_notes && (
              <div className="profile-item full-width">
                <strong>Additional Notes:</strong>
                <p>{profile.additional_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="candidate-section">
        <h2>Resumes ({candidate.resumes ? candidate.resumes.length : 0}/3)</h2>
        {candidate.resumes && candidate.resumes.length > 0 ? (
          <div className="resumes-list">
            {candidate.resumes.map((resume) => (
              <div key={resume.id} className="resume-item">
                <div className="resume-item-header">
                  <h4>{resume.file_name || `Resume ${resume.id}`}</h4>
                  <span className="resume-meta">
                    {resume.file_size && (
                      <span>{(resume.file_size / 1024).toFixed(2)} KB</span>
                    )}
                    {resume.uploaded_at && (
                      <span> • Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}</span>
                    )}
                  </span>
                </div>
                {resume.skills && resume.skills.length > 0 && (
                  <div className="skills-list">
                    <strong>Skills:</strong>
                    {resume.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
                {resume.experience_years && (
                  <p><strong>Experience:</strong> {resume.experience_years} years</p>
                )}
                {resume.education && (
                  <p><strong>Education:</strong> {resume.education}</p>
                )}
                {resume.summary && (
                  <p><strong>Summary:</strong> {resume.summary}</p>
                )}
                {resume.file_path && (
                  <a
                    href={`http://localhost:5023/${resume.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '10px', display: 'inline-block' }}
                  >
                    View Resume
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No resumes uploaded</p>
        )}
      </div>

      <div className="candidate-section">
        <h2>Job Matches</h2>
        {candidate.matches && candidate.matches.length > 0 ? (
          <div className="matches-list">
            {candidate.matches.map((match) => (
              <div key={match.id} className="match-item">
                <h4>{match.title}</h4>
                <p>Company: {match.company}</p>
                <p>Match Score: <strong>{match.match_score}%</strong></p>
                <p>Status: <span className="badge badge-info">{match.status}</span></p>
              </div>
            ))}
          </div>
        ) : (
          <p>No matches yet</p>
        )}
      </div>

      <div className="candidate-section">
        <h2>CRM Interactions</h2>
        {candidate.crm_interactions && candidate.crm_interactions.length > 0 ? (
          <div className="crm-list">
            {candidate.crm_interactions.map((interaction) => (
              <div key={interaction.id} className="crm-item">
                <h4>{interaction.interaction_type}</h4>
                <p>Date: {new Date(interaction.interaction_date).toLocaleDateString()}</p>
                {interaction.notes && <p>Notes: {interaction.notes}</p>}
                <p>Status: <span className="badge badge-info">{interaction.status}</span></p>
              </div>
            ))}
          </div>
        ) : (
          <p>No CRM interactions</p>
        )}
      </div>

      {/* Activity History Section */}
      {(user?.role === 'consultant' || user?.role === 'admin') && candidate?.profile?.id && (
        <div className="candidate-section activity-history">
          <div className="activity-history-header">
            <h2>
              <FiClock /> Activity History
            </h2>
            <div className="activity-history-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <FiFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => refetchLogs()}
                disabled={isLoadingLogs}
                aria-label="Refresh activity logs"
                title="Refresh"
              >
                <FiRefreshCw className={isLoadingLogs ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="activity-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>
                    <FiSearch /> Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by description, field, or user..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="filter-input"
                    aria-label="Search activity logs"
                  />
                  {logSearch !== debouncedSearch && (
                    <span className="search-indicator">Searching...</span>
                  )}
                </div>
                <div className="filter-group">
                  <label>Action Type</label>
                  <select
                    value={logAction}
                    onChange={(e) => {
                      setLogAction(e.target.value);
                      setLogPage(1);
                    }}
                    className="filter-select"
                    aria-label="Filter by action type"
                  >
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="view">View</option>
                  </select>
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={logDateFrom}
                    onChange={(e) => {
                      setLogDateFrom(e.target.value);
                      setLogPage(1);
                    }}
                    className="filter-input"
                    max={logDateTo || undefined}
                    aria-label="Filter from date"
                  />
                </div>
                <div className="filter-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={logDateTo}
                    onChange={(e) => {
                      setLogDateTo(e.target.value);
                      setLogPage(1);
                    }}
                    className={`filter-input ${!dateRangeValid ? 'error' : ''}`}
                    min={logDateFrom || undefined}
                    aria-label="Filter to date"
                  />
                  {!dateRangeValid && (
                    <span className="error-message">Date To must be after Date From</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <div className="filter-group">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleClearFilters}
                      style={{ marginTop: '24px' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isErrorLogs ? (
            <div className="activity-error">
              <FiAlertCircle />
              <div>
                <p><strong>Error loading activity logs</strong></p>
                <p>{errorLogs?.response?.data?.error || errorLogs?.message || 'An error occurred'}</p>
                <button className="btn btn-primary btn-sm" onClick={() => refetchLogs()}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            </div>
          ) : isLoadingLogs && !activityLogs ? (
            <div className="activity-loading">
              <div className="spinner"></div>
              <p>Loading activity logs...</p>
            </div>
          ) : activityLogs && activityLogs.length > 0 ? (
            <>
              <div className="activity-stats">
                <span className="activity-count">
                  Showing {activityLogs.length} of {totalLogs} log{totalLogs !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </span>
              </div>
              <div className="activity-list" role="list">
                {activityLogs.map((log) => (
                  <div key={log.id} className="activity-item" role="listitem">
                    <div className="activity-header">
                      <div className="activity-action">
                        <span className={`activity-badge activity-${log.action}`} aria-label={`Action: ${log.action}`}>
                          {log.action}
                        </span>
                        {log.description && (
                          <span className="activity-description">{log.description}</span>
                        )}
                      </div>
                      <div className="activity-meta">
                        {log.user_name && (
                          <span className="activity-user" title={log.user_email}>
                            {log.user_name}
                          </span>
                        )}
                        <span className="activity-time" title={new Date(log.created_at).toISOString()}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {log.field_name && (
                      <div className="activity-change">
                        <strong>{log.field_name}:</strong>
                        <span className="change-old" title={log.old_value || 'Empty value'}>
                          {log.old_value || '(empty)'}
                        </span>
                        <span className="change-arrow" aria-label="changed to">→</span>
                        <span className="change-new" title={log.new_value || 'Empty value'}>
                          {log.new_value || '(empty)'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isLoadingLogs && activityLogs.length > 0 && (
                <div className="activity-loading-more">
                  <div className="spinner-small"></div>
                  <span>Loading more...</span>
                </div>
              )}
              <div className="activity-pagination">
                {showingMoreThanDefault ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleShowLess}
                    disabled={isLoadingLogs}
                  >
                    <FiChevronUp /> Show Less (Top 5)
                  </button>
                ) : canLoadMore ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingLogs}
                  >
                    <FiChevronDown /> Load More ({Math.min(logLimit + 10, totalLogs)} of {totalLogs})
                  </button>
                ) : activityLogs.length < totalLogs ? (
                  <span className="activity-pagination-info">
                    Showing all {activityLogs.length} logs
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="activity-empty">
              <FiClock />
              <p>
                {hasActiveFilters 
                  ? 'No activity logs match your filters. Try adjusting your search criteria.'
                  : 'No activity history available yet.'}
              </p>
              {hasActiveFilters && (
                <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateDetails;
