import { describe, it, expect, vi } from 'vitest';
import { slotsToResume } from '../engine/resumeGenerator';
import { createSlotState, type SlotState } from '../engine/slots';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

describe('resumeGenerator', () => {
  function filledSlots(): SlotState {
    const state = createSlotState();
    state.values.set('personal.name', 'Rahul Sharma');
    state.values.set('personal.email', 'rahul@example.com');
    state.values.set('personal.phone', '9876543210');
    state.values.set('personal.location', 'Delhi');
    state.values.set('personal.linkedin', 'linkedin.com/in/rahul');
    state.values.set('personal.github', 'github.com/rahul');
    state.values.set('education[].degree', 'B.Tech');
    state.values.set('education[].institution', 'IIT Delhi');
    state.values.set('education[].year', '2023');
    state.values.set('education[].field', 'Computer Science');
    state.values.set('education[].gpa', '8.5');
    state.values.set('experience[].company', 'Google');
    state.values.set('experience[].role', 'SDE Intern');
    state.values.set('experience[].dates', 'May 2022 - Aug 2022');
    state.values.set('experience[].bullets[]', [
      'Built a REST API serving 10k requests per second',
      'Improved test coverage from 60% to 95%',
    ]);
    state.values.set('projects[].name', 'ResumeAI');
    state.values.set('projects[].tech', 'React, TypeScript, Vite');
    state.values.set('projects[].outcome', '500 users in first week');
    state.values.set('skills[]', ['python', 'react', 'typescript', 'docker']);
    state.values.set('summary', 'Passionate CS graduate from IIT Delhi');
    return state;
  }

  it('generates a Resume object from filled slots', () => {
    const resume = slotsToResume(filledSlots());
    expect(resume.personal.name).toBe('Rahul Sharma');
    expect(resume.personal.email).toBe('rahul@example.com');
    expect(resume.personal.phone).toBe('9876543210');
    expect(resume.personal.location).toBe('Delhi');
    expect(resume.personal.linkedin).toBe('linkedin.com/in/rahul');
    expect(resume.personal.github).toBe('github.com/rahul');
    expect(resume.summary).toBe('Passionate CS graduate from IIT Delhi');
  });

  it('creates education section entries', () => {
    const resume = slotsToResume(filledSlots());
    const edu = resume.sections.find((s) => s.type === 'education');
    expect(edu).toBeDefined();
    expect(edu!.entries.length).toBeGreaterThan(0);
    const entry = edu!.entries[0];
    expect(entry.fields['degree']).toBe('B.Tech');
    expect(entry.fields['institution']).toBe('IIT Delhi');
  });

  it('creates experience section entries with bullets', () => {
    const resume = slotsToResume(filledSlots());
    const exp = resume.sections.find((s) => s.type === 'experience');
    expect(exp).toBeDefined();
    expect(exp!.entries.length).toBeGreaterThan(0);
    expect(exp!.entries[0].bullets.length).toBe(2);
  });

  it('creates skills section entries', () => {
    const resume = slotsToResume(filledSlots());
    const skills = resume.sections.find((s) => s.type === 'skills');
    expect(skills).toBeDefined();
    expect(skills!.entries.length).toBeGreaterThan(0);
  });

  it('creates project section entries', () => {
    const resume = slotsToResume(filledSlots());
    const proj = resume.sections.find((s) => s.type === 'projects');
    expect(proj).toBeDefined();
    expect(proj!.entries.length).toBeGreaterThan(0);
    expect(proj!.entries[0].fields['name']).toBe('ResumeAI');
  });

  it('handles minimal slots gracefully', () => {
    const state = createSlotState();
    state.values.set('personal.name', 'Test');
    const resume = slotsToResume(state);
    expect(resume.personal.name).toBe('Test');
    expect(resume.sections.length).toBeGreaterThan(0);
  });
});
