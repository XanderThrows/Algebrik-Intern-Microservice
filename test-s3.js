// Simple test script for S3 functionality
// Run with: node test-s3.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

async function testS3Endpoints() {
  console.log('🧪 Testing S3 Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: List files (should be empty initially)
    console.log('\n2. Testing list files...');
    const listResponse = await axios.get(`${BASE_URL}/api/s3/files`);
    console.log('✅ List files response:', listResponse.data);

    // Test 3: Upload a test file (you'll need to create a test file)
    console.log('\n3. Testing file upload...');
    console.log('📝 Note: Create a test file (test.txt) to test upload');
    
    // Uncomment below when you have a test file
    /*
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test.txt'));
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/s3/upload`, formData, {
      headers: formData.getHeaders()
    });
    console.log('✅ Upload successful:', uploadResponse.data);
    
    const fileKey = uploadResponse.data.file.key;
    
    // Test 4: Get download URL
    console.log('\n4. Testing download URL...');
    const downloadResponse = await axios.get(`${BASE_URL}/api/s3/download/${fileKey}`);
    console.log('✅ Download URL generated:', downloadResponse.data.downloadUrl);
    
    // Test 5: Delete file
    console.log('\n5. Testing file deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/s3/delete/${fileKey}`);
    console.log('✅ File deleted:', deleteResponse.data);
    */

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testS3Endpoints();
