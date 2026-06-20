/**
 * Seed radar data for the read-only UI. Until the gateway serves published radar
 * state, the web app renders this catalog (it may depend on `packages/shared`
 * only, never on the gateway or agents).
 */
import type { Technology, TechnologyCategory } from './domain.js';

const CATEGORY_QUADRANT: Record<TechnologyCategory, string> = {
  'languages-and-frameworks': 'Languages & Frameworks',
  'platforms-and-cloud': 'Platforms',
  'libraries-and-sdks': 'Libraries & SDKs',
  tools: 'Tools',
  'architectural-patterns': 'Patterns',
};

/** Map a technology category to its radar quadrant label. */
export function categoryQuadrant(category: TechnologyCategory): string {
  return CATEGORY_QUADRANT[category];
}

/** All quadrant labels, in display order. */
export const QUADRANTS: readonly string[] = Object.values(CATEGORY_QUADRANT);

/** A small seeded radar spanning every ring and several quadrants. */
export const SEED_TECHNOLOGIES: readonly Technology[] = [
  {
    id: 'react',
    name: 'React',
    category: 'languages-and-frameworks',
    currentRing: 'Adopt',
    ownerTeam: 'Web',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'languages-and-frameworks',
    currentRing: 'Adopt',
    ownerTeam: 'Web',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'languages-and-frameworks',
    currentRing: 'Trial',
    ownerTeam: 'Platform',
  },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'tools',
    currentRing: 'Trial',
    ownerTeam: 'Infra',
  },
  {
    id: 'grpc',
    name: 'gRPC',
    category: 'libraries-and-sdks',
    currentRing: 'Assess',
    ownerTeam: 'Platform',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'libraries-and-sdks',
    currentRing: 'Assess',
    ownerTeam: 'Web',
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    category: 'platforms-and-cloud',
    currentRing: 'Hold',
    ownerTeam: 'Data',
  },
];

/** Look up a seeded technology by id. */
export function findTechnology(id: string): Technology | undefined {
  return SEED_TECHNOLOGIES.find((tech) => tech.id === id);
}
