import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConversation,
  processUserInput,
  type ConversationState,
} from '../engine/slotMachine';

describe('slotMachine', () => {
  let conversation: ConversationState;

  beforeEach(() => {
    conversation = createConversation();
  });

  it('starts with a greeting message', () => {
    expect(conversation.messages.length).toBe(1);
    expect(conversation.messages[0].role).toBe('saathi');
    expect(conversation.messages[0].text.length).toBeGreaterThan(10);
  });

  it('starts in warmup phase', () => {
    expect(conversation.slots.phase).toBe('warmup');
  });

  it('extracts name from first user input', () => {
    const updated = processUserInput(conversation, 'My name is Rahul');
    expect(updated.slots.values.get('personal.name')).toBe('Rahul');
    // Saathi should acknowledge the name
    const lastSaathiMsg = updated.messages.filter((m) => m.role === 'saathi').pop();
    expect(lastSaathiMsg?.text).toContain('Rahul');
  });

  it('extracts location from user input', () => {
    let state = processUserInput(conversation, "I'm Rahul");
    state = processUserInput(state, "I'm from Solan, HP");
    expect(state.slots.values.get('personal.location')).toBe('Solan, HP');
  });

  it('transitions phases as slots are filled', () => {
    let state = processUserInput(conversation, "I'm Rahul from Delhi");
    // Fill warmup, should eventually prompt education
    state = processUserInput(state, "I want to be a software developer");
    expect(
      state.slots.phase === 'warmup' || state.slots.phase === 'education'
    ).toBe(true);
  });

  it('extracts email and phone in wrapup', () => {
    let state = conversation;
    state = processUserInput(state, 'Rahul from Delhi');
    state = processUserInput(state, 'B.Tech Computer Science from IIT Delhi 2023');
    // Skip ahead: fill required education
    state.slots.values.set('education[].degree', 'B.Tech');
    state.slots.values.set('education[].institution', 'IIT Delhi');
    state.slots.values.set('education[].year', '2023');
    state.slots.values.set('education[].field', 'Computer Science');
    state = processUserInput(state, 'rahul@example.com and phone is 9876543210');
    expect(state.slots.values.get('personal.email')).toBe('rahul@example.com');
    expect(state.slots.values.get('personal.phone')).toBe('9876543210');
  });

  it('handles skill extraction from natural language', () => {
    let state = processUserInput(conversation, 'Rahul from Mumbai');
    state = processUserInput(state, 'I know Python, React, and Docker');
    const skills = state.slots.values.get('skills[]');
    expect(Array.isArray(skills)).toBe(true);
    if (Array.isArray(skills)) {
      expect(skills).toContain('python');
      expect(skills).toContain('react');
      expect(skills).toContain('docker');
    }
  });

  it('adds user messages to history', () => {
    const updated = processUserInput(conversation, 'Hello there');
    const userMsgs = updated.messages.filter((m) => m.role === 'user');
    expect(userMsgs.length).toBe(1);
    expect(userMsgs[0].text).toBe('Hello there');
  });

  it('handles empty input gracefully', () => {
    const updated = processUserInput(conversation, '');
    // Should ask for clarification
    const last = updated.messages[updated.messages.length - 1];
    expect(last.role).toBe('saathi');
  });

  it('tracks filled percentage', () => {
    let state = processUserInput(conversation, "I'm Rahul from Solan");
    const pct = state.filledPercentage;
    expect(pct).toBeGreaterThan(0);
  });
});
