import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './jobs/entities/job.entity';
import { JobAuditLog } from './jobs/entities/job-audit-log.entity';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [Job, JobAuditLog],
            synchronize: true, // For development/internship scope
            ssl: dbUrl.includes('neon.tech') || dbUrl.includes('sslmode=require')
              ? { rejectUnauthorized: false }
              : false,
          };
        }

        // Local default PostgreSQL configuration
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'job_queue_db'),
          entities: [Job, JobAuditLog],
          synchronize: true,
        };
      },
    }),
    JobsModule,
  ],
})
export class AppModule {}
