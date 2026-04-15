export {
  normalizeSkill,
  getSkillNode,
  getAdjacentSkills,
  getSkillsByCategory,
  matchSkillsToTaxonomy,
  computeSkillOverlap,
} from './skillsGraph';

export type {
  SkillNode,
  SkillCategory,
  SkillOverlapResult,
  MatchResult,
} from './skillsGraph';
