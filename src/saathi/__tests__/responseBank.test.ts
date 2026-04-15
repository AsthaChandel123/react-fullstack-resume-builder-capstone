import { describe, it, expect } from 'vitest';
import {
  getGreeting,
  getResponse,
  RESPONSE_TEMPLATES,
  type ResponseKey,
} from '../engine/responseBank';

describe('responseBank', () => {
  it('has at least 3 greeting variants', () => {
    expect(RESPONSE_TEMPLATES['greeting'].length).toBeGreaterThanOrEqual(3);
  });

  it('has templates for every conversation phase', () => {
    const phases: ResponseKey[] = [
      'greeting',
      'warmup.name_ack',
      'warmup.location_ack',
      'warmup.target_role_ask',
      'education.ask',
      'education.acknowledged',
      'education.gpa_ask',
      'experience.ask',
      'experience.role_ack',
      'experience.bullets_ask',
      'experience.another_ask',
      'projects.ask',
      'projects.tech_ask',
      'projects.outcome_ask',
      'projects.another_ask',
      'skills.confirm',
      'skills.missing_ask',
      'wrapup.contact_ask',
      'wrapup.summary_offer',
      'review.show',
      'review.edit_ask',
      'deviation.return',
      'encouragement',
      'clarification',
    ];
    for (const key of phases) {
      expect(RESPONSE_TEMPLATES[key], `Missing template: ${key}`).toBeDefined();
      expect(RESPONSE_TEMPLATES[key].length, `Empty template: ${key}`).toBeGreaterThan(0);
    }
  });

  it('has at least 200 total template variants', () => {
    let total = 0;
    for (const variants of Object.values(RESPONSE_TEMPLATES)) {
      total += variants.length;
    }
    expect(total).toBeGreaterThanOrEqual(200);
  });

  it('getGreeting returns a string without template markers', () => {
    const greeting = getGreeting();
    expect(greeting).not.toContain('{{');
    expect(greeting.length).toBeGreaterThan(10);
  });

  it('getResponse interpolates variables', () => {
    const result = getResponse('warmup.name_ack', { name: 'Rahul' });
    expect(result).toContain('Rahul');
    expect(result).not.toContain('{{name}}');
  });

  it('rotates variants to avoid repetition', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getResponse('encouragement', {}));
    }
    // Should get more than 1 unique variant in 10 calls
    expect(results.size).toBeGreaterThan(1);
  });
});
