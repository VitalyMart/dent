function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function copyToClipboard(text, successMessage) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 99999);

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(successMessage, 'success');
        } else {
            showToast('Не удалось скопировать', 'error');
        }
    } catch (err) {
        showToast('Ошибка копирования', 'error');
    }

    document.body.removeChild(textarea);
}

async function checkAuth() {
    try {
        const response = await fetch('/auth/check', { credentials: 'same-origin' });
        if (!response.ok) { window.location.href = '/auth.html'; return false; }
        const data = await response.json();
        if (!data.authenticated || data.user.role !== 'admin') {
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = '/auth.html';
        return false;
    }
}

let currentUserId = null;
let currentFolderPath = '';

async function getCurrentUser() {
    try {
        const response = await fetch('/auth/check', { credentials: 'same-origin' });
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
                currentUserId = data.user.id;
                return data.user;
            }
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '也许<td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-pulse"></i> Загрузка...</td>';
    try {
        const response = await fetch('/admin/users', { credentials: 'same-origin' });
        if (!response.ok) throw new Error();
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Ошибка загрузки</td></tr>';
        showToast('Ошибка загрузки пользователей', 'error');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Нет пользователей</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(user => {
        const isCurrentUser = user.id === currentUserId;
        return `
            <tr data-user-id="${user.id}">
                <td>${user.id}</td>
                <td>${escapeHtml(user.username)}</td>
                <td><span class="role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">${user.role === 'admin' ? 'Админ' : 'Пользователь'}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td class="action-buttons">
                    ${!isCurrentUser ? `<button class="action-btn reset-pwd" onclick="resetPassword(${user.id}, '${escapeHtml(user.username)}')" title="Сменить пароль"><i class="fas fa-sync-alt"></i></button>` : ''}
                    <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Удалить"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function formatDate(dateStr) { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('ru-RU'); }

async function deleteUser(userId) {
    if (!confirm('Удалить пользователя?')) return;
    try {
        const response = await fetch(`/admin/users/${userId}`, { method: 'DELETE', credentials: 'same-origin' });
        if (!response.ok) throw new Error();
        showToast('Пользователь удален', 'success');
        loadUsers();
    } catch (error) { showToast('Ошибка удаления', 'error'); }
}

async function resetPassword(userId, username) {
    if (!confirm(`Сменить пароль для пользователя ${username}?`)) return;
    try {
        const response = await fetch(`/admin/users/${userId}/reset-password`, { method: 'POST', credentials: 'same-origin' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        showPasswordModal(username, data.password);
    } catch (error) {
        showToast('Ошибка смены пароля', 'error');
    }
}

function showPasswordModal(username, password) {
    const modal = document.getElementById('password-modal');
    if (!modal) return;
    document.getElementById('pwd-username').textContent = username;
    document.getElementById('pwd-value').textContent = password;
    modal.classList.add('show');

    const closeModalFn = () => modal.classList.remove('show');
    const closeBtn = modal.querySelector('.password-close');
    if (closeBtn) closeBtn.onclick = closeModalFn;
    modal.onclick = (e) => { if (e.target === modal) closeModalFn(); };

    const copyBtn = document.getElementById('copy-pwd-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const pwdText = document.getElementById('pwd-value').textContent;
            copyToClipboard(pwdText, 'Пароль скопирован');
        };
    }
}

async function createUser(userData) {
    try {
        const response = await fetch('/admin/users', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (data.password) {
            showPasswordModal(data.username, data.password);
        }
        closeModal();
        loadUsers();
    } catch (error) { showToast('Ошибка создания', 'error'); }
}

async function massCreateUsers(count, prefix, role, commonPassword) {
    try {
        const response = await fetch('/admin/users/mass', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ count, prefix, role, common_password: commonPassword || null })
        });
        if (!response.ok) throw new Error();
        const data = await response.json();

        if (data.users && data.users.length) {
            let usersList = data.users.map(u => `${u.username}: ${u.password}`).join('\n');
            showUsersListModal(usersList, data.created);
        } else {
            showToast(`Создано ${data.created} пользователей`, 'success');
        }
        closeMassModal();
        loadUsers();
    } catch (error) { showToast('Ошибка массового создания', 'error'); }
}

function showUsersListModal(usersList, count) {
    let modal = document.getElementById('users-list-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'users-list-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Созданные пользователи (${count})</h3>
                    <button class="close-btn users-list-close">&times;</button>
                </div>
                <div class="users-list-content" style="padding: 20px;">
                    <textarea id="users-list-textarea" readonly style="width:100%; height:300px; font-family:monospace; padding:10px; border:1px solid #ddd; border-radius:6px; resize:vertical;"></textarea>
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <button id="copy-all-users-btn" class="btn-primary">Скопировать все</button>
                        <button id="close-users-list-btn" class="btn-secondary">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const textarea = modal.querySelector('#users-list-textarea');
    textarea.value = usersList;

    modal.classList.add('show');

    const closeModal = () => modal.classList.remove('show');
    modal.querySelector('.users-list-close').onclick = closeModal;
    modal.querySelector('#close-users-list-btn').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    document.getElementById('copy-all-users-btn').onclick = () => {
        const textArea = modal.querySelector('#users-list-textarea');
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        document.execCommand('copy');
        showToast('Все пароли скопированы', 'success');
    };
}

async function loadFileBrowser(path = '') {
    const container = document.getElementById('file-browser');
    if (!container) return;
    currentFolderPath = path;
    updateCurrentFolderPathDisplay();
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i> Загрузка...</div>';
    try {
        const response = await fetch(`/admin/files?path=${encodeURIComponent(path)}`, { credentials: 'same-origin' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        renderFileBrowser(data.items, path);
    } catch (error) {
        container.innerHTML = '<div class="error-message">Ошибка загрузки файлов</div>';
    }
}

function updateCurrentFolderPathDisplay() {
    const displayDiv = document.getElementById('current-folder-path-display');
    if (!displayDiv) return;
    if (currentFolderPath === '') {
        displayDiv.innerHTML = '<i class="fas fa-folder-open"></i> Текущая папка: <strong>Корень</strong>';
    } else {
        displayDiv.innerHTML = `<i class="fas fa-folder-open"></i> Текущая папка: <strong>${escapeHtml(currentFolderPath)}</strong>`;
    }
}

function copyCurrentFolderPath() {
    let pathToCopy = '';
    if (currentFolderPath === '') {
        pathToCopy = '';
    } else {
        pathToCopy = `${currentFolderPath}/`;
    }
    copyToClipboard(pathToCopy, 'Путь скопирован: ' + pathToCopy);
}

function renderFileBrowser(items, currentPath) {
    const container = document.getElementById('file-browser');
    if (!container) return;
    if (currentPath) {
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        const upButton = document.createElement('button');
        upButton.className = 'back-btn-folder';
        upButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        upButton.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border-radius: 50%; font-size: 1.2rem; cursor: pointer;';
        upButton.onclick = () => loadFileBrowser(parentPath);
        container.innerHTML = '';
        container.appendChild(upButton);
    } else {
        container.innerHTML = '';
    }
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `file-item ${item.is_dir ? 'folder-item' : 'file-item'}`;
        itemDiv.innerHTML = `
            <div class="file-info">
                <i class="fas ${item.is_dir ? 'fa-folder' : getFileIconClass(item.name)}"></i>
                <span class="file-name">${escapeHtml(item.name)}</span>
            </div>
            <div class="file-actions">
                <button class="action-icon" onclick="renameFile('${item.path}', '${item.name}', ${item.is_dir})" title="Переименовать"><i class="fas fa-edit"></i></button>
                <button class="action-icon" onclick="moveFile('${item.path}', '${item.name}')" title="Переместить"><i class="fas fa-arrow-right"></i></button>
                <button class="action-icon delete" onclick="deleteFile('${item.path}', ${item.is_dir})" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>
        `;
        if (item.is_dir) {
            itemDiv.onclick = (e) => { if (!e.target.closest('.file-actions')) loadFileBrowser(item.path); };
        }
        container.appendChild(itemDiv);
    });
}

function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'fa-image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'fa-video';
    if (['pdf'].includes(ext)) return 'fa-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
    return 'fa-file';
}

let selectedFile = null;

function initCustomFileInput() {
    const customBtn = document.getElementById('custom-file-btn');
    const fileInput = document.getElementById('upload-file');
    const displayDiv = document.getElementById('file-name-display');

    if (!customBtn || !fileInput || !displayDiv) return;

    customBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files && fileInput.files[0]) {
            selectedFile = fileInput.files[0];
            const fileName = selectedFile.name;
            const nameSpan = displayDiv.querySelector('.file-name-text');
            const icon = displayDiv.querySelector('i');
            nameSpan.textContent = fileName;
            displayDiv.setAttribute('title', fileName);
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#01BB94';
        } else {
            selectedFile = null;
            const nameSpan = displayDiv.querySelector('.file-name-text');
            const icon = displayDiv.querySelector('i');
            nameSpan.textContent = 'Файл не выбран';
            displayDiv.setAttribute('title', 'Файл не выбран');
            icon.className = 'fas fa-info-circle';
            icon.style.color = '#7f8c8d';
        }
    });
}

async function uploadFile() {
    if (!selectedFile) {
        showToast('Выберите файл', 'error');
        return;
    }
    const path = document.getElementById('upload-path').value;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('path', path);
    try {
        const response = await fetch('/admin/files/upload', {
            method: 'POST', credentials: 'same-origin', body: formData
        });
        if (!response.ok) throw new Error();
        showToast('Файл загружен', 'success');
        loadFileBrowser(path);
        selectedFile = null;
        document.getElementById('upload-file').value = '';
        const displayDiv = document.getElementById('file-name-display');
        if (displayDiv) {
            const nameSpan = displayDiv.querySelector('.file-name-text');
            const icon = displayDiv.querySelector('i');
            nameSpan.textContent = 'Файл не выбран';
            displayDiv.setAttribute('title', 'Файл не выбран');
            icon.className = 'fas fa-info-circle';
            icon.style.color = '#7f8c8d';
        }
    } catch (error) { showToast('Ошибка загрузки', 'error'); }
}

async function renameFile(path, currentName, isDir) {
    const modal = document.getElementById('rename-modal');
    if (!modal) return;
    document.getElementById('current-name').value = currentName;
    document.getElementById('new-name').value = currentName;
    document.getElementById('rename-path').value = path;
    modal.classList.add('show');

    const form = document.getElementById('rename-form');
    const submitHandler = async (e) => {
        e.preventDefault();
        const newName = document.getElementById('new-name').value;
        if (!newName || newName === currentName) {
            modal.classList.remove('show');
            form.removeEventListener('submit', submitHandler);
            return;
        }
        try {
            const response = await fetch('/admin/files/rename', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin', body: JSON.stringify({ path, new_name: newName, is_dir: isDir })
            });
            if (!response.ok) throw new Error();
            showToast('Переименовано', 'success');
            modal.classList.remove('show');
            loadFileBrowser(path.split('/').slice(0, -1).join('/'));
        } catch (error) { showToast('Ошибка переименования', 'error'); }
        form.removeEventListener('submit', submitHandler);
    };
    form.addEventListener('submit', submitHandler);
}

async function moveFile(path, name) {
    const modal = document.getElementById('move-modal');
    if (!modal) return;
    document.getElementById('move-current-path').value = path;
    modal.classList.add('show');

    const form = document.getElementById('move-form');
    const submitHandler = async (e) => {
        e.preventDefault();
        const newPath = document.getElementById('move-new-path').value;
        try {
            const response = await fetch('/admin/files/move', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin', body: JSON.stringify({ path, new_path: newPath })
            });
            if (!response.ok) throw new Error();
            showToast('Перемещено', 'success');
            modal.classList.remove('show');
            loadFileBrowser('');
        } catch (error) { showToast('Ошибка перемещения', 'error'); }
        form.removeEventListener('submit', submitHandler);
    };
    form.addEventListener('submit', submitHandler);
}

async function deleteFile(path, isDir) {
    if (!confirm(`Удалить ${isDir ? 'папку' : 'файл'}?`)) return;
    try {
        const response = await fetch('/admin/files/delete', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ path, is_dir: isDir })
        });
        if (!response.ok) throw new Error();
        showToast('Удалено', 'success');
        loadFileBrowser(path.split('/').slice(0, -1).join('/'));
    } catch (error) { showToast('Ошибка удаления', 'error'); }
}

let currentModal = null;
function closeModal() { if (currentModal) { currentModal.classList.remove('show'); currentModal = null; } }
function openModal(modal) { closeModal(); modal.classList.add('show'); currentModal = modal; }
function closeMassModal() { const modal = document.getElementById('mass-modal'); if (modal) modal.classList.remove('show'); }

function initModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    });
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    const userCount = document.getElementById('user-count');
    const countValue = document.getElementById('count-value');
    if (userCount && countValue) {
        userCount.addEventListener('input', () => { countValue.textContent = userCount.value; });
    }
    const massCreateBtn = document.getElementById('mass-create-btn');
    if (massCreateBtn) {
        massCreateBtn.addEventListener('click', () => openModal(document.getElementById('mass-modal')));
    }
    const submitMass = document.getElementById('submit-mass');
    if (submitMass) {
        submitMass.addEventListener('click', () => {
            const count = parseInt(document.getElementById('user-count').value);
            const prefix = document.getElementById('name-prefix').value;
            const role = document.getElementById('mass-role').value;
            const commonPassword = document.getElementById('mass-password').value;
            massCreateUsers(count, prefix, role, commonPassword);
        });
    }
}

function initFileManager() {
    const createUserBtn = document.getElementById('create-user-btn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', () => openModal(document.getElementById('modal')));
    }
    const fileBtn = document.createElement('button');
    fileBtn.className = 'btn-secondary';
    fileBtn.innerHTML = '<i class="fas fa-folder-open"></i> Управление файлами';
    fileBtn.style.marginLeft = '10px';
    fileBtn.onclick = () => {
        openModal(document.getElementById('file-modal'));
        loadFileBrowser('');
    };
    const headerButtons = document.querySelector('.header-buttons');
    if (headerButtons) headerButtons.appendChild(fileBtn);

    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadFile);
    }

    const copyPathBtn = document.getElementById('copy-current-path-btn');
    if (copyPathBtn) {
        copyPathBtn.addEventListener('click', copyCurrentFolderPath);
    }

    initCustomFileInput();
}

async function init() {
    const isAdmin = await checkAuth();
    if (isAdmin) {
        await getCurrentUser();
        await loadUsers();
        initModals();
        initFileManager();
    }
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createUser({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                role: document.getElementById('role').value
            });
        });
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => {
                window.location.href = '/auth.html';
            });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');

    if (!toggleBtn || !sidebar) return;

    let isOpen = false;

    toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOpen) {
            sidebar.classList.remove('open');
            sidebar.classList.add('close');
            isOpen = false;
        } else {
            sidebar.classList.remove('close');
            sidebar.classList.add('open');
            isOpen = true;
        }
    });

    document.addEventListener('click', function (event) {
        const isMobile = window.innerWidth <= 992;
        if (isMobile && isOpen) {
            if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
                sidebar.classList.remove('open');
                sidebar.classList.add('close');
                isOpen = false;
            }
        }
    });
}