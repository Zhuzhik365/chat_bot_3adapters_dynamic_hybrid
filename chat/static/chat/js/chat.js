let currentConversationId = null;
let isProcessing = false;
let selectedAdapters = ['business'];

const ADAPTER_INFO = {
    business: { icon: '💼', label: 'Бизнес', name: 'Бизнес-консультант' },
    legal:    { icon: '⚖️', label: 'Юрист', name: 'Юридический консультант' },
    psych:    { icon: '🧠', label: 'Психолог', name: 'Предпринимательский психолог' },
};

function normalizeAdapters(adapters) {
    if (typeof adapters === 'string') {
        try {
            adapters = JSON.parse(adapters);
        } catch (e) {
            adapters = adapters.split(',');
        }
    }

    if (!Array.isArray(adapters)) {
        adapters = [];
    }

    const normalized = [];
    const seen = new Set();

    adapters.forEach(adapter => {
        const key = String(adapter || '').trim().toLowerCase();
        if (ADAPTER_INFO[key] && !seen.has(key)) {
            normalized.push(key);
            seen.add(key);
        }
    });

    return normalized.length ? normalized : ['business'];
}

function legacyConsultantToAdapters(consultant) {
    if (consultant === 'legal') return ['legal'];
    if (consultant === 'psych') return ['psych'];
    if (consultant === 'hybrid') return ['business', 'legal'];
    return ['business'];
}

function getHeaderInfo(adapters) {
    const normalized = normalizeAdapters(adapters);
    if (normalized.length === 1) {
        return ADAPTER_INFO[normalized[0]] || ADAPTER_INFO.business;
    }

    const names = normalized.map(key => ADAPTER_INFO[key].label).join(' + ');
    return {
        icon: '🤝',
        label: names,
        name: `Гибрид: ${names}`,
    };
}

function setSelectedAdapters(adapters, forceHeaderUpdate = false) {
    selectedAdapters = normalizeAdapters(adapters);

    document.querySelectorAll('.consultant-btn').forEach(btn => {
        btn.classList.toggle('active', selectedAdapters.includes(btn.dataset.adapter));
    });

    if (!currentConversationId || forceHeaderUpdate) {
        updateChatHeader(selectedAdapters);
    }
}

function toggleAdapter(adapter) {
    if (isProcessing || !ADAPTER_INFO[adapter]) return;

    let next = [...selectedAdapters];
    if (next.includes(adapter)) {
        if (next.length === 1) return;
        next = next.filter(item => item !== adapter);
    } else {
        next.push(adapter);
    }

    setSelectedAdapters(next, true);
}

function updateChatHeader(adapters) {
    const info = getHeaderInfo(adapters);
    document.getElementById('chat-consultant-icon').textContent = info.icon;
    document.getElementById('chat-consultant-name').textContent = info.name;
}

function getConversationAdaptersFromData(data) {
    if (data && data.selected_adapters) {
        return normalizeAdapters(data.selected_adapters);
    }
    if (data && data.consultant) {
        return legacyConsultantToAdapters(data.consultant);
    }
    return ['business'];
}

function getConversationAdaptersFromElement(element) {
    if (!element) return ['business'];
    return normalizeAdapters(element.dataset.adapters || legacyConsultantToAdapters(element.dataset.consultant));
}

function newConversation() {
    if (isProcessing) return;
    currentConversationId = null;
    setActiveConversation(null);
    updateChatHeader(selectedAdapters);

    const container = document.getElementById('chat-container');
    const info = getHeaderInfo(selectedAdapters);
    container.innerHTML = `
        <div class="welcome-message">
            <h2>Новый чат</h2>
            <p>Задайте ваш вопрос в режиме: ${escapeHtml(info.name)}.</p>
        </div>
    `;
    document.getElementById('user-input').focus();
}

async function loadConversation(conversationId) {
    if (isProcessing) return;
    if (currentConversationId === conversationId) return;

    currentConversationId = conversationId;
    setActiveConversation(conversationId);

    const container = document.getElementById('chat-container');
    container.innerHTML = '<div class="loading-chat">Загрузка...</div>';

    try {
        const response = await fetch(`/conversations/${conversationId}/`);
        const data = await response.json();
        const adapters = getConversationAdaptersFromData(data);
        setSelectedAdapters(adapters, true);

        container.innerHTML = '';

        if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
                addMessage(msg.content, msg.role, false);
            }
            scrollToBottom();
        } else {
            const info = getHeaderInfo(adapters);
            container.innerHTML = `
                <div class="welcome-message">
                    <h2>${escapeHtml(data.title)}</h2>
                    <p>Начните разговор в режиме: ${escapeHtml(info.name)}.</p>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = '<div class="loading-chat">Ошибка загрузки чата</div>';
        console.error(e);
    }
}

function setActiveConversation(conversationId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === String(conversationId));
    });
}

function addConversationToSidebar(id, title, consultant, adapters) {
    const list = document.getElementById('conversations-list');
    const normalizedAdapters = normalizeAdapters(adapters || legacyConsultantToAdapters(consultant));
    const info = getHeaderInfo(normalizedAdapters);

    const existing = list.querySelector(`[data-id="${id}"]`);
    if (existing) {
        existing.querySelector('.conv-title').textContent = title;
        existing.dataset.consultant = consultant || 'custom';
        existing.dataset.adapters = JSON.stringify(normalizedAdapters);
        const iconEl = existing.querySelector('.conv-icon');
        if (iconEl) iconEl.textContent = info.icon;
        list.insertBefore(existing, list.firstChild);
        return;
    }

    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.id = String(id);
    item.dataset.consultant = consultant || 'custom';
    item.dataset.adapters = JSON.stringify(normalizedAdapters);
    item.onclick = () => loadConversation(id);
    item.innerHTML = `
        <span class="conv-icon">${info.icon}</span>
        <span class="conv-title">${escapeHtml(title)}</span>
        <button class="conv-delete" onclick="deleteConversation(event, ${id})" title="Удалить">×</button>
    `;
    list.insertBefore(item, list.firstChild);
}

async function deleteConversation(event, conversationId) {
    event.stopPropagation();
    if (!confirm('Удалить этот чат?')) return;

    try {
        const response = await fetch(`/delete/${conversationId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.status === 'ok') {
            const item = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
            if (item) item.remove();

            if (currentConversationId === conversationId) {
                newConversation();
            }
        }
    } catch (e) {
        console.error('Error deleting conversation:', e);
    }
}

async function sendMessage() {
    if (isProcessing) return;

    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const message = input.value.trim();

    if (!message) {
        showError('Пожалуйста, введите сообщение');
        return;
    }

    addMessage(message, 'user');
    input.value = '';
    autoResize(input);

    const loadingMsg = addLoadingMessage();
    sendBtn.disabled = true;
    isProcessing = true;

    try {
        const response = await fetch('/send/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                conversation_id: currentConversationId,
                consultant: selectedAdapters.length === 1 ? selectedAdapters[0] : 'custom',
                adapters: selectedAdapters,
            })
        });

        loadingMsg.remove();
        const data = await response.json();

        if (data.status === 'success') {
            addMessage(data.response, 'assistant');

            const adapters = getConversationAdaptersFromData(data);

            if (data.conversation_id !== currentConversationId) {
                currentConversationId = data.conversation_id;
                addConversationToSidebar(data.conversation_id, data.conversation_title, data.consultant, adapters);
                setActiveConversation(currentConversationId);
                setSelectedAdapters(adapters, true);
            } else {
                addConversationToSidebar(data.conversation_id, data.conversation_title, data.consultant, adapters);
                setActiveConversation(currentConversationId);
                setSelectedAdapters(adapters, true);
            }

            updateTokenDisplay(data.tokens_remaining);

        } else if (data.status === 'limit_exceeded') {
            showError(data.error);
        } else {
            showError(data.error || 'Произошла ошибка');
        }

    } catch (error) {
        loadingMsg.remove();
        showError('Ошибка соединения. Проверьте что сервер запущен.');
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
        isProcessing = false;
        input.focus();
    }
}

function addMessage(text, role, scroll = true) {
    const container = document.getElementById('chat-container');
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    if (role === 'assistant') {
        messageDiv.innerHTML = marked.parse(text);
    } else {
        messageDiv.textContent = text;
    }

    container.appendChild(messageDiv);
    if (scroll) scrollToBottom();
    return messageDiv;
}

function addLoadingMessage() {
    const container = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        indicator.appendChild(dot);
    }

    messageDiv.appendChild(indicator);
    container.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function updateTokenDisplay(tokensRemaining) {
    tokensUsed = TOKENS_LIMIT - tokensRemaining;
    const percent = Math.min(100, Math.round(tokensUsed / TOKENS_LIMIT * 100));

    const display = document.getElementById('tokens-display');
    const bar = document.getElementById('tokens-bar');

    if (display) display.textContent = `${tokensUsed.toLocaleString('ru')} / ${TOKENS_LIMIT.toLocaleString('ru')}`;
    if (bar) bar.style.width = percent + '%';
}

function showError(message) {
    const existing = document.querySelector('.error-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function scrollToBottom() {
    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('user-input');

    document.querySelectorAll('.conversation-item').forEach(item => {
        item.dataset.adapters = JSON.stringify(getConversationAdaptersFromElement(item));
    });

    setSelectedAdapters(['business'], true);
    input.focus();

    input.addEventListener('input', function () {
        autoResize(this);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
