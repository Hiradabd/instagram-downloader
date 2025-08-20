// DOM Elements
const instagramUrlInput = document.getElementById('instagramUrl');
const downloadBtn = document.getElementById('downloadBtn');
const resultSection = document.getElementById('result');
const downloadResults = document.getElementById('downloadResults');
const loadingSection = document.getElementById('loading');
const errorSection = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const clearBtn = document.getElementById('clearBtn');

// Event Listeners
downloadBtn.addEventListener('click', handleDownload);
clearBtn.addEventListener('click', clearResults);
instagramUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

// Instagram URL patterns
const instagramPatterns = {
    post: /https?:\/\/(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/,
    reel: /https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?/,
    story: /https?:\/\/(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_.]+\/[0-9]+\/?/,
    igtv: /https?:\/\/(www\.)?instagram\.com\/tv\/[a-zA-Z0-9_-]+\/?/
};

// Main download handler
async function handleDownload() {
    const url = instagramUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter an Instagram URL');
        return;
    }
    
    if (!isValidInstagramUrl(url)) {
        showError('Please enter a valid Instagram URL (post, reel, story, or IGTV)');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const contentType = getContentType(url);
        const result = await simulateDownload(url, contentType);
        showResults(result);
    } catch (error) {
        showError('Failed to process the URL. Please try again or check if the content is public.');
    } finally {
        hideLoading();
    }
}

// Validate Instagram URL
function isValidInstagramUrl(url) {
    return Object.values(instagramPatterns).some(pattern => pattern.test(url));
}

// Get content type from URL
function getContentType(url) {
    if (instagramPatterns.post.test(url)) return 'post';
    if (instagramPatterns.reel.test(url)) return 'reel';
    if (instagramPatterns.story.test(url)) return 'story';
    if (instagramPatterns.igtv.test(url)) return 'igtv';
    return 'unknown';
}

// Simulate download process (in a real app, this would call a backend API)
async function simulateDownload(url, contentType) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    // Simulate different content types
    const mockData = {
        post: {
            title: 'Instagram Post',
            description: 'High quality image post',
            thumbnail: 'https://picsum.photos/seed/postthumb/300/300.jpg',
            downloadUrl: 'https://picsum.photos/seed/postfull/1200/1200.jpg',
            type: 'image'
        },
        reel: {
            title: 'Instagram Reel',
            description: 'Video reel content',
            thumbnail: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
            downloadUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            type: 'video'
        },
        story: {
            title: 'Instagram Story',
            description: 'Story content (24h)',
            thumbnail: 'https://picsum.photos/seed/storythumb/300/300.jpg',
            downloadUrl: 'https://picsum.photos/seed/storyfull/1080/1920.jpg',
            type: 'story'
        },
        igtv: {
            title: 'IGTV Video',
            description: 'Long-form video content',
            thumbnail: 'https://i.imgur.com/8KhHqYl.jpeg',
            downloadUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            type: 'video'
        }
    };
    
    return {
        ...mockData[contentType],
        originalUrl: url,
        contentType: contentType
    };
}

// Show download results
function showResults(result) {
    const resultHTML = `
        <div class="download-item">
            <img src="${result.thumbnail}" alt="${result.title}" onerror="this.src='https://via.placeholder.com/60x60/cccccc/ffffff?text=?'">
            <div class="download-item-info">
                <h4>${result.title}</h4>
                <p>${result.description}</p>
                <small>Type: ${result.type} | URL: ${result.originalUrl}</small>
            </div>
            <button class="download-item-btn" onclick="downloadFile('${result.downloadUrl}', '${result.title}', '${result.type}')">
                <i class="fas fa-download"></i>
                Download
            </button>
        </div>
    `;
    
    downloadResults.innerHTML = resultHTML;
    resultSection.style.display = 'block';
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Download file function
async function downloadFile(url, filename, type) {
    const safeName = sanitizeFilename(filename || 'instagram-content');
    showNotification(`Download started for: ${safeName}`, 'success');

    try {
        if (type === 'video') {
            const videoUrl = url && url !== '#' ? url : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            await attemptFetchAndDownload(videoUrl, safeName + '.mp4');
            showNotification('Video download completed!', 'success');
            return;
        }

        // Image or story fallback
        if (url && url !== '#') {
            try {
                await attemptFetchAndDownload(url, safeName + '.jpg');
                showNotification('Image download completed!', 'success');
                return;
            } catch (_) {
                // Fallback to direct link click if CORS blocks fetch
                triggerDownloadLink(url, safeName + '.jpg');
                return;
            }
        }

        // Generate a mock image if we don't have a direct URL
        await generateCanvasImageAndDownload(safeName);
        showNotification('Image download completed!', 'success');
    } catch (e) {
        showError('Unable to download the file in the browser. Try a different URL or ensure the content is public.');
    }
}

function sanitizeFilename(name) {
    return String(name)
        .replace(/[^a-z0-9\-_. ]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function attemptFetchAndDownload(resourceUrl, filename) {
    const response = await fetch(resourceUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
        triggerDownloadLink(objectUrl, filename);
    } finally {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
}

function triggerDownloadLink(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('download', filename || 'download');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    requestAnimationFrame(() => {
        if (a && a.parentNode) a.parentNode.removeChild(a);
    });
}

async function generateCanvasImageAndDownload(titleText) {
    const size = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Caption box
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const boxMargin = 80;
    const boxHeight = 360;
    ctx.fillRect(boxMargin, size - boxMargin - boxHeight, size - boxMargin * 2, boxHeight);

    // Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 72px Inter, Arial, sans-serif';
    ctx.fillText('Instagram Post', boxMargin + 40, size - boxMargin - boxHeight + 120);

    ctx.font = '400 42px Inter, Arial, sans-serif';
    const lines = [
        'This is a demo download file.',
        'Replace with real media via a backend API.',
        new Date().toLocaleString()
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, boxMargin + 40, size - boxMargin - boxHeight + 200 + i * 60);
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
    const objectUrl = URL.createObjectURL(blob);
    try {
        triggerDownloadLink(objectUrl, sanitizeFilename(titleText) + '.png');
    } finally {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
}

// Show loading state
function showLoading() {
    loadingSection.style.display = 'block';
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
}

// Hide loading state
function hideLoading() {
    loadingSection.style.display = 'none';
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

// Hide error message
function hideError() {
    errorSection.style.display = 'none';
}

// Clear results
function clearResults() {
    resultSection.style.display = 'none';
    downloadResults.innerHTML = '';
    instagramUrlInput.value = '';
    hideError();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add input focus effect
    instagramUrlInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    instagramUrlInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
    
    // Add paste event listener
    instagramUrlInput.addEventListener('paste', function(e) {
        setTimeout(() => {
            const pastedText = this.value;
            if (isValidInstagramUrl(pastedText)) {
                this.style.borderColor = '#28a745';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 2000);
            }
        }, 100);
    });
    
    // Add example URLs for testing
    const exampleUrls = [
        'https://www.instagram.com/p/ABC123/',
        'https://www.instagram.com/reel/XYZ789/',
        'https://www.instagram.com/stories/username/123456789/',
        'https://www.instagram.com/tv/DEF456/'
    ];
    
    // Add a small hint about example URLs
    const hint = document.createElement('div');
    hint.innerHTML = `
        <small style="color: #666; margin-top: 10px; display: block; text-align: center;">
            💡 Try pasting any Instagram post, reel, story, or IGTV URL
        </small>
    `;
    instagramUrlInput.parentElement.appendChild(hint);
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to download
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleDownload();
    }
    
    // Escape to clear
    if (e.key === 'Escape') {
        clearResults();
    }
});
