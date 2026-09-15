import { useState, useEffect, useCallback } from 'react';
import { Job, JobStatus, CreateJobInput, ApiError } from '../types';
import { api } from '../api';

export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: { status?: number; message: string } | null;
  actionLoading: Record<string, string>; // jobId -> loading state message e.g. 'Running...'
  refetch: () => Promise<void>;
  createJob: (input: CreateJobInput) => Promise<boolean>;
  updateStatus: (id: string, status: JobStatus) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors on manual or automatic refetch
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      const status = err instanceof ApiError ? err.status : undefined;
      setError({ status, message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const clearError = () => setError(null);

  const createJob = async (input: CreateJobInput): Promise<boolean> => {
    try {
      setError(null);
      await api.createJob(input);
      await fetchJobs();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      const status = err instanceof ApiError ? err.status : undefined;
      setError({ status, message });
      return false;
    }
  };

  const updateStatus = async (id: string, status: JobStatus): Promise<boolean> => {
    const actionLabel = status === 'running' ? 'Running...' : status === 'completed' ? 'Completing...' : 'Failing...';
    try {
      setError(null);
      setActionLoading((prev) => ({ ...prev, [id]: actionLabel }));
      await api.updateJobStatus(id, status);
      await fetchJobs();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update job status';
      const statusNum = err instanceof ApiError ? err.status : undefined;
      
      // On 409 Conflict or error, show conflict notification and refetch latest state
      setError({ status: statusNum, message });
      await fetchJobs();
      return false;
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      setActionLoading((prev) => ({ ...prev, [id]: 'Deleting...' }));
      await api.deleteJob(id);
      await fetchJobs();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete job';
      const statusNum = err instanceof ApiError ? err.status : undefined;
      setError({ status: statusNum, message });
      return false;
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return {
    jobs,
    loading,
    error,
    actionLoading,
    refetch: fetchJobs,
    createJob,
    updateStatus,
    deleteJob,
    clearError,
  };
}
