import { describe, it, expect } from 'vitest';

describe('design tokens', () => {
  it('defines positive aura tokens on :root', () => {
    // Load the CSS file and verify tokens exist
    const css = require('fs').readFileSync(
      require('path').resolve(__dirname, '../tokens.css'),
      'utf-8'
    );
    const requiredTokens = [
      '--saathi-bg-warm',
      '--saathi-bg-cream',
      '--saathi-accent-teal',
      '--saathi-success',
      '--saathi-warning',
      '--saathi-concern',
      '--saathi-radius',
      '--saathi-spacing',
      '--saathi-line-height',
      '--saathi-transition',
    ];
    for (const token of requiredTokens) {
      expect(css).toContain(token);
    }
  });

  it('preserves existing tokens', () => {
    const css = require('fs').readFileSync(
      require('path').resolve(__dirname, '../tokens.css'),
      'utf-8'
    );
    expect(css).toContain('--accent-red');
    expect(css).toContain('--accent-navy');
    expect(css).toContain('--accent-gold');
  });
});
