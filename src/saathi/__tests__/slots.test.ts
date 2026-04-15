import { describe, it, expect } from 'vitest';
import {
  REQUIRED_SLOTS,
  PREFERRED_SLOTS,
  ALL_SLOTS,
  createSlotState,
  isSlotFilled,
  getFilledPercentage,
  getNextUnfilledSlot,
  type SlotState,
  type SlotId,
} from '../engine/slots';

describe('slots', () => {
  it('defines all required slots from spec', () => {
    const requiredIds = REQUIRED_SLOTS.map((s) => s.id);
    expect(requiredIds).toContain('personal.name');
    expect(requiredIds).toContain('personal.email');
    expect(requiredIds).toContain('personal.phone');
    expect(requiredIds).toContain('personal.location');
    expect(requiredIds).toContain('education[].degree');
    expect(requiredIds).toContain('education[].institution');
    expect(requiredIds).toContain('education[].year');
    expect(requiredIds).toContain('education[].field');
    expect(requiredIds.length).toBe(8);
  });

  it('defines all preferred slots from spec', () => {
    const prefIds = PREFERRED_SLOTS.map((s) => s.id);
    expect(prefIds).toContain('education[].gpa');
    expect(prefIds).toContain('experience[].company');
    expect(prefIds).toContain('experience[].role');
    expect(prefIds).toContain('experience[].dates');
    expect(prefIds).toContain('experience[].bullets[]');
    expect(prefIds).toContain('projects[].name');
    expect(prefIds).toContain('projects[].tech');
    expect(prefIds).toContain('projects[].outcome');
    expect(prefIds).toContain('skills[]');
    expect(prefIds).toContain('certifications[]');
    expect(prefIds).toContain('summary');
    expect(prefIds).toContain('personal.linkedin');
    expect(prefIds).toContain('personal.github');
    expect(prefIds).toContain('relocation_preference');
    expect(prefIds).toContain('target_role');
  });

  it('creates empty slot state', () => {
    const state = createSlotState();
    expect(getFilledPercentage(state)).toBe(0);
    expect(isSlotFilled(state, 'personal.name')).toBe(false);
  });

  it('tracks filled slots', () => {
    const state = createSlotState();
    state.values.set('personal.name', 'Rahul');
    expect(isSlotFilled(state, 'personal.name')).toBe(true);
    expect(getFilledPercentage(state)).toBeGreaterThan(0);
  });

  it('getNextUnfilledSlot returns required slots first', () => {
    const state = createSlotState();
    const next = getNextUnfilledSlot(state);
    expect(next).not.toBeNull();
    const requiredIds = REQUIRED_SLOTS.map((s) => s.id);
    expect(requiredIds).toContain(next!.id);
  });

  it('getNextUnfilledSlot returns preferred after all required filled', () => {
    const state = createSlotState();
    for (const slot of REQUIRED_SLOTS) {
      state.values.set(slot.id, 'test-value');
    }
    const next = getNextUnfilledSlot(state);
    if (next) {
      const prefIds = PREFERRED_SLOTS.map((s) => s.id);
      expect(prefIds).toContain(next.id);
    }
  });
});
