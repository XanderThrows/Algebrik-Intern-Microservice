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

### Math Verification
- POST /api/math/verify-sum - Verify if the sum of two numbers matches the expected result

### AWS S3 File Management
- POST /api/s3/upload - Upload file to S3 (FormData with 'file' field)
- GET /api/s3/download/:key - Get signed URL to download file
- GET /api/s3/files - List all files in S3 bucket
- DELETE /api/s3/delete/:key - Delete file from S3

### AWS Textract Document Analysis
- POST /api/textract/extract - Extract text from documents (simple OCR)
- POST /api/textract/analyze - Advanced document analysis with forms and tables

### Google Gemini AI Document Processing
- POST /api/gemini/call_gemini - General Gemini AI processing with custom prompt
- POST /api/gemini/extract-resume - Extract structured information from resumes
- POST /api/gemini/extract-document - Extract information from documents (Passport, Driver's License, Army Card)

#### Gemini Features:
- **Resume Extraction**: Structured extraction of personal info, work experience, education, skills, and more
- **Document Extraction**: Intelligent extraction from Passports, Driver's Licenses, and Army/Military Cards
- **Custom Prompts**: Flexible API for custom document processing tasks
- **Structured JSON**: Returns clean, parseable JSON data
- **Multi-format Support**: PDF, PNG, JPG, JPEG images
- **Model**: Uses Gemini 2.0 Flash for fast and accurate results

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

# Google Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
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

### Math Verification
```bash
# Correct sum
curl -X POST http://localhost:3000/api/math/verify-sum \
  -H "Content-Type: application/json" \
  -d '{"num1": 5, "num2": 3, "expectedResult": 8}'

# Incorrect sum
curl -X POST http://localhost:3000/api/math/verify-sum \
  -H "Content-Type: application/json" \
  -d '{"num1": 5, "num2": 3, "expectedResult": 9}'

# Response example:
# {
#   "correct": true,
#   "num1": 5,
#   "num2": 3,
#   "actualSum": 8,
#   "expectedResult": 8,
#   "message": "Correct! 5 + 3 = 8"
# }
```

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

### Gemini Resume Extraction
```bash
curl -X POST http://localhost:3000/api/gemini/extract-resume \
  -F "file=@resume.pdf"
```

### Gemini Document Extraction
```bash
# Passport
curl -X POST http://localhost:3000/api/gemini/extract-document \
  -F "file=@passport.pdf" \
  -F "documentType=Passport"

# Driver's License
curl -X POST http://localhost:3000/api/gemini/extract-document \
  -F "file=@license.pdf" \
  -F "documentType=Driver's License"

# Army Card
curl -X POST http://localhost:3000/api/gemini/extract-document \
  -F "file=@army_card.pdf" \
  -F "documentType=Army Card"
```

### Gemini Custom Prompt
```bash
curl -X POST http://localhost:3000/api/gemini/call_gemini \
  -F "file=@document.pdf" \
  -F "prompt=Extract all dates and names from this document"
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

This project uses [Jest](https://jestjs.io/) as the testing framework and [Supertest](https://github.com/visionmedia/supertest) for testing HTTP endpoints.

### Prerequisites

Testing dependencies are already included in `devDependencies`:
- `jest` - JavaScript testing framework
- `supertest` - HTTP assertion library for testing Express endpoints

### Running Tests

#### Run all tests:
```bash
npm test
```

#### Run tests in watch mode (automatically re-runs on file changes):
```bash
npm run test:watch
```

#### Run tests with coverage report:
```bash
npm run test:coverage
```

#### Run a specific test file:
```bash
# Run math endpoint tests
npm test -- __tests__/math.test.js

# Run user management tests
npm test -- __tests__/users.test.js
```

### Test Structure

Tests are located in the `__tests__` directory:
- `__tests__/math.test.js` - Tests for the math verification endpoint
- `__tests__/users.test.js` - Tests for user management endpoints

### Test Coverage

#### Math Verification API (`/api/math/verify-sum`)
- ✅ Correct sum verification (positive, negative, zero, decimals, large numbers)
- ✅ Incorrect sum verification
- ✅ Input validation (missing fields, wrong types, null values)
- ✅ Edge cases (small decimals, negative results)
- **Total: 17 test cases**

#### User Management API (`/api/users`)
- ✅ GET /api/users - Get all users
- ✅ GET /api/users/:id - Get user by ID (success and error cases)
- ✅ POST /api/users - Create user (success and validation errors)
- ✅ PUT /api/users/:id - Update user (success and error cases)
- ✅ DELETE /api/users/:id - Delete user (success and error cases)
- ✅ Full CRUD integration tests
- **Total: 23 test cases**

### Writing New Tests

To add tests for a new endpoint, create a test file in the `__tests__` directory:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Your Endpoint', () => {
  test('should do something', async () => {
    const response = await request(app)
      .post('/api/your-endpoint')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('expectedProperty');
  });
});
```

### Test Configuration

Jest configuration is defined in `jest.config.js`:
- Test environment: Node.js
- Test file pattern: `**/__tests__/**/*.test.js`
- Coverage reports: text, lcov, html formats
- Coverage directory: `coverage/`

### Manual Testing

For manual testing of endpoints:
1. **Web Interface**: Open `http://localhost:3000/textract-test.html`
2. **Postman**: Use the endpoints with form-data file uploads
3. **Sample Files**: Use `sample-document.txt` for testing
4. **cURL**: Use the examples in the "Usage Examples" section above

## Dependencies

### Runtime Dependencies
- Express.js - Web framework
- AWS SDK v3 - S3 and Textract integration
- Google Generative AI - Gemini AI document processing
- Multer - File upload handling
- CORS, Helmet, Morgan - Security and logging
- dotenv - Environment configuration

### Development Dependencies
- Jest - JavaScript testing framework
- Supertest - HTTP assertion library for testing Express endpoints
- Nodemon - Development server with auto-restart

The service runs on http://localhost:3000
