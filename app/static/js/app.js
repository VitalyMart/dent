function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIcon(ext) {
    const icons = {
        // Видео
        'mp4': '<i class="fas fa-video"></i>',
        'webm': '<i class="fas fa-video"></i>',
        'ogg': '<i class="fas fa-video"></i>',
        'mov': '<i class="fas fa-video"></i>',
        'avi': '<i class="fas fa-video"></i>',
        'mkv': '<i class="fas fa-video"></i>',
        
        // Изображения
        'jpg': '<i class="fas fa-image"></i>',
        'jpeg': '<i class="fas fa-image"></i>',
        'png': '<i class="fas fa-image"></i>',
        'gif': '<i class="fas fa-image"></i>',
        'webp': '<i class="fas fa-image"></i>',
        'bmp': '<i class="fas fa-image"></i>',
        
        // PDF
        'pdf': '<i class="fas fa-file-pdf"></i>',
        
        // Документы Word
        'doc': '<i class="fas fa-file-word"></i>',
        'docx': '<i class="fas fa-file-word"></i>',
        
        // Презентации
        'ppt': '<i class="fas fa-file-powerpoint"></i>',
        'pptx': '<i class="fas fa-file-powerpoint"></i>',
        
        // Excel
        'xls': '<i class="fas fa-file-excel"></i>',
        'xlsx': '<i class="fas fa-file-excel"></i>',
        
        // Текстовые файлы
        'txt': '<i class="fas fa-file-alt"></i>',
        'md': '<i class="fas fa-file-alt"></i>',
    };
    
    return icons[ext] || '<i class="fas fa-file"></i>';
}

async function loadTree(path = "") {
    const url = `/api/tree?path=${encodeURIComponent(path)}`;
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
    }
    return await response.json();
}

function createNodeElement(node, parentUl) {
    const li = document.createElement('li');
    const wrapper = document.createElement('div');
    wrapper.className = `node-wrapper ${node.type}`;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'node-name';
    
    if (node.type === 'directory') {
        // Только иконка из Font Awesome, без эмодзи
        nameSpan.innerHTML = `<i class="fas fa-folder"></i><span>${escapeHtml(node.name)}</span>`;
    } else {
        // Иконка файла в зависимости от расширения
        const ext = getFileExtension(node.name);
        const icon = getFileIcon(ext);
        nameSpan.innerHTML = `${icon}<span>${escapeHtml(node.name)}</span>`;
        
        // Добавляем класс для дополнительной стилизации
        if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
            wrapper.classList.add('video');
        } else if (ext === 'pdf') {
            wrapper.classList.add('pdf');
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
            wrapper.classList.add('image');
        } else if (['doc', 'docx'].includes(ext)) {
            wrapper.classList.add('document');
        } else if (['ppt', 'pptx'].includes(ext)) {
            wrapper.classList.add('presentation');
        } else if (['xls', 'xlsx'].includes(ext)) {
            wrapper.classList.add('spreadsheet');
        }
    }
    
    nameSpan.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (node.type === 'directory') {
            const childUl = li.querySelector('ul');
            if (childUl) {
                childUl.style.display = childUl.style.display === 'none' ? '' : 'none';
                // Меняем иконку при открытии/закрытии папки
                const folderIcon = nameSpan.querySelector('i');
                if (childUl.style.display === 'none') {
                    folderIcon.className = 'fas fa-folder';
                } else {
                    folderIcon.className = 'fas fa-folder-open';
                }
            } else {
                // Меняем иконку на открытую папку
                const folderIcon = nameSpan.querySelector('i');
                folderIcon.className = 'fas fa-folder-open';
                await loadDirectoryContent(node.path, li);
            }
        } else {
            // Открываем файл в новой вкладке
            const encodedPath = encodeURIComponent(node.path).replace(/%2F/g, '/');
            const url = `/media/${encodedPath}`;
            window.open(url, '_blank');
        }
    });
    
    wrapper.appendChild(nameSpan);
    li.appendChild(wrapper);
    parentUl.appendChild(li);
    return li;
}

// Функция для экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        for (const child of children) {
            createNodeElement(child, childUl);
        }
        li.appendChild(childUl);
        nameSpan.removeChild(loadingSpan);
    } catch (err) {
        console.error(err);
        const errorSpan = document.createElement('span');
        errorSpan.innerHTML = ' <i class="fas fa-exclamation-circle"></i> Ошибка';
        errorSpan.style.color = '#dc3545';
        errorSpan.style.fontSize = '0.8rem';
        nameSpan.appendChild(errorSpan);
        setTimeout(() => {
            if (errorSpan.parentNode) errorSpan.remove();
        }, 2000);
    } finally {
        nameSpan.classList.remove('loading');
        nameSpan.innerHTML = originalHTML;
    }
}

async function initTree() {
    const container = document.getElementById('tree');
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

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', initTree);