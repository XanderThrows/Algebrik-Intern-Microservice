# Simple Microservice

A basic microservice built with Node.js and Express.

## Quick Start

1. Install dependencies:
   npm install

2. Start the server:
   npm start

3. Or start in development mode:
   npm run dev

## API Endpoints

### Health & Info
- GET /health - Health check
- GET / - Service information

### User Management
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user
- PUT /api/users/:id - Update user by ID
- DELETE /api/users/:id - Delete user by ID

### AWS S3 File Management
- POST /api/s3/upload - Upload file to S3 (FormData with 'file' field)
- GET /api/s3/download/:key - Get signed URL to download file
- GET /api/s3/files - List all files in S3 bucket
- DELETE /api/s3/delete/:key - Delete file from S3

## Environment Configuration

Create a `.env` file with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
S3_BUCKET_NAME=your-bucket-name-here
PORT=3000
```

## AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Create an IAM user with S3 permissions
3. Add your credentials to the `.env` file
4. The service will automatically use these credentials for S3 operations

The service runs on http://localhost:3000
