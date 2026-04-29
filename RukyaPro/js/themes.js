// RUKYA PRO — База данных тем оформления

const THEMES_DATABASE = [
    // Исламские темы
    { id: 'classic-gold', name: 'Classic Gold', category: 'islamic', icon: '⭐' },
    { id: 'makkah', name: 'Makkah', category: 'islamic', icon: '🕋' },
    { id: 'madinah', name: 'Madinah', category: 'islamic', icon: '🕌' },
    { id: 'kaaba', name: 'Kaaba', category: 'islamic', icon: '📿' },
    { id: 'quran', name: 'Quran', category: 'islamic', icon: '📖' },
    { id: 'hijrah', name: 'Hijrah', category: 'islamic', icon: '🌙' },
    { id: 'noor', name: 'Noor (Light)', category: 'islamic', icon: '💡' },
    
    // Природные темы
    { id: 'emerald', name: 'Emerald', category: 'nature', icon: '💚' },
    { id: 'desert', name: 'Desert', category: 'nature', icon: '🏜️' },
    { id: 'marine', name: 'Marine', category: 'nature', icon: '🌊' },
    { id: 'sage', name: 'Sage', category: 'nature', icon: '🌿' },
    { id: 'sky', name: 'Sky', category: 'nature', icon: '☁️' },
    { id: 'ocean', name: 'Ocean', category: 'nature', icon: '🌊' },
    { id: 'forest', name: 'Forest', category: 'nature', icon: '🌲' },
    
    // Тёмные темы
    { id: 'night', name: 'Night', category: 'dark', icon: '🌃' },
    { id: 'royal', name: 'Royal', category: 'dark', icon: '👑' },
    { id: 'obsidian', name: 'Obsidian', category: 'dark', icon: '⚫' },
    { id: 'pearl', name: 'Pearl', category: 'dark', icon: '⚪' },
    { id: 'shadow', name: 'Shadow', category: 'dark', icon: '🌑' },
    { id: 'midnight', name: 'Midnight', category: 'dark', icon: '🌙' },
    
    // Медицинские темы
    { id: 'medical', name: 'Medical', category: 'medical', icon: '🏥' },
    { id: 'healing', name: 'Healing', category: 'medical', icon: '💚' },
    { id: 'calming', name: 'Calming', category: 'medical', icon: '😌' },
    { id: 'serenity', name: 'Serenity', category: 'medical', icon: '🧘' },
    { id: 'balance', name: 'Balance', category: 'medical', icon: '⚖️' },
    
    // Премиум темы
    { id: 'golden-hour', name: 'Golden Hour', category: 'premium', icon: '🌅' },
    { id: 'aurora', name: 'Aurora', category: 'premium', icon: '🌌' },
    { id: 'nebula', name: 'Nebula', category: 'premium', icon: '✨' },
    { id: 'sunset', name: 'Sunset', category: 'premium', icon: '🌇' },
    { id: 'cosmic', name: 'Cosmic', category: 'premium', icon: '🌠' }
];

const THEME_CATEGORIES = [
    { id: 'all', name: 'Все темы', icon: '🎨' },
    { id: 'islamic', name: 'Исламские', icon: '☪️' },
    { id: 'nature', name: 'Природные', icon: '🌿' },
    { id: 'dark', name: 'Тёмные', icon: '🌙' },
    { id: 'medical', name: 'Медицинские', icon: '🏥' },
    { id: 'premium', name: 'Премиум', icon: '💎' }
];

// Функция получения темы по ID
function getThemeById(themeId) {
    return THEMES_DATABASE.find(t => t.id === themeId);
}

// Функция получения тем по категории
function getThemesByCategory(category) {
    if (category === 'all') return THEMES_DATABASE;
    return THEMES_DATABASE.filter(t => t.category === category);
}

// Функция получения всех категорий
function getThemeCategories() {
    return THEME_CATEGORIES;
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { THEMES_DATABASE, THEME_CATEGORIES, getThemeById, getThemesByCategory, getThemeCategories };
}
