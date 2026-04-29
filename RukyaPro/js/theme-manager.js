// RUKYA PRO — Конструктор тем и управление палитрой

class ThemeManager {
    constructor() {
        this.currentTheme = 'classic-gold';
        this.customPalette = null;
        this.autoSwitchEnabled = false;
        this.highContrast = false;
        this.init();
    }

    init() {
        // Загрузка сохранённой темы
        const savedTheme = localStorage.getItem('rukya_theme');
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        }

        // Загрузка кастомной палитры
        const savedPalette = localStorage.getItem('rukya_custom_palette');
        if (savedPalette) {
            this.customPalette = JSON.parse(savedPalette);
            this.applyCustomPalette(this.customPalette);
        }

        // Загрузка настроек
        this.autoSwitchEnabled = localStorage.getItem('rukya_auto_theme') === 'true';
        this.highContrast = localStorage.getItem('rukya_high_contrast') === 'true';

        // Автопереключение по времени суток
        if (this.autoSwitchEnabled) {
            this.setupAutoThemeSwitch();
        }
    }

    // Установка темы
    setTheme(themeId, save = true) {
        const body = document.body;
        
        // Удаляем все классы тем
        THEMES_DATABASE.forEach(theme => {
            body.classList.remove(`theme-${theme.id}`);
        });

        // Добавляем новый класс темы
        body.classList.add(`theme-${themeId}`);
        this.currentTheme = themeId;

        // Сохраняем в localStorage
        if (save) {
            localStorage.setItem('rukya_theme', themeId);
            this.showToast(`Тема "${getThemeById(themeId)?.name}" применена`, 'success');
        }

        // Обновляем UI
        this.updateThemeUI();
    }

    // Применение кастомной палитры
    applyCustomPalette(palette) {
        const root = document.documentElement;
        
        if (palette.primaryColor) {
            root.style.setProperty('--primary-color', palette.primaryColor);
        }
        if (palette.primaryDark) {
            root.style.setProperty('--primary-dark', palette.primaryDark);
        }
        if (palette.primaryLight) {
            root.style.setProperty('--primary-light', palette.primaryLight);
        }
        if (palette.bgColor) {
            root.style.setProperty('--bg-color', palette.bgColor);
        }
        if (palette.bgSecondary) {
            root.style.setProperty('--bg-secondary', palette.bgSecondary);
        }
        if (palette.bgTertiary) {
            root.style.setProperty('--bg-tertiary', palette.bgTertiary);
        }

        this.customPalette = palette;
        localStorage.setItem('rukya_custom_palette', JSON.stringify(palette));
    }

    // Сброс кастомной палитры
    resetCustomPalette() {
        const root = document.documentElement;
        
        // Сбрасываем инлайн-переменные
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--primary-dark');
        root.style.removeProperty('--primary-light');
        root.style.removeProperty('--bg-color');
        root.style.removeProperty('--bg-secondary');
        root.style.removeProperty('--bg-tertiary');

        this.customPalette = null;
        localStorage.removeItem('rukya_custom_palette');
        this.showToast('Палитра сброшена', 'info');
    }

    // Включение/выключение высокого контраста
    toggleHighContrast() {
        this.highContrast = !this.highContrast;
        document.body.classList.toggle('high-contrast', this.highContrast);
        localStorage.setItem('rukya_high_contrast', this.highContrast);
        this.showToast(
            this.highContrast ? 'Высокий контраст включён' : 'Высокий контраст выключен',
            'info'
        );
    }

    // Настройка автопереключения тем
    setupAutoThemeSwitch() {
        const updateTheme = () => {
            const hour = new Date().getHours();
            
            // Утром — светлые темы, вечером — тёмные
            if (hour >= 6 && hour < 12) {
                this.setTheme('noor', false); // Светлая тема
            } else if (hour >= 12 && hour < 18) {
                this.setTheme('classic-gold', false); // Дневная тема
            } else if (hour >= 18 && hour < 22) {
                this.setTheme('sunset', false); // Вечерняя тема
            } else {
                this.setTheme('night', false); // Ночная тема
            }
        };

        updateTheme();
        setInterval(updateTheme, 60000); // Проверка каждую минуту
    }

    // Генерация палитры из основного цвета
    generatePaletteFromColor(baseColor) {
        // Простая эвристика для генерации оттенков
        return {
            primaryColor: baseColor,
            primaryDark: this.darkenColor(baseColor, 15),
            primaryLight: this.lightenColor(baseColor, 15),
            bgColor: '#1e1d1d',
            bgSecondary: '#2a2929',
            bgTertiary: '#353434'
        };
    }

    // Затемнение цвета
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // Осветление цвета
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // Показ уведомления
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Обновление UI переключателя тем
    updateThemeUI() {
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.value = this.currentTheme;
        }
    }

    // Экспорт текущей конфигурации
    exportConfig() {
        return {
            theme: this.currentTheme,
            customPalette: this.customPalette,
            autoSwitchEnabled: this.autoSwitchEnabled,
            highContrast: this.highContrast
        };
    }

    // Импорт конфигурации
    importConfig(config) {
        if (config.theme) {
            this.setTheme(config.theme, false);
        }
        if (config.customPalette) {
            this.customPalette = config.customPalette;
            this.applyCustomPalette(config.customPalette);
        }
        if (typeof config.autoSwitchEnabled === 'boolean') {
            this.autoSwitchEnabled = config.autoSwitchEnabled;
            localStorage.setItem('rukya_auto_theme', this.autoSwitchEnabled);
            if (this.autoSwitchEnabled) {
                this.setupAutoThemeSwitch();
            }
        }
        if (typeof config.highContrast === 'boolean') {
            this.highContrast = config.highContrast;
            localStorage.setItem('rukya_high_contrast', this.highContrast);
            document.body.classList.toggle('high-contrast', this.highContrast);
        }
    }
}

// Глобальный экземпляр
const themeManager = new ThemeManager();

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
