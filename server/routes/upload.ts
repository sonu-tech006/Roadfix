import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are permitted for road evidence'));
    }
  }
});

// Real photograph upload endpoint
router.post('/', authenticate, upload.single('photo'), async (req: AuthRequest, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    const { stage, caption } = req.body;
    const filename = req.file.filename;

    // Check if Cloudinary credentials are provided in environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let finalUrl = `/uploads/${filename}`;
    let publicId = `roadfix_${Date.now()}`;

    // If Cloudinary is configured, upload to Cloudinary API
    if (cloudName && apiKey && apiSecret) {
      try {
        // Direct Cloudinary HTTP upload using formData or Node fetch
        const filePath = path.join(uploadDir, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

        const timestamp = Math.round(new Date().getTime() / 1000);
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');

        const formData = new URLSearchParams();
        formData.append('file', base64Data);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', 'roadfix_evidence');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (cloudRes.ok) {
          const cloudData: any = await cloudRes.json();
          finalUrl = cloudData.secure_url;
          publicId = cloudData.public_id;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning, falling back to permanent server upload:', cloudErr);
      }
    }

    res.status(201).json({
      message: 'Photograph uploaded successfully',
      url: finalUrl,
      publicId,
      filename,
      size: req.file.size,
      stage: stage || 'damage',
      caption: caption || '',
      uploadedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error uploading evidence photograph' });
  }
});

export default router;
