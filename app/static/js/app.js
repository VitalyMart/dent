(function () {
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.95); opacity: 0; }
        }
    `;
    document.head.appendChild(modalStyles);
})();

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIcon(ext, isFolder = false) {
    if (isFolder) {
        return '<i class="fas fa-folder" style="color: #E6B17E;"></i>';
    }
    
    const icons = {
        'mp4': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'webm': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'ogg': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'mov': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'avi': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'mkv': '<i class="fas fa-video" style="color: #D95B5B;"></i>',
        'jpg': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'jpeg': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'png': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'gif': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'webp': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'bmp': '<i class="fas fa-image" style="color: #6BA5B3;"></i>',
        'pdf': '<i class="fas fa-file-pdf" style="color: #D96C6C;"></i>',
        'doc': '<i class="fas fa-file-word" style="color: #4A90A4;"></i>',
        'docx': '<i class="fas fa-file-word" style="color: #4A90A4;"></i>',
        'ppt': '<i class="fas fa-file-powerpoint" style="color: #E68A2E;"></i>',
        'pptx': '<i class="fas fa-file-powerpoint" style="color: #E68A2E;"></i>',
        'xls': '<i class="fas fa-file-excel" style="color: #4CAF7A;"></i>',
        'xlsx': '<i class="fas fa-file-excel" style="color: #4CAF7A;"></i>',
        'txt': '<i class="fas fa-file-alt" style="color: #B89A6E;"></i>',
        'md': '<i class="fas fa-file-alt" style="color: #B89A6E;"></i>',
    };
    return icons[ext] || '<i class="fas fa-file" style="color: #B89A6E;"></i>';
}

function createGalleryImage(imageUrl, fileName) {
    const container = document.createElement('div');
    container.className = 'gallery-image';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    
    const caption = document.createElement('span');
    caption.textContent = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
    caption.title = fileName;
    
    container.appendChild(img);
    container.appendChild(caption);
    
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
    modal.className = 'image-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'image-modal-content';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    img.className = 'image-modal-img';
    
    const caption = document.createElement('div');
    caption.className = 'image-modal-caption';
    caption.textContent = fileName;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => closeModal(modal, modalContent);
    
    modalContent.appendChild(img);
    modalContent.appendChild(caption);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal(modal, modalContent);
        }
    };
    
    document.body.appendChild(modal);
    currentModal = modal;
    
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
}

function closeModal(modal, modalContent) {
    modal.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    setTimeout(() => {
        modal.remove();
        currentModal = null;
    }, 200);
}

let currentPath = '';
let history = [];

async function loadTree(path = "") {
    const url = `/api/tree?path=${encodeURIComponent(path)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

function createFileCard(node) {
    const card = document.createElement('div');
    card.className = 'file-card';
    
    const icon = document.createElement('div');
    icon.className = 'file-card-icon';
    const ext = getFileExtension(node.name);
    icon.innerHTML = getFileIcon(ext, false);
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'file-card-name';
    nameSpan.textContent = node.name.length > 28 ? node.name.substring(0, 25) + '...' : node.name;
    nameSpan.title = node.name;
    
    card.appendChild(icon);
    card.appendChild(nameSpan);
    
    const encodedPath = encodeURIComponent(node.path).replace(/%2F/g, '/');
    const url = `/media/${encodedPath}`;
    
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
            showFullImage(url, node.name);
        } else {
            window.open(url, '_blank');
        }
    });
    
    return card;
}

function createFolderCard(node, onClick) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    
    const icon = document.createElement('div');
    icon.className = 'folder-card-icon';
    icon.innerHTML = getFileIcon('', true);
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'folder-card-name';
    nameSpan.textContent = node.name.length > 28 ? node.name.substring(0, 25) + '...' : node.name;
    nameSpan.title = node.name;
    
    card.appendChild(icon);
    card.appendChild(nameSpan);
    
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(node.path, node.name);
    });
    
    return card;
}

function createImagesFolderCard(node, onClick) {
    const card = document.createElement('div');
    card.className = 'folder-card images-folder-card';
    
    const icon = document.createElement('div');
    icon.className = 'folder-card-icon';
    icon.innerHTML = '<i class="fas fa-images" style="color: #8B6B42;"></i>';
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'folder-card-name';
    nameSpan.textContent = node.name.length > 28 ? node.name.substring(0, 25) + '...' : node.name;
    nameSpan.title = node.name;
    
    card.appendChild(icon);
    card.appendChild(nameSpan);
    
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(node.path, node.name);
    });
    
    return card;
}

function goToParent() {
    if (currentPath === '') {
        return;
    }
    
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    navigateTo(parentPath);
}

function goToRoot() {
    navigateTo('');
}

async function navigateTo(path) {
    currentPath = path;
    updatePathDisplay();
    await loadAndDisplayContent(path);
}

async function loadAndDisplayContent(path) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-pulse fa-2x"></i><p>Загрузка...</p></div>';
    
    try {
        const items = await loadTree(path);
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-folder">
                    <i class="fas fa-folder-open"></i>
                    <p>Папка пуста</p>
                </div>
            `;
            return;
        }
        
        const folders = [];
        const images = [];
        const otherFiles = [];
        
        for (const item of items) {
            if (item.type === 'directory') {
                folders.push(item);
            } else {
                const ext = getFileExtension(item.name);
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                    images.push(item);
                } else {
                    otherFiles.push(item);
                }
            }
        }
        
        container.innerHTML = '';
        
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'cards-grid';
        
        for (const file of otherFiles) {
            cardsGrid.appendChild(createFileCard(file));
        }
        
        for (const folder of folders) {
            cardsGrid.appendChild(createFolderCard(folder, (folderPath, folderName) => {
                navigateTo(folderPath);
            }));
        }
        
        if (images.length > 0) {
            const imagesFolder = {
                path: path ? path + '/_images' : '_images',
                name: 'Изображения',
                type: 'directory'
            };
            cardsGrid.appendChild(createImagesFolderCard(imagesFolder, async (folderPath, folderName) => {
                await showImagesContent(images, folderName);
            }));
        }
        
        if (cardsGrid.children.length > 0) {
            container.appendChild(cardsGrid);
        } else {
            container.innerHTML = `
                <div class="empty-folder">
                    <i class="fas fa-folder-open"></i>
                    <p>Папка пуста</p>
                </div>
            `;
        }
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</div>';
    }
}

async function showImagesContent(images, folderName) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    history.push(currentPath);
    currentPath = currentPath ? currentPath + '/_images' : '_images';
    updatePathDisplay();
    
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-pulse fa-2x"></i><p>Загрузка изображений...</p></div>';
    
    setTimeout(() => {
        if (images.length === 0) {
            container.innerHTML = `
                <div class="empty-folder">
                    <i class="fas fa-folder-open"></i>
                    <p>Нет изображений</p>
                </div>
            `;
            return;
        }
        
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'images-container-full';
        
        for (const img of images) {
            const encodedPath = encodeURIComponent(img.path).replace(/%2F/g, '/');
            const url = `/media/${encodedPath}`;
            const galleryImg = createGalleryImage(url, img.name);
            imagesContainer.appendChild(galleryImg);
        }
        
        container.innerHTML = '';
        container.appendChild(imagesContainer);
    }, 100);
}

function updatePathDisplay() {
    const pathDisplay = document.getElementById('current-path');
    if (pathDisplay) {
        if (currentPath === '') {
            pathDisplay.innerHTML = '<i class="fas fa-folder"></i> <span>Корневая папка</span>';
        } else {
            const parts = currentPath.split('/');
            let displayPath = '';
            
            if (parts.length > 2) {
                displayPath = '... / ' + parts.slice(-2).join(' / ');
            } else {
                displayPath = currentPath.replace(/\//g, ' / ');
            }
            
            pathDisplay.innerHTML = `<i class="fas fa-folder-open"></i> <span>${displayPath}</span>`;
        }
    }
}

async function initTree() {
    const mainContainer = document.getElementById('tree');
    if (!mainContainer) return;
    
    mainContainer.innerHTML = `
        <div class="navigation-bar">
            <button class="back-btn" id="back-btn"><i class="fas fa-arrow-left"></i> Назад</button>
            <button class="root-path-btn" id="root-path-btn"><i class="fas fa-folder"></i> Корневая папка</button>
            <div class="current-path" id="current-path"></div>
        </div>
        <div class="content-container" id="content-container">
            <div class="loading-spinner"><i class="fas fa-spinner fa-pulse fa-2x"></i><p>Загрузка...</p></div>
        </div>
    `;
    
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToParent();
        });
        backBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            goToParent();
        });
    }
    
    const rootPathBtn = document.getElementById('root-path-btn');
    if (rootPathBtn) {
        rootPathBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToRoot();
        });
        rootPathBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            goToRoot();
        });
    }
    
    currentPath = '';
    updatePathDisplay();
    
    await loadAndDisplayContent('');
}

let searchTimeout = null;

async function performSearch(query) {
    if (!query || !query.trim()) {
        hideSearchResults();
        return;
    }
    
    const trimmedQuery = query.trim();
    
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <i class="fas fa-spinner fa-pulse"></i>
                <p>Поиск...</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    }
    
    try {
        const url = `/api/search?q=${encodeURIComponent(trimmedQuery)}&max_results=50`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Search failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        displaySearchResults(data.results, trimmedQuery);
        
    } catch (error) {
        console.error('Search error:', error);
        showSearchError();
    }
}

function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-folder-open"></i>
                <p>Ничего не найдено для "${escapeHtml(query)}"</p>
            </div>
        `;
        resultsContainer.classList.add('show');
        return;
    }
    
    const highlightMatch = (text, searchQuery) => {
        if (!searchQuery) return escapeHtml(text);
        const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    };
    
    const getFileIcon = (result) => {
        if (result.type === 'directory') {
            return '<i class="fas fa-folder"></i>';
        }
        
        const ext = result.extension || '';
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
            return '<i class="fas fa-image"></i>';
        }
        if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) {
            return '<i class="fas fa-video"></i>';
        }
        if (ext === '.pdf') {
            return '<i class="fas fa-file-pdf"></i>';
        }
        if (['.doc', '.docx'].includes(ext)) {
            return '<i class="fas fa-file-word"></i>';
        }
        if (['.ppt', '.pptx'].includes(ext)) {
            return '<i class="fas fa-file-powerpoint"></i>';
        }
        if (['.xls', '.xlsx'].includes(ext)) {
            return '<i class="fas fa-file-excel"></i>';
        }
        if (['.txt', '.md'].includes(ext)) {
            return '<i class="fas fa-file-alt"></i>';
        }
        return '<i class="fas fa-file"></i>';
    };
    
    const html = results.map(result => {
        const icon = getFileIcon(result);
        const highlightedName = highlightMatch(result.name, query);
        const displayPath = result.path || '';
        
        return `
            <div class="search-result-item" data-path="${escapeAttr(result.path)}" data-type="${result.type}" data-name="${escapeAttr(result.name)}">
                <div class="search-result-icon">${icon}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${highlightedName}</div>
                    <div class="search-result-path">
                        <i class="fas fa-folder-open"></i>
                        <span>${escapeHtml(displayPath)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('show');
    
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = item.dataset.path;
            const type = item.dataset.type;
            const name = item.dataset.name;
            
            if (type === 'directory') {
                if (typeof navigateTo === 'function') {
                    navigateTo(path);
                }
                hideSearchResults();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
            } else {
                const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
                const url = `/media/${encodedPath}`;
                
                const ext = (name || '').split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                    if (typeof showFullImage === 'function') {
                        showFullImage(url, name);
                    } else {
                        window.open(url, '_blank');
                    }
                } else {
                    window.open(url, '_blank');
                }
                hideSearchResults();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
            }
        });
    });
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.classList.remove('show');
    }
}

function showSearchError() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка поиска. Попробуйте позже.</p>
            </div>
        `;
        resultsContainer.classList.add('show');
        setTimeout(() => {
            if (resultsContainer.classList.contains('show')) {
                resultsContainer.classList.remove('show');
            }
        }, 2000);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;');
}

function escapeRegex(string) {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) {
        return;
    }
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            hideSearchResults();
            searchInput.focus();
        });
    }
    
    document.addEventListener('click', (e) => {
        if (searchResults && 
            !searchResults.contains(e.target) && 
            e.target !== searchInput &&
            e.target !== searchClear) {
            hideSearchResults();
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value;
            if (query && query.trim()) {
                performSearch(query);
            }
        }
    });
    
    if (searchResults) {
        searchResults.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTree();
    initSearch();
});