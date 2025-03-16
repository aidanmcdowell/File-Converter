import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';

// By default, Vercel serverless functions only have temporary storage.
// Files won't persist long-term, but this shows basic conversion logic.

export const config = {
  api: {
    bodyParser: false // Required for file uploads
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Use formidable to parse the incoming form data (file + targetFormat).
  const form = new formidable.IncomingForm({
    uploadDir: '/tmp',   // Temp directory on Vercel
    keepExtensions: true
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parsing error' });
    }

    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = files.file.filepath;
    const targetFormat = fields.targetFormat;
    const outputFileName = `converted-${Date.now()}.${targetFormat}`;
    const outputPath = path.join('/tmp', outputFileName);

    try {
      // Check the file type based on MIME.
      const typeGroup = (files.file.mimetype || '').split('/')[0];

      if (typeGroup === 'image') {
        await convertImage(inputPath, outputPath, targetFormat);
      } else if (typeGroup === 'video' || typeGroup === 'audio') {
        await convertMedia(inputPath, outputPath, targetFormat);
      } else if (typeGroup === 'application') {
        await convertDocument(inputPath, outputPath, targetFormat);
      } else {
        throw new Error('Unsupported file type');
      }

      // Return a success response
      return res.status(200).json({
        success: true,
        // We can't host the converted file for long on Vercel,
        // but you can read it and return it as a download if needed.
        downloadUrl: `/${outputFileName}`
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    } finally {
      // Clean up the input file
      fs.unlink(inputPath, () => {});
    }
  });
}

// Helpers

async function convertImage(input, output, format) {
  await sharp(input).toFormat(format).toFile(output);
}

function convertMedia(input, output, format) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .toFormat(format)
      .on('end', resolve)
      .on('error', reject)
      .save(output);
  });
}

async function convertDocument(input, output, format) {
  const content = fs.readFileSync(input);

  if (format === 'pdf') {
    // Basic PDF creation (empty).
    // You can do more complex logic with `pdf-lib`.
    const pdfDoc = await PDFDocument.create();
    // Optionally add pages, text, etc.
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(output, pdfBytes);
  } else if (format === 'docx') {
    // Simple docx with raw text content.
    const doc = new Document({
      sections: [
        {
          children: [new Paragraph(content.toString())]
        }
      ]
    });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(output, buffer);
  } else {
    // Simple text output if requested.
    fs.writeFileSync(output, content);
  }
}
