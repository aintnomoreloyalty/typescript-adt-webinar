import type { MetricsRecordResult } from '../types/domain';

/**
 * MetricsService - Responsible for recording business metrics
 * 
 * Following DDD principles, this service exists in a separate bounded context
 * for analytics and monitoring. It provides a domain-oriented interface to the
 * underlying metrics system.
 */

/**
 * Record a business metric
 * 
 * Used in both registration flows to track successful registrations
 * and other key business events
 */
export const recordMetrics = async (
  params: { eventType: string; metadata: Record<string, unknown> },
  deps: {
    recordMetricsFn: (
      eventType: string,
      metadata: Record<string, unknown>,
    ) => Promise<MetricsRecordResult>;
  },
): Promise<MetricsRecordResult> => {
  return deps.recordMetricsFn(params.eventType, params.metadata);
}; 