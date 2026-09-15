import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('job_status_transitions')
export class JobAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id', nullable: false })
  jobId: string;

  @Column({ type: 'varchar', length: 50, name: 'from_status', nullable: false })
  fromStatus: string;

  @Column({ type: 'varchar', length: 50, name: 'to_status', nullable: false })
  toStatus: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'changed_at' })
  changedAt: Date;
}
