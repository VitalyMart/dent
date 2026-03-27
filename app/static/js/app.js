// Функции для работы с файлами и интерфейсом
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
    
    card.addEventListener('click', () => {
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
    
    card.addEventListener('click', () => {
        onClick(node.path);
    });
    
    return card;
}

function createImagesFolderCard(onClick) {
    const card = document.createElement('div');
    card.className = 'folder-card images-folder-card';
    
    const icon = document.createElement('div');
    icon.className = 'folder-card-icon';
    icon.innerHTML = '<i class="fas fa-images" style="color: #8B6B42;"></i>';
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'folder-card-name';
    nameSpan.textContent = 'Изображения';
    
    card.appendChild(icon);
    card.appendChild(nameSpan);
    
    card.addEventListener('click', () => {
        onClick();
    });
    
    return card;
}

function createGalleryImage(imageUrl, fileName) {
    const container = document.createElement('div');
    container.className = 'gallery-image';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    img.loading = 'lazy';
    
    const caption = document.createElement('span');
    caption.textContent = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
    caption.title = fileName;
    
    container.appendChild(img);
    container.appendChild(caption);
    
    container.onclick = () => {
        showFullImage(imageUrl, fileName);
    };
    
    return container;
}

let currentPath = '';

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

async function loadTree(path = "") {
    const headers = getAuthHeaders();
    const url = `/api/tree?path=${encodeURIComponent(path)}`;
    
    try {
        const response = await fetch(url, {
            headers,
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/auth.html';
            }
            throw new Error(`Ошибка ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error('Load tree error:', err);
        return [];
    }
}

function goToParent() {
    if (currentPath === '') return;
    const parts = currentPath.split('/');
    parts.pop();
    navigateTo(parts.join('/'));
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
        
        if (!items || items.length === 0) {
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
            cardsGrid.appendChild(createFolderCard(folder, (folderPath) => {
                navigateTo(folderPath);
            }));
        }
        
        if (images.length > 0) {
            cardsGrid.appendChild(createImagesFolderCard(() => {
                showImagesContent(images);
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
        console.error('Load content error:', err);
        container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</div>';
    }
}

function showImagesContent(images) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
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
            imagesContainer.appendChild(createGalleryImage(url, img.name));
        }
        
        container.innerHTML = '';
        container.appendChild(imagesContainer);
    }, 100);
}

function updatePathDisplay() {
    const pathDisplay = document.getElementById('current-path');
    if (!pathDisplay) return;
    
    if (currentPath === '') {
        pathDisplay.innerHTML = '<i class="fas fa-folder"></i> <span>Корневая папка</span>';
    } else {
        const displayPath = currentPath.replace(/\//g, ' / ');
        pathDisplay.innerHTML = `<i class="fas fa-folder-open"></i> <span>${escapeHtml(displayPath)}</span>`;
    }
}

let searchTimeout = null;

async function performSearch(query) {
    if (!query || !query.trim()) {
        hideSearchResults();
        return;
    }
    
    const trimmedQuery = query.trim();
    const resultsContainer = document.getElementById('search-results');
    const headers = getAuthHeaders();
    
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
        const response = await fetch(url, {
            headers,
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/auth.html';
            }
            throw new Error();
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
    
    const highlightMatch = (text, searchQuery) => {
        if (!searchQuery) return escapeHtml(text);
        const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    };
    
    const getResultIcon = (result) => {
        if (result.type === 'directory') return '<i class="fas fa-folder"></i>';
        const ext = result.extension || '';
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
            return '<i class="fas fa-image"></i>';
        }
        if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) {
            return '<i class="fas fa-video"></i>';
        }
        return '<i class="fas fa-file"></i>';
    };
    
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
    
    const html = results.map(result => {
        const icon = getResultIcon(result);
        const highlightedName = highlightMatch(result.name, query);
        
        return `
            <div class="search-result-item" data-path="${escapeAttr(result.path)}" data-type="${result.type}" data-name="${escapeAttr(result.name)}">
                <div class="search-result-icon">${icon}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${highlightedName}</div>
                    <div class="search-result-path">
                        <i class="fas fa-folder-open"></i>
                        <span>${escapeHtml(result.path || '')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('show');
    
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const path = item.dataset.path;
            const type = item.dataset.type;
            const name = item.dataset.name;
            
            if (type === 'directory') {
                navigateTo(path);
                hideSearchResults();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
            } else {
                const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
                const url = `/media/${encodedPath}`;
                const ext = (name || '').split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                    showFullImage(url, name);
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
                <p>Ошибка поиска</p>
            </div>
        `;
        resultsContainer.classList.add('show');
        setTimeout(() => hideSearchResults(), 2000);
    }
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (searchClear) searchClear.style.display = query ? 'flex' : 'none';
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(query), 300);
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
}

function logout() {
    fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
    }).finally(() => {
        window.location.href = '/auth.html';
    });
}

async function checkUserRole() {
    try {
        const response = await fetch('/auth/check', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        if (data.authenticated && data.user && data.user.role === 'admin') {
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Check role error:', error);
        return null;
    }
}

function addAdminButton() {
    const container = document.getElementById('admin-btn-container');
    if (!container) return;
    
    const adminBtn = document.createElement('button');
    adminBtn.id = 'admin-btn';
    adminBtn.className = 'admin-fixed-btn';
    adminBtn.innerHTML = '<i class="fas fa-crown"></i> Админ панель';
    adminBtn.style.cssText = `
        background: #01BB94;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 40px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
        font-family: inherit;
    `;
    
    adminBtn.addEventListener('mouseenter', () => {
        adminBtn.style.transform = 'translateY(-2px)';
        adminBtn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
    });
    
    adminBtn.addEventListener('mouseleave', () => {
        adminBtn.style.transform = 'translateY(0)';
        adminBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
    
    adminBtn.addEventListener('click', () => {
        window.location.href = '/admin.html';
    });
    
    container.appendChild(adminBtn);
}

async function init() {
    const backBtn = document.getElementById('back-btn');
    const rootPathBtn = document.getElementById('root-path-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToParent();
        });
    }
    
    if (rootPathBtn) {
        rootPathBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToRoot();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    currentPath = '';
    updatePathDisplay();
    await loadAndDisplayContent('');
    initSearch();
    
    const user = await checkUserRole();
    if (user && user.role === 'admin') {
        addAdminButton();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}