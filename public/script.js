async function convertFile() {
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('targetFormat', formatSelect.value);

    try {
        const response = await fetch('/api/convert', {  // ✅ Fix: Use inside async function
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Conversion failed');
        }

        const data = await response.json();
        console.log("Conversion successful:", data);

    } catch (error) {
        console.error("Error:", error);
    }
}

// Make sure convertFile() is triggered when clicking convert button
convertButton.addEventListener
