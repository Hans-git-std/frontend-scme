import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SkillProficiency, MatchType, CompanyVerificationStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(decimals)}%`;
}

export function getScoreBadgeColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (score >= 90) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      ring: 'stroke-emerald-500',
    };
  }
  if (score >= 75) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30',
      ring: 'stroke-blue-500',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      ring: 'stroke-amber-500',
    };
  }
  return {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/30',
    ring: 'stroke-rose-500',
  };
}

export function getProficiencyBadge(proficiency: SkillProficiency) {
  switch (proficiency) {
    case 'EXPERT':
      return {
        label: 'Expert',
        className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      };
    case 'ADVANCED':
      return {
        label: 'Advanced',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      };
    case 'INTERMEDIATE':
      return {
        label: 'Intermediate',
        className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
      };
    case 'BEGINNER':
    default:
      return {
        label: 'Beginner',
        className: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
  }
}

export function getVerificationStatusBadge(status: CompanyVerificationStatus) {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Verified',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
      };
    case 'NOT_VERIFIED':
    default:
      return {
        label: 'Not Verified',
        className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
      };
  }
}

export function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export const COMMON_SUBJECTS = [
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Theory of Computation',
  'Object Oriented Programming',
  'Software Engineering',
  'Web Technologies',
  'Artificial Intelligence & Machine Learning',
  'Cloud Computing',
  'Cybersecurity & Cryptography',
  'Computer Architecture',
];

export const COMMON_SKILLS = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Spring Boot',
  'Node.js',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Docker',
  'Kubernetes',
  'AWS',
  'Git',
  'REST APIs',
  'GraphQL',
  'C++',
  'Go',
  'Tailwind CSS',
];

export const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];
