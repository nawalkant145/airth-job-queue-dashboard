import { useState, useMemo } from 'react';
import { useJobs } from './hooks/useJobs';
import { StatusCounts } from './components/StatusCounts';
import { JobForm } from './components/JobForm';
import { StatusFilter } from './components/StatusFilter';
import { JobList } from './components/JobList';
import { JobStatus } from './types';

export function App() {
  const {
    jobs,
    loading,
    error,
    actionLoading,
    refetch,
    createJob,
    updateStatus,
    deleteJob,
    clearError,
  } = useJobs();

  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'all'>('all');

  // Client-side filtering as specified in assignment requirements
  const filteredJobs = useMemo(() => {
    if (selectedStatus === 'all') return jobs;
    return jobs.filter((job) => job.status === selectedStatus);
  }, [jobs, selectedStatus]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="header-title">⚡ Mini Job Queue Dashboard</h1>
          <p className="header-subtitle">
            Real-time queue tracking with database-level atomic concurrency control
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => refetch()} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Queue'}
        </button>
      </header>

      {/* API Error / Concurrency Conflict Alert Banner */}
      {error && (
        <div className={`alert-banner ${error.status === 409 ? 'alert-conflict' : 'alert-error'}`}>
          <div className="alert-content">
            <span className="alert-icon">{error.status === 409 ? '⚠️ Concurrency Conflict (409):' : '❌ Error:'}</span>
            <span className="alert-message">{error.message}</span>
          </div>
          <button className="alert-close" onClick={clearError}>
            &times;
          </button>
        </div>
      )}

      {/* Metric Cards Summary */}
      <StatusCounts jobs={jobs} />

      {/* Main Content Grid */}
      <div className="dashboard-main">
        {/* Left Column: Create Form */}
        <section className="card-section form-section">
          <JobForm onCreateJob={createJob} />
        </section>

        {/* Right Column: Job List Table with Filter */}
        <section className="card-section list-section">
          <div className="section-header">
            <h2>Job Queue ({filteredJobs.length})</h2>
            <StatusFilter
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />
          </div>

          <JobList
            jobs={filteredJobs}
            loading={loading}
            actionLoading={actionLoading}
            onUpdateStatus={updateStatus}
            onDeleteJob={deleteJob}
          />
        </section>
      </div>
    </div>
  );
}

export default App;
