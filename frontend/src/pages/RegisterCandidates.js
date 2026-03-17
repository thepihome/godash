import React from 'react';
import { useQuery } from 'react-query';
import api from '../config/api';
import './Candidates.css';

const RegisterCandidates = () => {
  const { data: rows = [], isLoading, isError, error } = useQuery(
    ['register-candidates'],
    () => api.get('/register-candidates').then(res => res.data),
    { refetchOnWindowFocus: false, staleTime: 30000 }
  );

  if (isLoading) {
    return <div className="loading">Loading register candidates...</div>;
  }

  if (isError) {
    return (
      <div className="loading">
        Failed to load register candidates: {error?.response?.data?.error || error?.message}
      </div>
    );
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="candidates-page">
      <div className="page-header">
        <h1>Register</h1>
      </div>
      <div className="candidates-table-container">
        {rows.length === 0 ? (
          <div className="empty-state">No records found in register_candidates</div>
        ) : (
          <table className="table candidates-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || JSON.stringify(row)}>
                  {columns.map((col) => (
                    <td key={col}>
                      {row[col] === null || typeof row[col] === 'undefined'
                        ? ''
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RegisterCandidates;

