// Twitch Chat Overlay - Main Script
const { invoke } = window.__TAURI__.core;
const { Window } = window.__TAURI__.window;

// State
let currentChannel = '';
let isOnTwitchChat = false; // Flag para saber se estamos no chat
let settings = {
  opacity: 100,
  alwaysOnTop: false,
  clickThrough: false,
  theme: 'dark',
  recentChannels: []
};

// DOM Elements
const elements = {};

// Storage key
const STORAGE_KEY = 'twitch-chat-overlay-settings';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Se já estamos na página do chat da Twitch, não fazer nada
  // (nosso JS não roda lá de qualquer forma)
  if (window.location.hostname.includes('twitch.tv')) {
    return;
  }
  
  // Estamos no menu principal
  isOnTwitchChat = false;
  
  cacheElements();
  loadSettings();
  setupEventListeners();
  renderRecentChannels();
  applySettings();
});

function cacheElements() {
  elements.app = document.getElementById('app');
  elements.mainScreen = document.getElementById('main-screen');
  elements.chatScreen = document.getElementById('chat-screen');
  elements.settingsPanel = document.getElementById('settings-panel');
  elements.channelInput = document.getElementById('channel-input');
  elements.btnOpenChat = document.getElementById('btn-open-chat');
  elements.btnSettings = document.getElementById('btn-settings');
  elements.btnCloseSettings = document.getElementById('btn-close-settings');
  elements.btnBack = document.getElementById('btn-back');
  elements.btnRefresh = document.getElementById('btn-refresh');
  elements.btnResetSize = document.getElementById('btn-reset-size');
  elements.btnClearHistory = document.getElementById('btn-clear-history');
  elements.channelName = document.getElementById('channel-name');
  elements.recentChannels = document.getElementById('recent-channels');
  elements.recentList = document.getElementById('recent-list');
  elements.toggleOnTop = document.getElementById('toggle-on-top');
  elements.toggleClickThrough = document.getElementById('toggle-click-through');
  elements.opacitySlider = document.getElementById('opacity-slider');
  elements.opacityValue = document.getElementById('opacity-value');
  elements.chatTheme = document.getElementById('chat-theme');
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function applySettings() {
  // Apply opacity via Rust command for real window transparency
  invoke('set_window_opacity', { opacity: settings.opacity / 100 }).catch(console.error);
  elements.opacitySlider.value = settings.opacity;
  elements.opacityValue.textContent = `${settings.opacity}%`;
  
  // Apply always on top
  elements.toggleOnTop.checked = settings.alwaysOnTop;
  setAlwaysOnTop(settings.alwaysOnTop);
  
  // Apply click through - marcar checkbox mas NÃO aplicar
  elements.toggleClickThrough.checked = settings.clickThrough;
  // Garantir que click-through está DESATIVADO na tela inicial
  setClickThrough(false);
  
  // Apply theme
  elements.chatTheme.value = settings.theme;
}

function setupEventListeners() {
  // Open chat
  elements.btnOpenChat.addEventListener('click', openChat);
  elements.channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') openChat();
  });

  // Settings panel
  elements.btnSettings.addEventListener('click', toggleSettings);
  elements.btnCloseSettings.addEventListener('click', toggleSettings);

  // Back to main
  elements.btnBack.addEventListener('click', closeChat);

  // Refresh chat
  elements.btnRefresh.addEventListener('click', refreshChat);

  // Always on top toggle
  elements.toggleOnTop.addEventListener('change', (e) => {
    settings.alwaysOnTop = e.target.checked;
    setAlwaysOnTop(settings.alwaysOnTop);
    saveSettings();
  });

  // Click through toggle
  elements.toggleClickThrough.addEventListener('change', (e) => {
    settings.clickThrough = e.target.checked;
    saveSettings();
    
    // Só aplicar click-through se estivermos no chat da Twitch
    // No menu principal, NUNCA ativar click-through
    if (isOnTwitchChat) {
      setClickThrough(settings.clickThrough);
    }
    // Se estiver no menu, não fazer nada - será aplicado quando abrir o chat
  });

  // Opacity slider
  elements.opacitySlider.addEventListener('input', async (e) => {
    settings.opacity = parseInt(e.target.value);
    elements.opacityValue.textContent = `${settings.opacity}%`;
    // Aplicar transparência real via comando Rust
    try {
      await invoke('set_window_opacity', { opacity: settings.opacity / 100 });
    } catch (err) {
      console.error('Failed to set opacity:', err);
    }
  });
  
  elements.opacitySlider.addEventListener('change', () => {
    saveSettings();
  });

  // Theme select
  elements.chatTheme.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    saveSettings();
    if (currentChannel) {
      updateChatFrame();
    }
  });

  // Reset window size
  elements.btnResetSize.addEventListener('click', async () => {
    try {
      await invoke('reset_window_size');
    } catch (e) {
      console.error('Failed to reset window size:', e);
    }
  });

  // Clear history
  elements.btnClearHistory.addEventListener('click', () => {
    settings.recentChannels = [];
    saveSettings();
    renderRecentChannels();
  });
}

async function openChat() {
  const channel = elements.channelInput.value.trim().toLowerCase();
  
  if (!channel) {
    elements.channelInput.focus();
    return;
  }

  // Validate channel name (alphanumeric and underscore only)
  if (!/^[a-z0-9_]+$/i.test(channel)) {
    alert('Nome de canal inválido. Use apenas letras, números e underscore.');
    return;
  }

  currentChannel = channel;
  addToRecentChannels(channel);
  
  // APLICAR CLICK-THROUGH ANTES DE NAVEGAR (se estiver configurado)
  // Usar await para garantir que o comando seja executado antes da navegação
  if (settings.clickThrough) {
    try {
      await invoke('set_click_through', { enabled: true });
      // Pequeno delay para garantir que a janela foi modificada
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('Failed to set click-through:', err);
    }
  }
  
  // Navegar diretamente para o chat da Twitch
  const darkMode = settings.theme === 'dark' ? '&darkpopout' : '';
  const url = `https://www.twitch.tv/popout/${channel}/chat?popout=${darkMode}`;
  
  // Navegar para o chat
  window.location.href = url;
}

function injectCustomCSS() {
  const style = document.createElement('style');
  style.id = 'twitch-chat-custom-css';
  style.textContent = `
    /* Esconder header do chat */
    .stream-chat-header,
    .chat-room__header,
    [class*="InjectLayout-sc"][class*="chat-room__header"],
    [class*="Layout-sc"][class*="chat-room__header"] {
      display: none !important;
    }
    
    /* Esconder input de mensagens */
    .chat-input,
    .chat-wysiwyg-input,
    [class*="chat-input"],
    [class*="ChatInputWrapper"],
    textarea[data-a-target="chat-input"],
    [data-a-target="chat-input"],
    [class*="InjectLayout-sc"][class*="chat-input"] {
      display: none !important;
    }
    
    /* Esconder botões de chat */
    .chat-input__buttons-container,
    [class*="chat-input__buttons"],
    [class*="ChatInputButtonsContainer"] {
      display: none !important;
    }
    
    /* Esconder container do input */
    .chat-input-tray,
    [class*="chat-input-tray"],
    [class*="ChatInputTray"] {
      display: none !important;
    }
    
    /* Fazer o chat ocupar toda a tela */
    .chat-scrollable-area__message-container,
    .chat-list,
    [class*="chat-scrollable-area"],
    [class*="scrollable-area"],
    [class*="ChatScrollableArea"],
    [class*="InjectLayout-sc"][class*="scrollable"] {
      height: 100vh !important;
      max-height: 100vh !important;
    }
    
    /* Garantir altura total */
    html, body {
      height: 100% !important;
      overflow: hidden !important;
    }
    
    /* Container principal */
    .tw-root--theme-dark,
    .tw-root--theme-light,
    [data-a-target="chat-room"],
    .chat-room {
      height: 100% !important;
    }
    
    /* Forçar display none em qualquer coisa com "input" no nome da classe */
    [class*="Input"]:not([class*="Button"]):not([class*="Scroll"]) {
      display: none !important;
    }
  `;
  
  // Remover estilo anterior se existir
  const oldStyle = document.getElementById('twitch-chat-custom-css');
  if (oldStyle) {
    oldStyle.remove();
  }
  
  document.head.appendChild(style);
  
  // Re-injetar periodicamente para garantir que funcione
  const observer = new MutationObserver(() => {
    if (!document.getElementById('twitch-chat-custom-css')) {
      document.head.appendChild(style.cloneNode(true));
    }
  });
  
  observer.observe(document.head, { childList: true });
}

function createChatPage(chatUrl) {
  // Função não é mais necessária
}

async function openTwitchChatWindow(channel) {
  // Função removida - não usamos mais janelas separadas
}

function closeChat() {
  // Voltar para a tela inicial (recarregar o app)
  window.location.reload();
}

function refreshChat() {
  if (currentChannel) {
    // Recarregar a página do chat
    window.location.reload();
  }
}

function toggleSettings() {
  elements.settingsPanel.classList.toggle('hidden');
}

async function setAlwaysOnTop(enabled) {
  try {
    await invoke('set_always_on_top', { enabled });
  } catch (e) {
    console.error('Failed to set always on top:', e);
  }
}

async function setClickThrough(enabled) {
  try {
    await invoke('set_click_through', { enabled });
  } catch (e) {
    console.error('Failed to set click through:', e);
  }
}

function addToRecentChannels(channel) {
  // Remove if already exists
  settings.recentChannels = settings.recentChannels.filter(c => c !== channel);
  
  // Add to beginning
  settings.recentChannels.unshift(channel);
  
  // Keep only last 5
  settings.recentChannels = settings.recentChannels.slice(0, 5);
  
  saveSettings();
  renderRecentChannels();
}

function renderRecentChannels() {
  if (settings.recentChannels.length === 0) {
    elements.recentChannels.classList.add('hidden');
    return;
  }

  elements.recentChannels.classList.remove('hidden');
  elements.recentList.innerHTML = '';

  settings.recentChannels.forEach(channel => {
    const item = document.createElement('button');
    item.className = 'recent-item';
    item.textContent = channel;
    item.addEventListener('click', () => {
      elements.channelInput.value = channel;
      openChat();
    });
    elements.recentList.appendChild(item);
  });
}
