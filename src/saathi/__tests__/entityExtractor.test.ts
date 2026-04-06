import { describe, it, expect } from 'vitest';
import { extractEntities, type ExtractedEntities } from '../engine/entityExtractor';

describe('entityExtractor', () => {
  it('extracts email addresses', () => {
    const result = extractEntities('my email is rahul@example.com');
    expect(result.email).toBe('rahul@example.com');
  });

  it('extracts Indian phone numbers', () => {
    const result = extractEntities('call me at +91 98765 43210');
    expect(result.phone).toBe('+91 98765 43210');
  });

  it('extracts phone without country code', () => {
    const result = extractEntities('9876543210');
    expect(result.phone).toBe('9876543210');
  });

  it('extracts dates in various formats', () => {
    const r1 = extractEntities('I worked there from 2019 to 2022');
    expect(r1.dates).toContain('2019');
    expect(r1.dates).toContain('2022');

    const r2 = extractEntities('Jan 2020 to Mar 2022');
    expect(r2.dateRanges.length).toBeGreaterThan(0);
  });

  it('extracts GPA in CGPA format', () => {
    const result = extractEntities('I got 8.5 CGPA');
    expect(result.gpa).toBe('8.5');
  });

  it('extracts GPA in percentage format', () => {
    const result = extractEntities('my score was 85%');
    expect(result.gpa).toBe('85%');
  });

  it('extracts GPA in X/Y format', () => {
    const result = extractEntities('3.8/4.0 GPA');
    expect(result.gpa).toBe('3.8/4.0');
  });

  it('extracts degree abbreviations', () => {
    const result = extractEntities('I have a B.Tech in Computer Science');
    expect(result.degree).toBe('B.Tech');
  });

  it('extracts skills matching taxonomy', () => {
    const result = extractEntities('I know Python, React, and Docker');
    expect(result.skills).toContain('python');
    expect(result.skills).toContain('react');
    expect(result.skills).toContain('docker');
  });

  it('extracts LinkedIn URLs', () => {
    const result = extractEntities('linkedin.com/in/rahul-sharma');
    expect(result.linkedin).toBe('linkedin.com/in/rahul-sharma');
  });

  it('extracts GitHub URLs', () => {
    const result = extractEntities('github.com/rahulsharma');
    expect(result.github).toBe('github.com/rahulsharma');
  });

  it('returns empty for gibberish', () => {
    const result = extractEntities('asdfghjkl');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.skills.length).toBe(0);
  });
});
