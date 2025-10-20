require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your-secret-key'
  }
});

// AWS Textract Configuration
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your-secret-key'
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-bucket-name';

// Configure multer for file uploads (in-memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// In-memory storage for users
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'simple-microservice'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Simple Microservice',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      s3: {
        upload: '/api/s3/upload',
        download: '/api/s3/download/:key',
        list: '/api/s3/files',
        delete: '/api/s3/delete/:key'
      },
      textract: {
        analyze: '/api/textract/analyze',
        extract: '/api/textract/extract'
      }
    }
  });
});

// Sample API routes
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newUser = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    name,
    email,
    updatedAt: new Date().toISOString()
  };
  
  res.json(users[userIndex]);
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({ message: 'User deleted successfully', user: deletedUser });
});

// S3 API routes
// Upload file to S3
app.post('/api/s3/upload', upload.single('file'), async (req, res) => {
  try {
    // Debug: Log what we received
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request files:', req.files);
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        received: {
          body: req.body,
          file: req.file,
          files: req.files
        }
      });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        key: fileName,
        originalName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get signed URL for file download
app.get('/api/s3/download/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    
    res.json({
      downloadUrl: signedUrl,
      expiresIn: 3600,
      key: key
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// List all files in S3 bucket
app.get('/api/s3/files', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME
    });

    const response = await s3Client.send(command);
    const files = response.Contents ? response.Contents.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      etag: file.ETag
    })) : [];

    res.json({
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file from S3
app.delete('/api/s3/delete/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    res.json({ message: 'File deleted successfully', key: key });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Helper function to structure raw text data
function structureTextData(blocks) {
  const structuredData = {
    document: {
      fullText: '',
      totalBlocks: 0,
      confidence: {
        average: 0,
        min: 100,
        max: 0
      }
    },
    content: {
      lines: [],
      paragraphs: [],
      headings: [],
      lists: []
    },
    entities: {
      words: [],
      numbers: [],
      dates: [],
      emails: [],
      phones: [],
      addresses: []
    },
    structure: {
      tables: [],
      forms: [],
      keyValuePairs: [],
      sections: []
    },
    metadata: {
      processingTime: new Date().toISOString(),
      blockTypes: {},
      pageCount: 1
    }
  };

  if (!blocks) return structuredData;

  let totalConfidence = 0;
  let confidenceCount = 0;
  const blockTypeCount = {};

  // Process blocks to extract different types of content
  blocks.forEach(block => {
    // Track block types
    blockTypeCount[block.BlockType] = (blockTypeCount[block.BlockType] || 0) + 1;
    structuredData.document.totalBlocks++;

    // Calculate confidence statistics
    if (block.Confidence) {
      totalConfidence += block.Confidence;
      confidenceCount++;
      structuredData.document.confidence.min = Math.min(structuredData.document.confidence.min, block.Confidence);
      structuredData.document.confidence.max = Math.max(structuredData.document.confidence.max, block.Confidence);
    }

    if (block.BlockType === 'LINE') {
      const lineData = {
        text: block.Text,
        confidence: block.Confidence,
        boundingBox: extractBoundingBox(block.Geometry),
        isHeading: isHeading(block.Text),
        isListItem: isListItem(block.Text)
      };

      structuredData.content.lines.push(lineData);
      structuredData.document.fullText += block.Text + '\n';

      // Categorize lines
      if (lineData.isHeading) {
        structuredData.content.headings.push(lineData);
      } else if (lineData.isListItem) {
        structuredData.content.lists.push(lineData);
      } else {
        structuredData.content.paragraphs.push(lineData);
      }

    } else if (block.BlockType === 'WORD') {
      const wordData = {
        text: block.Text,
        confidence: block.Confidence,
        boundingBox: extractBoundingBox(block.Geometry),
        type: categorizeWord(block.Text)
      };

      structuredData.entities.words.push(wordData);

      // Categorize words
      if (wordData.type === 'number') {
        structuredData.entities.numbers.push(wordData);
      } else if (wordData.type === 'email') {
        structuredData.entities.emails.push(wordData);
      } else if (wordData.type === 'phone') {
        structuredData.entities.phones.push(wordData);
      }

    } else if (block.BlockType === 'TABLE') {
      structuredData.structure.tables.push({
        id: block.Id,
        confidence: block.Confidence,
        boundingBox: extractBoundingBox(block.Geometry),
        rowCount: block.RowCount || 0,
        columnCount: block.ColumnCount || 0
      });

    } else if (block.BlockType === 'KEY_VALUE_SET') {
      const kvData = {
        id: block.Id,
        entityTypes: block.EntityTypes,
        confidence: block.Confidence,
        boundingBox: extractBoundingBox(block.Geometry),
        isKey: block.EntityTypes?.includes('KEY'),
        isValue: block.EntityTypes?.includes('VALUE')
      };

      structuredData.structure.keyValuePairs.push(kvData);

    } else if (block.BlockType === 'CELL') {
      // Handle table cells
      if (!structuredData.structure.tables.length) {
        structuredData.structure.tables.push({
          id: 'table-1',
          confidence: block.Confidence,
          cells: []
        });
      }
      
      structuredData.structure.tables[0].cells.push({
        text: block.Text,
        confidence: block.Confidence,
        rowIndex: block.RowIndex,
        columnIndex: block.ColumnIndex,
        boundingBox: extractBoundingBox(block.Geometry)
      });
    }
  });

  // Calculate average confidence
  if (confidenceCount > 0) {
    structuredData.document.confidence.average = Math.round((totalConfidence / confidenceCount) * 100) / 100;
  }

  // Set metadata
  structuredData.metadata.blockTypes = blockTypeCount;

  // Organize content into sections
  structuredData.structure.sections = organizeIntoSections(structuredData.content.lines);

  return structuredData;
}

// Helper functions for data processing
function extractBoundingBox(geometry) {
  if (!geometry || !geometry.BoundingBox) return null;
  
  const box = geometry.BoundingBox;
  return {
    left: Math.round(box.Left * 100) / 100,
    top: Math.round(box.Top * 100) / 100,
    width: Math.round(box.Width * 100) / 100,
    height: Math.round(box.Height * 100) / 100
  };
}

function isHeading(text) {
  if (!text) return false;
  const trimmed = text.trim();
  return (
    trimmed.length < 50 && 
    (trimmed === trimmed.toUpperCase() || 
     /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed))
  );
}

function isListItem(text) {
  if (!text) return false;
  return /^[\s]*[-•*]\s+/.test(text) || /^[\s]*\d+\.\s+/.test(text);
}

function categorizeWord(text) {
  if (!text) return 'text';
  
  if (/^\d+$/.test(text)) return 'number';
  if (/^\d+\.\d+$/.test(text)) return 'decimal';
  if (/^[\d\s\-\(\)\+]+$/.test(text) && text.length >= 10) return 'phone';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'email';
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text)) return 'date';
  
  return 'text';
}

function organizeIntoSections(lines) {
  const sections = [];
  let currentSection = null;
  
  lines.forEach((line, index) => {
    if (line.isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.text,
        content: [],
        startLine: index,
        confidence: line.confidence
      };
    } else if (currentSection) {
      currentSection.content.push(line.text);
    } else {
      // Content before first heading
      if (!sections.length) {
        sections.push({
          title: 'Introduction',
          content: [],
          startLine: 0,
          confidence: line.confidence
        });
      }
      sections[0].content.push(line.text);
    }
  });
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Textract API routes
// Analyze document with forms and tables
app.post('/api/textract/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Analyzing document with Textract...');
    
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: req.file.buffer
      },
      FeatureTypes: ['TABLES', 'FORMS']
    });

    const response = await textractClient.send(command);
    
    // Structure the raw data
    const structuredData = structureTextData(response.Blocks);
    
    res.status(200).json({
      success: true,
      message: 'Document analyzed successfully',
      request: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/textract/analyze',
        method: 'POST'
      },
      document: {
        info: {
          originalName: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
          processedAt: new Date().toISOString()
        },
        metadata: response.DocumentMetadata,
        statistics: {
          totalBlocks: structuredData.document.totalBlocks,
          confidence: structuredData.document.confidence,
          blockTypes: structuredData.metadata.blockTypes
        }
      },
      extractedData: {
        content: structuredData.content,
        entities: structuredData.entities,
        structure: structuredData.structure
      },
      rawData: {
        blocks: response.Blocks,
        fullText: structuredData.document.fullText
      }
    });
  } catch (error) {
    console.error('Textract analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze document',
      details: error.message 
    });
  }
});

// Extract text from document (simple text detection)
app.post('/api/textract/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Extracting text with Textract...');
    
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: req.file.buffer
      }
    });

    const response = await textractClient.send(command);
    
    // Structure the raw data
    const structuredData = structureTextData(response.Blocks);
    
    res.status(200).json({
      success: true,
      message: 'Text extracted successfully',
      request: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/textract/extract',
        method: 'POST'
      },
      document: {
        info: {
          originalName: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
          processedAt: new Date().toISOString()
        },
        metadata: response.DocumentMetadata,
        statistics: {
          totalBlocks: structuredData.document.totalBlocks,
          confidence: structuredData.document.confidence,
          blockTypes: structuredData.metadata.blockTypes
        }
      },
      extractedData: {
        content: structuredData.content,
        entities: structuredData.entities,
        structure: structuredData.structure
      },
      rawData: {
        blocks: response.Blocks,
        fullText: structuredData.document.fullText
      }
    });
  } catch (error) {
    console.error('Textract extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract text',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Simple Microservice running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API docs: http://localhost:${PORT}/`);
});

module.exports = app;
