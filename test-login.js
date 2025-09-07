const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:8787/api/login', {
      email: 'Admin@g.com',
      password: 'Admin1230'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test different users
async function testAllUsers() {
  const users = [
    { email: 'Admin@g.com', password: 'Admin1230' },
    { email: 'Supervisor@g.com', password: 'Super1234' },
    { email: 'Employee@g.com', password: 'Emp123456' },
    { email: 'Partner@g.com', password: 'Part12345' }
  ];

  for (const user of users) {
    console.log(`\n--- Testing ${user.email} ---`);
    try {
      const response = await axios.post('http://localhost:8787/api/login', user, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Login successful');
      console.log('  User ID:', response.data.user.id);
      console.log('  Role:', response.data.user.role);
      console.log('  Branch:', response.data.user.branch);
      console.log('  Permissions:', response.data.user.permissions);
    } catch (error) {
      console.error('✗ Login failed');
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Error:', error.response.data);
      } else {
        console.error('  Error:', error.message);
      }
    }
  }
}

// Run tests
testAllUsers();