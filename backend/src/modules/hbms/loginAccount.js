const bcrypt = require('bcryptjs');
const { prisma } = require('./utils');

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function updateLoginAccount(userId, { name, email, password } = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      employeeProfile: { select: { id: true, email: true } },
    },
  });
  if (!user) return { status: 404, error: 'Login not found' };

  const nextName = name == null ? (user.name || '') : String(name).trim();
  const nextEmail = email == null ? user.email : cleanEmail(email);
  if (!nextName) return { status: 400, error: 'Enter a name' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) return { status: 400, error: 'Enter a valid email' };
  if (password != null && String(password) !== '' && String(password).length < 8) {
    return { status: 400, error: 'Use at least 8 characters for the password' };
  }

  if (nextEmail !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: nextEmail }, select: { id: true } });
    if (taken && taken.id !== user.id) return { status: 409, error: 'That email is already used' };
    if (user.employeeProfile) {
      const staff = await prisma.employee.findUnique({ where: { email: nextEmail }, select: { id: true } });
      if (staff && staff.id !== user.employeeProfile.id) {
        return { status: 409, error: 'That email is already used by another worker' };
      }
    }
  }

  const data = { name: nextName, email: nextEmail };
  let passwordChanged = false;
  if (password != null && String(password) !== '') {
    data.password = await bcrypt.hash(String(password), 12);
    passwordChanged = true;
  }
  await prisma.user.update({ where: { id: user.id }, data });
  if (user.employeeProfile && nextEmail !== user.employeeProfile.email) {
    await prisma.employee.update({ where: { id: user.employeeProfile.id }, data: { email: nextEmail } });
  }
  return { data: { id: user.id, email: nextEmail, name: nextName, passwordChanged } };
}

module.exports = { updateLoginAccount };
