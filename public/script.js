const response = await fetch('/api/convert', {  // ✅ Fix: Use `/api/convert`
    method: 'POST',
    body: formData
});
