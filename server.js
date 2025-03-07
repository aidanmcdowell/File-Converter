const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { PDFDocument } = require('pdf-lib');
const { Document, Packer, Paragraph } = require('docx');

const app = express();
const port = 3000;

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ensure upload and converted directories exist
['uploads', 'converted'].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

app.use(express.static('public'));
app.use('/converted', express.static('converted'));

// File conversion endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const targetFormat = req.body.targetFormat;
    const outputFileName = `${Date.now()}.${targetFormat}`;
    const outputPath = path.join('converted', outputFileName);

    try {
        switch (req.file.mimetype.split('/')[0]) {
            case 'image':
                await convertImage(inputPath, outputPath, targetFormat);
                break;
            case 'video':
            case 'audio':
                await convertMedia(inputPath, outputPath, targetFormat);
                break;
            case 'application':
                await convertDocument(inputPath, outputPath, targetFormat);
                break;
            default:
                throw new Error('Unsupported file type');
        }

        res.json({
            success: true,
            downloadUrl: `/converted/${outputFileName}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up uploaded file
        fs.unlink(inputPath, () => {});
    }
});

// Image conversion function
async function convertImage(input, output, format) {
    await sharp(input)
        .toFormat(format)
        .toFile(output);
}

// Media conversion function
function convertMedia(input, output, format) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .toFormat(format)
            .on('end', resolve)
            .on('error', reject)
            .save(output);
    });
}

// Document conversion function
async function convertDocument(input, output, format) {
    const content = fs.readFileSync(input);
    
    if (format === 'pdf') {
        const doc = await PDFDocument.create();
        await doc.save(output);
    } else if (format === 'docx') {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [new Paragraph({ text: content.toString() })]
            }]
        });
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(output, buffer);
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
