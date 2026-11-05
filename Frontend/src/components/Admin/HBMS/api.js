import axios from 'axios';
import { apiOrigin } from '../../../apiOrigin';

const hbmsApi = axios.create({
  baseURL: `${apiOrigin}/api/hbms`,
});

hbmsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiError(error, fallback) {
  return error?.response?.data?.error || fallback;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export const employmentTypeOptions = [
  ['FULL_TIME', 'Full-time'],
  ['PART_TIME', 'Part-time'],
  ['INTERN', 'Intern'],
  ['TRAINER', 'Trainer'],
  ['FREELANCE', 'Freelance'],
];

export function employmentLabel(value) {
  return employmentTypeOptions.find(([key]) => key === value)?.[1] || String(value || '').replaceAll('_', ' ');
}

const accessRoleLabels = {
  SUPER_ADMIN: 'Super administrator',
  CEO: 'CEO',
  DEPARTMENT_MANAGER: 'Department manager',
  PROJECT_MANAGER: 'Project manager',
  HR: 'HR',
  PROGRAM_COORDINATOR: 'Program coordinator',
  TRAINER: 'Trainer',
  WORKER: 'Worker',
  INTERN: 'Intern',
  CLIENT: 'Client',
};

export function accessRoleLabel(role) {
  return accessRoleLabels[role] || String(role || '').replaceAll('_', ' ');
}

export const projectStatusOptions = [
  ['PLANNING', 'Planning'],
  ['ACTIVE', 'Active'],
  ['ON_HOLD', 'On Hold'],
  ['COMPLETED', 'Completed'],
  ['CANCELLED', 'Cancelled'],
];

export const projectCategoryOptions = [
  ['SOFTWARE', 'School or software system'],
  ['WEBSITE', 'Website development'],
  ['ECOMMERCE', 'E-commerce platform'],
  ['MOBILE', 'Mobile application'],
  ['INFRASTRUCTURE', 'IT infrastructure'],
  ['BRANDING', 'Event branding'],
  ['LIVESTREAM', 'Live-streaming'],
  ['PHOTOGRAPHY', 'Photography'],
  ['VIDEO', 'Video production'],
  ['MARKETING', 'Digital marketing'],
  ['PODCAST', 'Podcast production'],
  ['OTHER', 'Other'],
];

export const programKindOptions = [
  ['SOFTWARE_TRAINING', 'Software Development Training'],
  ['MEDIA_TRAINING', 'Photography and Videography Training'],
  ['HOLIDAY', 'Holiday Coding Program'],
  ['INTERNSHIP', 'Internship Program'],
  ['WORKSHOP', 'Professional Workshop'],
  ['HACKATHON', 'Hackathon and Innovation Program'],
  ['COURSE', 'Course'],
];

export const documentCategoryOptions = [
  ['CONTRACT', 'Employee contract'],
  ['REQUIREMENTS', 'Project requirements'],
  ['CLIENT_AGREEMENT', 'Client agreement'],
  ['DELIVERABLE', 'Project deliverable'],
  ['TRAINING', 'Training material'],
  ['INTERNSHIP_REPORT', 'Internship report'],
  ['PRODUCTION', 'Studio production file'],
  ['POLICY', 'Company policy'],
  ['MINUTES', 'Meeting minutes'],
];

export const documentSensitivityOptions = [
  ['INTERNAL', 'Internal'],
  ['CONFIDENTIAL', 'Confidential'],
  ['RESTRICTED', 'Restricted'],
];

export const suggestedSensitivity = {
  CONTRACT: 'CONFIDENTIAL',
  REQUIREMENTS: 'CONFIDENTIAL',
  CLIENT_AGREEMENT: 'RESTRICTED',
  DELIVERABLE: 'CONFIDENTIAL',
  TRAINING: 'INTERNAL',
  INTERNSHIP_REPORT: 'CONFIDENTIAL',
  PRODUCTION: 'CONFIDENTIAL',
  POLICY: 'INTERNAL',
  MINUTES: 'CONFIDENTIAL',
};

export const announcementKindOptions = [
  ['MEETING', 'Team meeting'],
  ['PRODUCTION', 'Production'],
  ['INTERNSHIP', 'Internship'],
  ['DEADLINE', 'Deadline'],
  ['TRAINING', 'Training'],
  ['GENERAL', 'General'],
];

export const attendancePolicyOptions = [
  ['OFFICE', 'Office check-in'],
  ['REMOTE', 'Remote check-in'],
  ['EVENT', 'Event hours'],
  ['FLEXIBLE', 'Flexible, no daily check-in'],
];

export const programStatusOptions = [
  ['PLANNED', 'Planned'],
  ['ACTIVE', 'Active'],
  ['COMPLETED', 'Completed'],
  ['CANCELLED', 'Cancelled'],
];

export const taskPriorityOptions = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['URGENT', 'Urgent'],
];

export const taskStatusOptions = [
  ['TODO', 'To do'],
  ['IN_PROGRESS', 'In progress'],
  ['BLOCKED', 'Blocked'],
  ['IN_REVIEW', 'In review'],
  ['DONE', 'Done'],
  ['CANCELLED', 'Cancelled'],
];

export function optionLabel(options, value) {
  return options.find(([key]) => key === value)?.[1] || String(value || '').replaceAll('_', ' ');
}

export function formatMoney(amount, currency = 'RWF') {
  if (amount == null || amount === '') return '—';
  return `${Number(amount).toLocaleString()} ${currency}`;
}

function clientPartyName(project) {
  const name = String(project?.clientName || '').trim();
  const contact = String(project?.clientContactName || '').trim();
  if (name && contact && name !== contact) return `${name} · ${contact}`;
  return name || contact || 'Client';
}

export function moneyPartyOptions(project) {
  if (!project) return [];
  const options = [{ value: 'CLIENT', label: `Client · ${clientPartyName(project)}` }];
  const seen = new Set();
  const add = (employee) => {
    if (!employee?.id || seen.has(employee.id)) return;
    seen.add(employee.id);
    options.push({ value: employee.id, label: `${employee.firstName} ${employee.lastName}` });
  };
  add(project.manager);
  (project.members || []).forEach((member) => add(member.employee));
  return options;
}

export function moneyPartyFields(value) {
  if (value === 'CLIENT') return { kind: 'CLIENT', id: null };
  return { kind: value ? 'MEMBER' : '', id: value || null };
}

export function moneyPartyLabel(kind, person, project) {
  if (kind === 'CLIENT') return clientPartyName(project);
  if (person) return `${person.firstName} ${person.lastName}`.trim();
  return '';
}

export default hbmsApi;
