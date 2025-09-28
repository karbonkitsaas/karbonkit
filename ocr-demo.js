// ILMU OCR + Tesseract.js Demo
// This script demonstrates automated mapping using Tesseract.js

import Tesseract from 'tesseract.js';

// Add UI for uploading images and displaying recognized text
const uploadInput = document.createElement('input');
uploadInput.type = 'file';
uploadInput.accept = 'image/*';
uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      Tesseract.recognize(
        image,
        'eng',
        {
          logger: info => console.log(info),
        }
      ).then(({ data: { text } }) => {
        console.log('Recognized Text:', text);
        // Add mapping logic here
      }).catch(error => {
        console.error('Error:', error);
      });
    };
    reader.readAsDataURL(file);
  }
});
document.body.appendChild(uploadInput);