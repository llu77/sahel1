const bcrypt = require('bcryptjs');

// Hash password "123456" for all users
async function hashPassword() {
  const password = '123456';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password for "123456":', hash);
  console.log('Use this hash for all users in users.json');
}

hashPassword();