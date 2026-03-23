(function () {

    const directoryCache = new Map();


    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.9); opacity: 0; }
        }
    `;
    document.head.appendChild(modalStyles);


    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        fetch(favicon.href).catch(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#4ECDC4';
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('🦷', 6, 24);
            const fallbackFavicon = document.createElement('link');
            fallbackFavicon.rel = 'icon';
            fallbackFavicon.href = canvas.toDataURL('image/x-icon');
            document.head.appendChild(fallbackFavicon);
        });
    }
})();

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIcon(ext) {
    const icons = {
        'mp4': '<i class="fas fa-video"></i>',
        'webm': '<i class="fas fa-video"></i>',
        'ogg': '<i class="fas fa-video"></i>',
        'mov': '<i class="fas fa-video"></i>',
        'avi': '<i class="fas fa-video"></i>',
        'mkv': '<i class="fas fa-video"></i>',
        'jpg': '<i class="fas fa-image"></i>',
        'jpeg': '<i class="fas fa-image"></i>',
        'png': '<i class="fas fa-image"></i>',
        'gif': '<i class="fas fa-image"></i>',
        'webp': '<i class="fas fa-image"></i>',
        'bmp': '<i class="fas fa-image"></i>',
        'pdf': '<i class="fas fa-file-pdf"></i>',
        'doc': '<i class="fas fa-file-word"></i>',
        'docx': '<i class="fas fa-file-word"></i>',
        'ppt': '<i class="fas fa-file-powerpoint"></i>',
        'pptx': '<i class="fas fa-file-powerpoint"></i>',
        'xls': '<i class="fas fa-file-excel"></i>',
        'xlsx': '<i class="fas fa-file-excel"></i>',
        'txt': '<i class="fas fa-file-alt"></i>',
        'md': '<i class="fas fa-file-alt"></i>',
    };
    return icons[ext] || '<i class="fas fa-file"></i>';
}

function createGalleryImage(imageUrl, fileName) {
    const container = document.createElement('div');
    container.className = 'gallery-image';
    Object.assign(container.style, {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        padding: '5px',
        background: '#f8f9fa',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid #e9ecef',
        width: '120px',
        flexShrink: '0'
    });

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    Object.assign(img.style, {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '6px',
        transition: 'transform 0.3s ease'
    });

    const caption = document.createElement('span');
    caption.textContent = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
    caption.title = fileName;
    Object.assign(caption.style, {
        fontSize: '0.7rem',
        color: '#2c3e50',
        textAlign: 'center',
        wordBreak: 'break-word',
        maxWidth: '100px'
    });

    container.appendChild(img);
    container.appendChild(caption);

    container.onmouseenter = () => {
        img.style.transform = 'scale(1.05)';
        container.style.background = '#fff5e6';
        container.style.borderColor = '#EE761C';
    };
    container.onmouseleave = () => {
        img.style.transform = 'scale(1)';
        container.style.background = '#f8f9fa';
        container.style.borderColor = '#e9ecef';
    };

    container.onclick = (e) => {
        e.stopPropagation();
        showFullImage(imageUrl, fileName);
    };

    return container;
}

let currentModal = null;

function showFullImage(imageUrl, fileName) {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: '10000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        animation: 'fadeIn 0.3s ease'
    });

    const container = document.createElement('div');
    Object.assign(container.style, {
        maxWidth: '90%',
        maxHeight: '90%',
        position: 'relative',
        animation: 'scaleIn 0.3s ease'
    });

    const img = document.createElement('img');
    img.src = imageUrl;
    Object.assign(img.style, {
        maxWidth: '100%',
        maxHeight: '85vh',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    });

    const caption = document.createElement('div');
    caption.textContent = fileName;
    Object.assign(caption.style, {
        position: 'absolute',
        bottom: '-40px',
        left: '0',
        right: '0',
        textAlign: 'center',
        color: 'white',
        fontSize: '14px',
        padding: '8px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px'
    });

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '✕';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '-40px',
        right: '0',
        color: 'white',
        fontSize: '30px',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '50%',
        transition: 'all 0.2s ease'
    });

    closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(0,0,0,0.8)';
    closeBtn.onmouseleave = () => closeBtn.style.background = 'rgba(0,0,0,0.5)';

    container.appendChild(img);
    container.appendChild(caption);
    container.appendChild(closeBtn);
    modal.appendChild(container);

    modal.onclick = (e) => {
        if (e.target === modal || e.target === closeBtn) {
            modal.style.animation = 'fadeOut 0.2s ease';
            container.style.animation = 'scaleOut 0.2s ease';
            setTimeout(() => {
                modal.remove();
                currentModal = null;
            }, 200);
        }
    };

    currentModal = modal;
    document.body.appendChild(modal);
}

let activeRequests = new Map();

async function loadTree(path = "", signal = null) {
    const url = `/api/tree?path=${encodeURIComponent(path)}`;


    if (activeRequests.has(path)) {
        activeRequests.get(path).abort();
    }

    const abortController = new AbortController();
    activeRequests.set(path, abortController);

    try {
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        return data;
    } finally {
        activeRequests.delete(path);
    }
}

function createImageElement(imageNode, parentUl) {
    const li = document.createElement('li');
    Object.assign(li.style, {
        display: 'inline-block',
        margin: '5px'
    });

    const encodedPath = encodeURIComponent(imageNode.path).replace(/%2F/g, '/');
    const url = `/media/${encodedPath}`;
    const galleryImg = createGalleryImage(url, imageNode.name);

    li.appendChild(galleryImg);
    parentUl.appendChild(li);
    return li;
}

function createImagesFolder(images, parentUl) {
    const imagesFolderLi = document.createElement('li');
    imagesFolderLi.className = 'images-folder';

    const wrapper = document.createElement('div');
    wrapper.className = 'node-wrapper dir';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'node-name';
    nameSpan.innerHTML = `<i class="fas fa-images" style="color: #007bff;"></i><span>Изображения ${images.length}шт</span>`;

    const imagesUl = document.createElement('ul');
    Object.assign(imagesUl.style, {
        display: 'none',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '10px',
        background: '#fafbfc',
        borderRadius: '8px',
        marginTop: '5px'
    });

    for (const img of images) {
        createImageElement(img, imagesUl);
    }

    let isOpen = false;
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        const folderIcon = nameSpan.querySelector('i');

        if (isOpen) {
            imagesUl.style.display = 'none';
            folderIcon.style.color = '#007bff';
            isOpen = false;
        } else {
            imagesUl.style.display = 'flex';
            folderIcon.style.color = '#EE761C';
            isOpen = true;
        }
    });

    wrapper.appendChild(nameSpan);
    imagesFolderLi.appendChild(wrapper);
    imagesFolderLi.appendChild(imagesUl);
    parentUl.appendChild(imagesFolderLi);
    return imagesFolderLi;
}

function createNodeElement(node, parentUl) {
    const li = document.createElement('li');
    const wrapper = document.createElement('div');
    wrapper.className = `node-wrapper ${node.type}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'node-name';

    if (node.type === 'directory') {
        nameSpan.innerHTML = `<i class="fas fa-folder"></i><span>${escapeHtml(node.name)}</span>`;

        let isOpen = false;
        let childUl = null;

        wrapper.addEventListener('click', async (e) => {
            e.stopPropagation();
            const folderIcon = nameSpan.querySelector('i');

            if (childUl) {
                if (isOpen) {
                    childUl.style.display = 'none';
                    folderIcon.className = 'fas fa-folder';
                    isOpen = false;
                } else {
                    childUl.style.display = '';
                    folderIcon.className = 'fas fa-folder-open';
                    isOpen = true;
                }
            } else {
                folderIcon.className = 'fas fa-folder-open';
                childUl = await loadDirectoryContent(node.path, li);
                isOpen = true;
            }
        });
    } else {
        const ext = getFileExtension(node.name);
        const encodedPath = encodeURIComponent(node.path).replace(/%2F/g, '/');
        const url = `/media/${encodedPath}`;
        const icon = getFileIcon(ext);
        nameSpan.innerHTML = `${icon}<span>${escapeHtml(node.name)}</span>`;

        if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
            wrapper.classList.add('video');
        } else if (ext === 'pdf') {
            wrapper.classList.add('pdf');
        } else if (['doc', 'docx'].includes(ext)) {
            wrapper.classList.add('document');
        } else if (['ppt', 'pptx'].includes(ext)) {
            wrapper.classList.add('presentation');
        } else if (['xls', 'xlsx'].includes(ext)) {
            wrapper.classList.add('spreadsheet');
        }

        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(url, '_blank');
        });
    }

    wrapper.appendChild(nameSpan);
    li.appendChild(wrapper);
    parentUl.appendChild(li);
    return li;
}

async function loadDirectoryContent(path, li) {
    const wrapper = li.querySelector('.node-wrapper');
    const nameSpan = wrapper.querySelector('.node-name');
    const originalHTML = nameSpan.innerHTML;

    nameSpan.classList.add('loading');
    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'loading-text';
    loadingSpan.innerHTML = ' <i class="fas fa-spinner fa-pulse"></i> Загрузка...';
    nameSpan.appendChild(loadingSpan);

    try {
        const children = await loadTree(path);
        const childUl = document.createElement('ul');

        const folders = [];
        const images = [];
        const otherFiles = [];

        for (const child of children) {
            if (child.type === 'directory') {
                folders.push(child);
            } else {
                const ext = getFileExtension(child.name);
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                    images.push(child);
                } else {
                    otherFiles.push(child);
                }
            }
        }

        if (images.length > 0) {
            createImagesFolder(images, childUl);
        }

        for (const file of otherFiles) {
            createNodeElement(file, childUl);
        }

        for (const folder of folders) {
            createNodeElement(folder, childUl);
        }

        li.appendChild(childUl);
        nameSpan.removeChild(loadingSpan);
        return childUl;
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            const errorSpan = document.createElement('span');
            errorSpan.innerHTML = ' <i class="fas fa-exclamation-circle"></i> Ошибка';
            errorSpan.style.color = '#dc3545';
            errorSpan.style.fontSize = '0.8rem';
            nameSpan.appendChild(errorSpan);
            setTimeout(() => {
                if (errorSpan.parentNode) errorSpan.remove();
            }, 2000);
        }
        return null;
    } finally {
        nameSpan.classList.remove('loading');
        nameSpan.innerHTML = originalHTML;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function initTree() {
    const container = document.getElementById('tree');
    if (!container) return;

    container.innerHTML = '';
    const rootUl = document.createElement('ul');

    try {
        const rootItems = await loadTree('');

        if (rootItems.length === 0) {
            container.innerHTML = '<div class="error-message"><i class="fas fa-folder-open"></i> Папка files пуста. Добавьте файлы в директорию files/</div>';
            return;
        }

        for (const item of rootItems) {
            createNodeElement(item, rootUl);
        }
        container.appendChild(rootUl);
    } catch (err) {
        console.error('Init error:', err);
        container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки: ${escapeHtml(err.message)}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', initTree);