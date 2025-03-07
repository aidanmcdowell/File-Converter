document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const fileInfo = document.getElementById('file-info');
    const conversionOptions = document.querySelector('.conversion-options');
    const formatSelect = document.getElementById('formatSelect');
    const convertButton = document.getElementById('convertButton');
    const progress = document.getElementById('progress');
    const progressFill = document.querySelector('.progress-fill');
    const status = document.getElementById('status');

    let currentFile = null;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when file is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Handle upload button click
    uploadButton.addEventListener('click', () => fileInput.click());

    // Handle convert button click
    convertButton.addEventListener('click', convertFile);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        handleFile(file);
    }

    function handleFile(file) {
        currentFile = file;
        fileInfo.textContent = `Selected file: ${file.name}`;
        conversionOptions.style.display = 'block';
        progress.style.display = 'none';
        updateFormatOptions(file);
    }

    function updateFormatOptions(file) {
        const type = file.type.split('/')[0];
        const optgroups = formatSelect.getElementsByTagName('optgroup');
        
        for (let optgroup of optgroups) {
            if (type === 'image' && optgroup.label === 'Images' ||
                type === 'video' && optgroup.label === 'Video' ||
                type === 'audio' && optgroup.label === 'Audio' ||
                (type === 'application' || type === 'text') && optgroup.label === 'Documents') {
                optgroup.style.display = '';
            } else {
                optgroup.style.display = 'none';
            }
        }

        // Select first available option
        for (let option of formatSelect.options) {
            if (option.parentElement.style.display !== 'none') {
                formatSelect.value = option.value;
                break;
            }
        }
    }

    async function convertFile() {
        if (!currentFile) return;

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('targetFormat', formatSelect.value);

        progress.style.display = 'block';
        progressFill.style.width = '0%';
        status.textContent = 'Converting...';
        convertButton.disabled = true;

        try {
            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Conversion failed');
            }

            const data = await response.json();
            progressFill.style.width = '100%';
            status.textContent = 'Conversion complete!';

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = data.downloadUrl;
            downloadLink.download = `converted.${formatSelect.value}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

        } catch (error) {
            status.textContent = 'Error: ' + error.message;
            progressFill.style.width = '0%';
        } finally {
            convertButton.disabled = false;
        }
    }
});
