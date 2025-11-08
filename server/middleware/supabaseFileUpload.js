const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
});

const uploadToSupabase = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${req.file.originalname}`;
        const filePath = `verification/${fileName}`;

        const { data, error } = await supabase.storage
            .from('verification-documents')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload verification document'
            });
        }

        const { data: urlData } = supabase.storage
            .from('verification-documents')
            .getPublicUrl(filePath);

        req.file.supabasePath = filePath;
        req.file.publicUrl = urlData.publicUrl;
        req.file.path = filePath;

        next();
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
};

const uploadVerificationFile = [
    upload.single('verificationFile'),
    uploadToSupabase
];

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name for file upload.'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
};

module.exports = { 
    uploadVerificationFile, 
    handleUploadError
};