import * as XLSX from 'xlsx';

const FIELD_ALIASES = {
  recipientname: 'recipientName',
  name: 'recipientName',
  fullname: 'recipientName',
  recipient: 'recipientName',
  student: 'recipientName',
  studentname: 'recipientName',
  email: 'email',
  emailaddress: 'email',
  mail: 'email',
  coursename: 'courseName',
  course: 'courseName',
  program: 'courseName',
  training: 'courseName',
  duration: 'duration',
  daterange: 'dateRange',
  dates: 'dateRange',
  period: 'dateRange',
  completiondate: 'completionDate',
  date: 'completionDate',
  completed: 'completionDate',
  completion: 'completionDate',
  skills: 'skills',
  skill: 'skills',
};

const headerKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const cellText = (value) => {
  if (value instanceof Date) return '';
  return String(value ?? '').trim();
};

export function completionDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const month = String(parsed.m).padStart(2, '0');
      const day = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${month}-${day}`;
    }
  }
  const text = cellText(value);
  if (!text) return new Date().toISOString().slice(0, 10);
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function splitSkills(value) {
  return cellText(value)
    .split(/[,;|]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function parseCertificateSheet(arrayBuffer) {
  const book = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) return { rows: [], errors: [{ row: 0, message: 'The file has no sheet.' }] };

  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  let headerIndex = -1;
  let columns = {};
  for (let index = 0; index < Math.min(grid.length, 8); index += 1) {
    const mapped = {};
    (grid[index] || []).forEach((cell, cellIndex) => {
      const field = FIELD_ALIASES[headerKey(cell)];
      if (field && mapped[field] === undefined) mapped[field] = cellIndex;
    });
    if (mapped.recipientName !== undefined && mapped.email !== undefined && mapped.courseName !== undefined) {
      headerIndex = index;
      columns = mapped;
      break;
    }
  }
  if (headerIndex < 0) {
    return {
      rows: [],
      errors: [{ row: 1, message: 'Add column headings for name, email, and course.' }],
    };
  }

  const rows = [];
  const errors = [];
  grid.slice(headerIndex + 1).forEach((line, offset) => {
    const row = headerIndex + offset + 2;
    const cells = line || [];
    const blank = cells.every((cell) => cellText(cell) === '' && !(cell instanceof Date));
    if (blank) return;
    const recipientName = cellText(cells[columns.recipientName]);
    const email = cellText(cells[columns.email]).toLowerCase();
    const courseName = cellText(cells[columns.courseName]);
    const problems = [];
    if (!recipientName) problems.push('name is missing');
    if (!email.includes('@') || email.includes(' ')) problems.push('email is missing');
    if (!courseName) problems.push('course is missing');
    const completionDate = columns.completionDate === undefined
      ? new Date().toISOString().slice(0, 10)
      : completionDateValue(cells[columns.completionDate]);
    if (!completionDate) problems.push('completion date is not a date');
    if (problems.length) {
      errors.push({ row, message: problems.join(', ') });
      return;
    }
    rows.push({
      row,
      recipientName,
      email,
      courseName,
      duration: columns.duration === undefined ? '' : cellText(cells[columns.duration]),
      dateRange: columns.dateRange === undefined ? '' : cellText(cells[columns.dateRange]),
      completionDate,
      skills: columns.skills === undefined ? [] : splitSkills(cells[columns.skills]),
    });
  });
  return { rows, errors };
}

export function downloadCertificateTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Name', 'Email', 'Course', 'Duration', 'Date range', 'Completion date', 'Skills'],
    ['Aline Uwase', 'aline@example.com', 'Software Development', '3 months', 'Jan-March 2026', '2026-03-31', 'HTML, CSS, JavaScript'],
  ]);
  sheet['!cols'] = [18, 24, 24, 14, 18, 18, 32].map((width) => ({ wch: width }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Certificates');
  XLSX.writeFile(book, 'hblab-certificates-template.xlsx');
}
