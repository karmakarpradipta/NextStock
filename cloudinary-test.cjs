#!/usr/bin/env node
const cloudinary = require('cloudinary').v2;

// STEP 3.1 — Configure Cloudinary (Inline credentials)
cloudinary.config({
  cloud_name: 'dntaihjos',
  api_key: '692362946788356',
  api_secret: 'fGmKF6__WI2M0-2qj8VDw6JsrGc'
});

async function runTest() {
  try {
    console.log('--- Cloudinary Test Start ---');

    // STEP 3.2 — Upload an image (Sample URL from demo)
    const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';
    console.log(`Uploading sample image: ${sampleImageUrl}...`);
    
    const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
      public_id: 'nextstock_test_image',
    });

    console.log('Upload Success!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);

    // STEP 3.3 — Get image details
    // The uploadResult already contains many details, but we can fetch them via API if needed.
    // For this script, we'll use the result from the upload.
    console.log('\n--- Image Metadata ---');
    console.log('Width:', uploadResult.width, 'px');
    console.log('Height:', uploadResult.height, 'px');
    console.log('Format:', uploadResult.format);
    console.log('File Size:', uploadResult.bytes, 'bytes');

    // STEP 3.4 — Transform the image
    // f_auto: Automatically selects the best format (WebP, AVIF, etc.) for the browser.
    // q_auto: Automatically adjusts quality to balance file size and visual fidelity.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto', // f_auto
      quality: 'auto',      // q_auto
      secure: true
    });

    console.log('\n--- Transformation ---');
    console.log('Done! Click link below to see optimized version of the image. Check the size and the format.');
    console.log('Transformed URL:', transformedUrl);

  } catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
}

runTest();

