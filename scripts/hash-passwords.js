const bcrypt = require('bcryptjs');

const users = [
  { email: 'Admin@g.com', password: 'Admin1230' },
  { email: 'm@g.com', password: 'Mm12341234' },
  { email: 'mo@g.com', password: 'Mo12341234' },
  { email: 'fa@g.com', password: 'Fa12341234' },
  { email: 'sa@g.com', password: 'Sa12341234' },
  { email: 'a@g.com', password: 'Ab12341234' },
  { email: 'mh@g.com', password: 'mh12341234' },
  { email: 'sae@g.com', password: 'Sa12341234' },
  { email: 'am@g.com', password: 'Am12341234' },
  { email: 'Aa@g.com', password: 'Aa12341234' },
  { email: 'Sl@g.com', password: 'Sl12341234' },
  { email: 'Sa@g.com', password: 'Sa12341234' }
];

async function hashPasswords() {
  console.log('-- تحديث كلمات المرور المشفرة');
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = '${user.email}';`);
  }
}

hashPasswords();
