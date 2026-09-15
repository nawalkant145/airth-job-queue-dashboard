import { useState, useMemo, useEffect } from 'react';
import { useJobs } from './hooks/useJobs';
import { StatusCounts } from './components/StatusCounts';
import { JobForm } from './components/JobForm';
import { StatusFilter } from './components/StatusFilter';
import { JobList } from './components/JobList';
import { Pagination } from './components/Pagination';
import { JobStatus } from './types';

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter jobs by selected status
  const filteredJobs = useMemo(() => {
    if (selectedStatus === 'all') return jobs;
    return jobs.filter((job) => job.status === selectedStatus);
  }, [jobs, selectedStatus]);

  // Calculate total pages for the filtered jobs
  const totalPages = useMemo(() => {
    return Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) || 1;
  }, [filteredJobs.length]);

  // Automatically adjust current page if current page exceeds totalPages (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Handle status filter change - resets to page 1
  const handleStatusFilterChange = (status: JobStatus | 'all') => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Slice paginated jobs for the current page
  const paginatedJobs = useMemo(() => {
    const validPage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage, totalPages]);

  // Start index for S.No. calculation across pages
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  // Handle job creation - stay/reset to page 1 to show newest job
  const handleCreateJob = async (input: Parameters<typeof createJob>[0]) => {
    const success = await createJob(input);
    if (success) {
      setCurrentPage(1);
    }
    return success;
  };

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
            <span className="alert-message">
              {typeof error.message === 'string' ? error.message : JSON.stringify(error.message)}
            </span>
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
          <JobForm onCreateJob={handleCreateJob} />
        </section>

        {/* Right Column: Job List Table with Filter & Pagination */}
        <section className="card-section list-section">
          <div className="section-header">
            <h2>Job Queue ({filteredJobs.length})</h2>
            <StatusFilter
              selectedStatus={selectedStatus}
              onSelectStatus={handleStatusFilterChange}
            />
          </div>

          <JobList
            jobs={paginatedJobs}
            loading={loading}
            actionLoading={actionLoading}
            startIndex={startIndex}
            onUpdateStatus={updateStatus}
            onDeleteJob={deleteJob}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredJobs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </section>
      </div>
    </div>
  );
}

export default App;
