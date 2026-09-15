import React, { useMemo } from 'react';
import { Job, JobStatus } from '../types';

interface StatusCountsProps {
  jobs: Job[];
}

export const StatusCounts: React.FC<StatusCountsProps> = ({ jobs }) => {
  const counts = useMemo(() => {
    const summary: Record<JobStatus | 'all', number> = {
      all: jobs.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    jobs.forEach((job) => {
      if (summary[job.status] !== undefined) {
        summary[job.status] += 1;
      }
    });

    return summary;
  }, [jobs]);

  return (
    <div className="status-counts-container">
      <div className="stat-card stat-total">
        <span className="stat-label">Total Jobs</span>
        <span className="stat-value">{counts.all}</span>
      </div>
      <div className="stat-card stat-pending">
        <span className="stat-label">Pending</span>
        <span className="stat-value">{counts.pending}</span>
      </div>
      <div className="stat-card stat-running">
        <span className="stat-label">Running</span>
        <span className="stat-value">{counts.running}</span>
      </div>
      <div className="stat-card stat-completed">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{counts.completed}</span>
      </div>
      <div className="stat-card stat-failed">
        <span className="stat-label">Failed</span>
        <span className="stat-value">{counts.failed}</span>
      </div>
    </div>
  );
};
