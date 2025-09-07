const bcrypt = require('bcryptjs');

async function testPassword() {
  const plainPassword = '123456';
  const hashedPassword = '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i';
  
  const isValid = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password "123456" matches hash:', isValid);
  
  // Generate a new hash to be sure
  const newHash = await bcrypt.hash('123456', 10);
  console.log('New hash for "123456":', newHash);
  
  // Test the new hash
  const testNewHash = await bcrypt.compare('123456', newHash);
  console.log('New hash verification:', testNewHash);
}

testPassword();