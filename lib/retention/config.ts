/**
 * Data Retention Policy Configuration
 * 
 * Defines retention periods for different types of data in the system.
 * Supports archival of old data to maintain database performance.
 */

export interface RetentionPolicyConfig {
  /**
   * Retention period for versioned records in days
   * After this period, records will be archived
   */
  versionedRecordsRetentionDays: number;

  /**
   * Retention period for audit logs in days
   * After this period, logs will be archived
   */
  auditLogsRetentionDays: number;

  /**
   * Retention period for completed meal orders in days
   * After this period, orders will be archived
   */
  completedOrdersRetentionDays: number;

  /**
   * Whether archival is enabled
   */
  archivalEnabled: boolean;

  /**
   * Hour of day (0-23) when archival job should run
   * Scheduled during low-usage periods
   */
  archivalScheduleHour: number;
}

/**
 * Default retention policy configuration
 * Can be overridden via environment variables
 */
export const defaultRetentionPolicy: RetentionPolicyConfig = {
  // Keep versioned records for 1 year by default
  versionedRecordsRetentionDays: parseInt(
    process.env.RETENTION_VERSIONED_RECORDS_DAYS || '365',
    10
  ),

  // Keep audit logs for 2 years by default
  auditLogsRetentionDays: parseInt(
    process.env.RETENTION_AUDIT_LOGS_DAYS || '730',
    10
  ),

  // Keep completed meal orders for 90 days by default
  completedOrdersRetentionDays: parseInt(
    process.env.RETENTION_COMPLETED_ORDERS_DAYS || '90',
    10
  ),

  // Archival enabled by default in production
  archivalEnabled: process.env.ARCHIVAL_ENABLED === 'true' || process.env.NODE_ENV === 'production',

  // Run archival at 2 AM by default (low-usage period)
  archivalScheduleHour: parseInt(
    process.env.ARCHIVAL_SCHEDULE_HOUR || '2',
    10
  ),
};

/**
 * Get the current retention policy configuration
 */
export function getRetentionPolicy(): RetentionPolicyConfig {
  return defaultRetentionPolicy;
}

/**
 * Calculate the cutoff date for a given retention period
 * @param retentionDays Number of days to retain data
 * @returns Date before which data should be archived
 */
export function getArchivalCutoffDate(retentionDays: number): Date {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  cutoffDate.setHours(0, 0, 0, 0); // Start of day
  return cutoffDate;
}

/**
 * Check if archival should run based on current time and schedule
 * @param config Retention policy configuration
 * @returns true if archival should run now
 */
export function shouldRunArchival(config: RetentionPolicyConfig): boolean {
  if (!config.archivalEnabled) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  
  // Run if current hour matches scheduled hour
  return currentHour === config.archivalScheduleHour;
}
