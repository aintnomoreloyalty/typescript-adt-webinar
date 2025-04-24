import type { SlackNotifyResult } from '../types/domain';

/**
 * NotificationService - Responsible for sending notifications to external systems
 * 
 * Following DDD principles, this service exists in a separate bounded context
 * for communications. It provides a domain-oriented interface to the
 * underlying notification channels.
 */

/**
 * Send a notification to Slack
 * 
 * Used in both registration flows to notify the team about new user sign-ups
 */
export const sendSlackNotification = async (
  params: { channel: string; message: string },
  deps: { notifyFn: (channel: string, message: string) => Promise<SlackNotifyResult> },
): Promise<SlackNotifyResult> => {
  return deps.notifyFn(params.channel, params.message);
}; 