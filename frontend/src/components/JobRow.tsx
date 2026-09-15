import React from 'react';
import { Job, JobStatus } from '../types';

interface JobRowProps {
  serialNumber: number;
  job: Job;
  actionLoading?: string;
  onUpdateStatus: (id: string, status: JobStatus) => Promise<boolean>;
  onDeleteJob: (id: string) => Promise<boolean>;
}

export const JobRow: React.FC<JobRowProps> = ({
  serialNumber,
  job,
  actionLoading,
  onUpdateStatus,
  onDeleteJob,
}) => {
  const isLoading = Boolean(actionLoading);
  const loadingText = typeof actionLoading === 'string' ? actionLoading : '';

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' ' + d.toLocaleDateString();
    } catch {
      return String(dateString || '');
    }
  };

  return (
    <tr className={`job-row status-${job.status}`}>
      <td className="cell-sno">{serialNumber}</td>
      <td className="cell-title font-medium">{String(job.title || '')}</td>
      <td className="cell-type">
        <span className="type-tag">{String(job.type || '')}</span>
      </td>
      <td className="cell-status">
        <span className={`status-badge badge-${job.status}`}>
          {String(job.status || '').toUpperCase()}
        </span>
      </td>
      <td className="cell-date text-muted">{formatDate(job.createdAt)}</td>
      <td className="cell-actions">
        {isLoading ? (
          <span className="loading-spinner-inline">{loadingText}</span>
        ) : (
          <div className="action-buttons">
            {job.status === 'pending' && (
              <button
                className="btn btn-action btn-run"
                onClick={() => onUpdateStatus(job.id, 'running')}
                title="Transition job to running state"
              >
                Run
              </button>
            )}

            {job.status === 'running' && (
              <>
                <button
                  className="btn btn-action btn-complete"
                  onClick={() => onUpdateStatus(job.id, 'completed')}
                  title="Transition job to completed state"
                >
                  Complete
                </button>
                <button
                  className="btn btn-action btn-fail"
                  onClick={() => onUpdateStatus(job.id, 'failed')}
                  title="Transition job to failed state"
                >
                  Fail
                </button>
              </>
            )}

            <button
              className="btn btn-action btn-delete"
              onClick={() => onDeleteJob(job.id)}
              title="Delete job"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
