import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Job } from './entities/job.entity';
import { JobAuditLog } from './entities/job-audit-log.entity';
import { JobStatus } from './enums/job-status.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

// State transition rules mapping target status to allowed previous statuses
const ALLOWED_PREVIOUS_STATUSES: Record<JobStatus, JobStatus[]> = {
  [JobStatus.RUNNING]: [JobStatus.PENDING],
  [JobStatus.COMPLETED]: [JobStatus.RUNNING],
  [JobStatus.FAILED]: [JobStatus.RUNNING],
  [JobStatus.PENDING]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobAuditLog)
    private readonly auditRepository: Repository<JobAuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new job. Always defaults status to PENDING.
   */
  async create(createJobDto: CreateJobDto): Promise<Job> {
    const newJob = this.jobRepository.create({
      title: createJobDto.title.trim(),
      type: createJobDto.type.trim(),
      status: JobStatus.PENDING,
    });
    return await this.jobRepository.save(newJob);
  }

  /**
   * Retrieve all jobs sorted by createdAt DESC.
   */
  async findAll(): Promise<Job[]> {
    return await this.jobRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Concurrency-Safe Status Update using Database-Level Atomic Conditional UPDATE.
   * Enforces transition rules strictly at database level and records audit trail.
   */
  async updateStatus(
    id: string,
    updateJobStatusDto: UpdateJobStatusDto,
  ): Promise<Job> {
    const newStatus = updateJobStatusDto.status;
    const allowedPrevious = ALLOWED_PREVIOUS_STATUSES[newStatus];

    // Check if target status has any valid previous states
    if (!allowedPrevious || allowedPrevious.length === 0) {
      throw new BadRequestException(
        `Job cannot be set to status '${newStatus}' directly`,
      );
    }

    // Execute atomic conditional UPDATE inside a database transaction
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Direct SQL conditional UPDATE query:
      // UPDATE jobs SET status = :newStatus, updated_at = NOW() WHERE id = :id AND status IN (:...allowedPrevious)
      const updateResult = await transactionalEntityManager
        .createQueryBuilder()
        .update(Job)
        .set({
          status: newStatus,
          updatedAt: () => 'CURRENT_TIMESTAMP',
        })
        .where('id = :id', { id })
        .andWhere('status IN (:...allowedPrevious)', { allowedPrevious })
        .returning('*')
        .execute();

      // Check if a row was updated
      if (updateResult.affected && updateResult.affected === 1) {
        const updatedJob = updateResult.raw[0] as Job;

        // Determine previous status for audit trail logging
        const previousStatus = allowedPrevious[0]; // Primary valid preceding state

        // Bonus: Record status transition audit log entry atomically
        const auditLog = transactionalEntityManager.create(JobAuditLog, {
          jobId: id,
          fromStatus: previousStatus,
          toStatus: newStatus,
        });
        await transactionalEntityManager.save(auditLog);

        return updatedJob;
      }

      // 0 rows affected: Check if job exists in database to distinguish 404 vs 409
      const existingJob = await transactionalEntityManager.findOne(Job, {
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException(`Job with ID '${id}' not found`);
      }

      // Job exists, but transition condition failed (invalid state or concurrent update)
      throw new ConflictException(
        `Cannot transition job from state '${existingJob.status}' to '${newStatus}'`,
      );
    });
  }

  /**
   * Delete job by ID.
   */
  async remove(id: string): Promise<{ message: string }> {
    const deleteResult = await this.jobRepository.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }

    return { message: `Job with ID '${id}' successfully deleted` };
  }
}
