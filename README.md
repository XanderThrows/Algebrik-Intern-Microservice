# Simple Microservice

A comprehensive microservice built with Node.js and Express, featuring AWS S3 file management and AWS Textract document analysis capabilities.

## Quick Start

1. **Navigate to project directory:**
   ```bash
   cd simple-microservice
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

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

### AWS Textract Document Analysis
- POST /api/textract/extract - Extract text from documents (simple OCR)
- POST /api/textract/analyze - Advanced document analysis with forms and tables

#### Textract Features:
- **Text Extraction**: Basic OCR for simple documents
- **Document Analysis**: Advanced analysis with form and table detection
- **Structured Output**: Organized JSON with categorized content
- **Entity Recognition**: Automatic detection of numbers, emails, phones, dates
- **Layout Analysis**: Headings, paragraphs, lists, and sections
- **Confidence Scores**: Quality metrics for extracted data

## Environment Configuration

Create a `.env` file with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
S3_BUCKET_NAME=your-bucket-name-here
PORT=3000
```

## AWS Setup

### S3 Configuration
1. Create an S3 bucket in your AWS account
2. Create an IAM user with S3 permissions
3. Add your credentials to the `.env` file

### Textract Configuration
1. **IAM Permissions Required:**
   - `AmazonTextractFullAccess` (recommended)
   - Or custom policy with: `textract:DetectDocumentText`, `textract:AnalyzeDocument`

2. **Add Textract permissions to your IAM user:**
   - Go to AWS IAM Console → Users → Your User
   - Add permissions → Attach policies directly
   - Search for "AmazonTextractFullAccess" and attach

## Usage Examples

### Textract Text Extraction
```bash
curl -X POST http://localhost:3000/api/textract/extract \
  -F "file=@document.pdf"
```

### Textract Document Analysis
```bash
curl -X POST http://localhost:3000/api/textract/analyze \
  -F "file=@invoice.pdf"
```

### Response Structure
```json
{
  "success": true,
  "message": "Document analyzed successfully",
  "document": {
    "info": {
      "originalName": "invoice.pdf",
      "size": 245760,
      "contentType": "application/pdf"
    },
    "statistics": {
      "totalBlocks": 45,
      "confidence": {
        "average": 98.5,
        "min": 85.2,
        "max": 99.8
      }
    }
  },
  "extractedData": {
    "content": {
      "lines": [...],
      "headings": [...],
      "paragraphs": [...],
      "lists": [...]
    },
    "entities": {
      "numbers": [...],
      "emails": [...],
      "phones": [...],
      "dates": [...]
    },
    "structure": {
      "tables": [...],
      "keyValuePairs": [...],
      "sections": [...]
    }
  }
}
```

## Supported File Formats

### Textract
- PDF
- PNG, JPG, JPEG
- TIFF, BMP

### S3 Upload
- Any file type

## Testing

1. **Web Interface**: Open `http://localhost:3000/textract-test.html`
2. **Postman**: Use the endpoints with form-data file uploads
3. **Sample Files**: Use `sample-document.txt` for testing

## Dependencies

- Express.js - Web framework
- AWS SDK v3 - S3 and Textract integration
- Multer - File upload handling
- CORS, Helmet, Morgan - Security and logging
- dotenv - Environment configuration

The service runs on http://localhost:3000
