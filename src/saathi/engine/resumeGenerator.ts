// /mnt/experiments/astha-resume/src/saathi/engine/resumeGenerator.ts

import type { Resume, Section, Entry } from '@/store/types';
import { getArrayEntries, type SlotState } from './slots';

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Convert filled conversation slots into a Resume object
 * compatible with the existing resume store.
 */
export function slotsToResume(slots: SlotState): Resume {
  const get = (key: string): string => {
    const val = slots.values.get(key as any);
    if (typeof val === 'string') return val;
    return '';
  };

  const getArray = (key: string): string[] => {
    const val = slots.values.get(key as any);
    if (Array.isArray(val)) return val;
    return [];
  };

  const sections: Section[] = [];

  // Education (Bug 3: support multiple entries)
  const eduArrayEntries = getArrayEntries(slots, 'education');
  const eduEntries: Entry[] = [];
  if (eduArrayEntries.length > 0) {
    for (const entry of eduArrayEntries) {
      eduEntries.push({
        id: uuid(),
        fields: {
          degree: entry.degree || '',
          institution: entry.institution || '',
          year: entry.year || '',
          field: entry.field || '',
          gpa: entry.gpa || '',
        },
        bullets: [],
      });
    }
  } else if (get('education[].degree') || get('education[].institution')) {
    // Fallback: single flat entry
    eduEntries.push({
      id: uuid(),
      fields: {
        degree: get('education[].degree'),
        institution: get('education[].institution'),
        year: get('education[].year'),
        field: get('education[].field'),
        gpa: get('education[].gpa'),
      },
      bullets: [],
    });
  }
  sections.push({
    id: uuid(),
    type: 'education',
    heading: 'Education',
    layout: 'list',
    entries: eduEntries,
  });

  // Experience (Bug 3: support multiple entries)
  const expArrayEntries = getArrayEntries(slots, 'experience');
  const expEntries: Entry[] = [];
  if (expArrayEntries.length > 0) {
    for (const entry of expArrayEntries) {
      expEntries.push({
        id: uuid(),
        fields: {
          company: entry.company || '',
          role: entry.role || '',
          dates: entry.dates || '',
        },
        bullets: entry.bullets ? JSON.parse(entry.bullets) : [],
      });
    }
  } else if (get('experience[].company') || get('experience[].role')) {
    // Fallback: single flat entry
    expEntries.push({
      id: uuid(),
      fields: {
        company: get('experience[].company'),
        role: get('experience[].role'),
        dates: get('experience[].dates'),
      },
      bullets: getArray('experience[].bullets[]'),
    });
  }
  sections.push({
    id: uuid(),
    type: 'experience',
    heading: 'Experience',
    layout: 'list',
    entries: expEntries,
  });

  // Projects (Bug 3: support multiple entries)
  const projArrayEntries = getArrayEntries(slots, 'projects');
  const projEntries: Entry[] = [];
  if (projArrayEntries.length > 0) {
    for (const entry of projArrayEntries) {
      projEntries.push({
        id: uuid(),
        fields: {
          name: entry.name || '',
          tech: entry.tech || '',
          outcome: entry.outcome || '',
        },
        bullets: [],
      });
    }
  } else if (get('projects[].name')) {
    // Fallback: single flat entry
    projEntries.push({
      id: uuid(),
      fields: {
        name: get('projects[].name'),
        tech: get('projects[].tech'),
        outcome: get('projects[].outcome'),
      },
      bullets: [],
    });
  }
  sections.push({
    id: uuid(),
    type: 'projects',
    heading: 'Projects',
    layout: 'list',
    entries: projEntries,
  });

  // Skills
  const skillsArr = getArray('skills[]');
  const skillEntries: Entry[] = [];
  if (skillsArr.length > 0) {
    skillEntries.push({
      id: uuid(),
      fields: {},
      bullets: skillsArr,
    });
  }
  sections.push({
    id: uuid(),
    type: 'skills',
    heading: 'Skills',
    layout: 'tags',
    entries: skillEntries,
  });

  // Certifications (empty placeholder)
  const certArr = getArray('certifications[]');
  const certEntries: Entry[] = [];
  if (certArr.length > 0) {
    certEntries.push({
      id: uuid(),
      fields: {},
      bullets: certArr,
    });
  }
  sections.push({
    id: uuid(),
    type: 'certifications',
    heading: 'Certifications',
    layout: 'list',
    entries: certEntries,
  });

  // Extracurricular (empty placeholder)
  sections.push({
    id: uuid(),
    type: 'extracurricular',
    heading: 'Extracurricular & Leadership',
    layout: 'list',
    entries: [],
  });

  return {
    id: uuid(),
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: 'ats-classic',
    },
    personal: {
      name: get('personal.name'),
      email: get('personal.email'),
      phone: get('personal.phone'),
      location: get('personal.location'),
      linkedin: get('personal.linkedin'),
      github: get('personal.github'),
    },
    summary: get('summary'),
    sections,
  };
}
