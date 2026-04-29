// RUKYA PRO — Страница настроек с расширенным управлением темами

function renderSettingsPage() {
    return `
        <div class="settings-page">
            <div class="page-header">
                <h1 class="page-title">⚙️ Настройки</h1>
                <p class="page-subtitle">Персонализация системы RUKYA PRO</p>
            </div>

            <!-- Секция тем оформления -->
            <section class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">🎨 Темы оформления</h2>
                    <span class="badge badge-info">${THEMES_DATABASE.length} тем доступно</span>
                </div>

                <!-- Фильтры категорий -->
                <div class="theme-categories" id="themeCategories">
                    ${getThemeCategories().map(cat => `
                        <button class="category-tab ${cat.id === 'all' ? 'active' : ''}" 
                                data-category="${cat.id}">
                            ${cat.icon} ${cat.name}
                        </button>
                    `).join('')}
                </div>

                <!-- Переключатель тем -->
                <div class="theme-switcher theme-panel-scroll" id="themeSwitcher">
                    ${renderThemeCards('all')}
                </div>

                <!-- Конструктор палитры -->
                <div class="palette-builder">
                    <h3 style="margin-bottom: 16px;">🖌️ Конструктор палитры</h3>
                    <div class="color-picker-group">
                        <div class="color-input-wrapper">
                            <input type="color" id="primaryColorPicker" value="#c9a063">
                            <label>Основной цвет</label>
                            <span class="color-value" id="primaryColorValue">#c9a063</span>
                        </div>
                        <div class="color-input-wrapper">
                            <input type="color" id="primaryDarkPicker" value="#a8824a">
                            <label>Тёмный оттенок</label>
                            <span class="color-value" id="primaryDarkValue">#a8824a</span>
                        </div>
                        <div class="color-input-wrapper">
                            <input type="color" id="primaryLightPicker" value="#e6c88b">
                            <label>Светлый оттенок</label>
                            <span class="color-value" id="primaryLightValue">#e6c88b</span>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="applyCustomPalette()">💾 Применить палитру</button>
                        <button class="btn btn-secondary" onclick="generatePaletteFromCurrent()">🔄 Автогенерация</button>
                        <button class="btn btn-danger" onclick="themeManager.resetCustomPalette()">🗑️ Сбросить</button>
                    </div>
                </div>

                <!-- Дополнительные настройки тем -->
                <div class="settings-grid" style="margin-top: 24px;">
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>🌅 Автопереключение по времени суток</h4>
                            <p class="setting-description">Автоматическая смена темы в зависимости от времени</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="autoThemeToggle" onchange="toggleAutoTheme()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>⚡ Высокий контраст</h4>
                            <p class="setting-description">Увеличенный контраст для слабовидящих</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="highContrastToggle" onchange="themeManager.toggleHighContrast()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Информация о системе -->
            <section class="settings-section">
                <div class="about-card">
                    <div class="logo-large">☪️</div>
                    <h3>RUKYA PRO</h3>
                    <p class="version">Версия 2.0.0 · Ash-Shifa</p>
                    <p class="description">Профессиональная система для специалистов по рукье</p>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <span class="stat-number">${THEMES_DATABASE.length}</span>
                            <span class="stat-label">Тем оформления</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">5</span>
                            <span class="stat-label">Категорий тем</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">∞</span>
                            <span class="stat-label">Пользовательских палитр</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function renderThemeCards(category) {
    const themes = category === 'all' ? THEMES_DATABASE : THEMES_DATABASE.filter(t => t.category === category);
    return themes.map(theme => `
        <div class="theme-card ${theme.id === themeManager.currentTheme ? 'active' : ''}" 
             onclick="themeManager.setTheme('${theme.id}')">
            <div class="theme-preview"></div>
            <div class="theme-name">${theme.icon} ${theme.name}</div>
            <div class="theme-category">${getCategoryName(theme.category)}</div>
        </div>
    `).join('');
}

function getCategoryName(categoryId) {
    const cat = THEME_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
}

function initSettingsPage() {
    loadSettings();
    setupColorPickers();
    setupThemeFilters();
    
    document.getElementById('autoThemeToggle').checked = themeManager.autoSwitchEnabled;
    document.getElementById('highContrastToggle').checked = themeManager.highContrast;
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('rukya_settings') || '{}');
    if (settings.healerName) document.getElementById('healerName').value = settings.healerName;
}

function setupColorPickers() {
    ['primaryColorPicker', 'primaryDarkPicker', 'primaryLightPicker'].forEach(id => {
        const picker = document.getElementById(id);
        if (picker) {
            picker.addEventListener('input', (e) => {
                document.getElementById(id.replace('Picker', 'Value')).textContent = e.target.value;
            });
        }
    });
}

function setupThemeFilters() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('themeSwitcher').innerHTML = renderThemeCards(tab.dataset.category);
        });
    });
}

function applyCustomPalette() {
    const palette = {
        primaryColor: document.getElementById('primaryColorPicker').value,
        primaryDark: document.getElementById('primaryDarkPicker').value,
        primaryLight: document.getElementById('primaryLightPicker').value
    };
    themeManager.applyCustomPalette(palette);
    showToast('Палитра применена', 'success');
}

function generatePaletteFromCurrent() {
    const baseColor = document.getElementById('primaryColorPicker').value;
    const palette = themeManager.generatePaletteFromColor(baseColor);
    document.getElementById('primaryColorPicker').value = palette.primaryColor;
    document.getElementById('primaryDarkPicker').value = palette.primaryDark;
    document.getElementById('primaryLightPicker').value = palette.primaryLight;
    document.getElementById('primaryColorValue').textContent = palette.primaryColor;
    document.getElementById('primaryDarkValue').textContent = palette.primaryDark;
    document.getElementById('primaryLightValue').textContent = palette.primaryLight;
    showToast('Палитра сгенерирована', 'info');
}

function toggleAutoTheme() {
    themeManager.autoSwitchEnabled = document.getElementById('autoThemeToggle').checked;
    localStorage.setItem('rukya_auto_theme', themeManager.autoSwitchEnabled);
    if (themeManager.autoSwitchEnabled) themeManager.setupAutoThemeSwitch();
    showToast(themeManager.autoSwitchEnabled ? 'Автопереключение включено' : 'Автопереключение выключено', 'info');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderSettingsPage, initSettingsPage };
}
