const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const convertButton = document.getElementById('convertButton');
const formatSelect = document.getElementById('formatSelect');

let currentFile = null;

uploadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  currentFile = e.target.files[0];
  // Show conversion options once file is selected
  if (currentFile) {
    document.querySelector('.conversion-options').style.display = 'block';
  }
});

convertButton.addEventListener('click', async () => {
  if (!currentFile) return;

  // Show progress (basic)
  document.getElementById('progress').style.display = 'block';
  document.getElementById('status').textContent = 'Converting...';

  const formData = new FormData();
  formData.append('file', currentFile);
  formData.append('targetFormat', formatSelect.value);

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Conversion failed');

    const data = await response.json();
    console.log('Conversion successful:', data);

    // Hide progress
    document.getElementById('status').textContent = 'Done.';
    // If you want to show a link to download:
    // alert(`Download file at: ${data.downloadUrl}`);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('status').textContent = 'Error.';
  }
});
