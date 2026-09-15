import React, { useState } from 'react';
import { CreateJobInput } from '../types';

interface JobFormProps {
  onCreateJob: (input: CreateJobInput) => Promise<boolean>;
}

export const JobForm: React.FC<JobFormProps> = ({ onCreateJob }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Job title is required');
      return;
    }
    if (!type.trim()) {
      setFormError('Job type is required');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    const success = await onCreateJob({ title: title.trim(), type: type.trim() });
    setIsSubmitting(false);

    if (success) {
      setTitle('');
      setType('');
    }
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <h3 className="form-title">+ Create New Job</h3>
      {formError && <div className="form-error">{formError}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="title">Job Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Send Welcome Email"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={120}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Job Type</label>
          <input
            id="type"
            type="text"
            placeholder="e.g. Email / Report / Export"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
            maxLength={120}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </form>
  );
};
