import React from 'react';
import { JobStatus } from '../types';

interface StatusFilterProps {
  selectedStatus: JobStatus | 'all';
  onSelectStatus: (status: JobStatus | 'all') => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="filter-group">
      <label htmlFor="status-filter" className="filter-label">
        Filter by Status:
      </label>
      <select
        id="status-filter"
        value={selectedStatus}
        onChange={(e) => onSelectStatus(e.target.value as JobStatus | 'all')}
        className="filter-select"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
};
