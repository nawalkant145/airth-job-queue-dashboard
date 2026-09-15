import React from 'react';
import { Job, JobStatus } from '../types';
import { JobRow } from './JobRow';

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  actionLoading: Record<string, string>;
  onUpdateStatus: (id: string, status: JobStatus) => Promise<boolean>;
  onDeleteJob: (id: string) => Promise<boolean>;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  loading,
  actionLoading,
  onUpdateStatus,
  onDeleteJob,
}) => {
  if (loading && jobs.length === 0) {
    return (
      <div className="table-state-box">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (!loading && jobs.length === 0) {
    return (
      <div className="table-state-box empty-state">
        <p className="empty-title">No jobs found</p>
        <p className="empty-subtext">Create a job above to get started with queue management.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              actionLoading={actionLoading[job.id]}
              onUpdateStatus={onUpdateStatus}
              onDeleteJob={onDeleteJob}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
