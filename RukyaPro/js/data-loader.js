/**
 * RUKYA PRO — Загрузчик данных (база знаний)
 */

// Встроенные данные (из JSON файлов)
const KnowledgeBase = {
    illnesses: [
        { id: 'sihr_mahfi', name: 'Скрытый сихр', category: 'sihr' },
        { id: 'sihr_tafriq', name: 'Сихр разлада', category: 'sihr' },
        { id: 'sihr_mahabba', name: 'Сихр привязанности', category: 'sihr' },
        { id: 'sihr_bayt', name: 'Сихр в доме', category: 'sihr' },
        { id: 'massas_jinn', name: 'Касание джинна', category: 'jinn' },
        { id: 'ayn_hasida', name: 'Сглаз', category: 'ayn' },
        { id: 'hasad', name: 'Зависть', category: 'ayn' },
        { id: 'waswasa_dini', name: 'Васваса', category: 'waswasa' },
        { id: 'khawf', name: 'Страх', category: 'emotional' },
        { id: 'huzn', name: 'Печаль', category: 'emotional' }
    ],
    
    organs: [
        { id: 'qalb', name: 'Сердце', arabic: 'القلب' },
        { id: 'sadr', name: 'Грудь', arabic: 'الصدر' },
        { id: 'batn', name: 'Живот', arabic: 'البطن' },
        { id: 'ras', name: 'Голова', arabic: 'الرأس' },
        { id: 'jasad', name: 'Тело', arabic: 'الجسد' },
        { id: 'aql', name: 'Разум', arabic: 'العقل' },
        { id: 'zahr', name: 'Спина', arabic: 'الظهر' }
    ],
    
    attributes: [
        { id: 'ash_shafi', name: 'Аш-Шафи', meaning: 'Исцеляющий' },
        { id: 'al_muafi', name: 'Аль-Муафи', meaning: 'Дарующий благополучие' },
        { id: 'ar_rahman', name: 'Ар-Рахман', meaning: 'Милостивый' },
        { id: 'ar_rahim', name: 'Ар-Рахим', meaning: 'Милосердный' },
        { id: 'al_hayy', name: 'Аль-Хайй', meaning: 'Живой' },
        { id: 'al_qayyum', name: 'Аль-Кайюм', meaning: 'Самосущий' }
    ],
    
    templates: [
        { id: 'ruqya_general', type: 'ruqya', text_ar: 'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ', text_ru: 'С именем Аллаха заклинаю тебя от всего, что причиняет тебе вред' },
        { id: 'protection_body', type: 'protection', text_ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ شَرِّ مَا خَلَقَ', text_ru: 'Прибегаю к совершенным словам Аллаха от зла того, что Он создал' },
        { id: 'closing_doors', type: 'closing', text_ar: 'بِسْمِ اللَّهِ أَغْلَقْتُ أَبْوَابَ جَسَدِي', text_ru: 'С именем Аллаха закрываю двери своего тела' },
        { id: 'water_cleansing', type: 'water', text_ar: 'اللَّهُمَّ اجْعَلْ هَذِهِ الْمَاءَ شِفَاءً', text_ru: 'О Аллах, сделай эту воду исцелением' }
    ],
    
    programs: [
        { id: 'sihr_tafriq_standard', name: 'Сихр разлада — стандартная', illness: 'sihr_tafriq', duration: 14 },
        { id: 'sihr_tafriq_home', name: 'Сихр разлада + дом', illness: 'sihr_tafriq', duration: 18 },
        { id: 'sihr_mahabba', name: 'Сихр привязанности', illness: 'sihr_mahabba', duration: 14 },
        { id: 'sihr_mahfi', name: 'Скрытый сихр', illness: 'sihr_mahfi', duration: 14 },
        { id: 'massas_jinn', name: 'Касание джинна', illness: 'massas_jinn', duration: 21 },
        { id: 'ayn_hasida', name: 'Сглаз', illness: 'ayn_hasida', duration: 10 },
        { id: 'waswasa', name: 'Васваса', illness: 'waswasa_dini', duration: 10 },
        { id: 'soul_knots', name: 'Курс духовных зажимов', illness: 'soul_knots', duration: 7 },
        { id: 'children', name: 'Детский курс', illness: 'ayn_hasida', duration: 7 }
    ],
    
    symptoms: [
        { id: 'chest_pain', label: 'Боль/стеснение в груди', group: 'heart' },
        { id: 'heart palpitation', label: 'Учащённое сердцебиение', group: 'heart' },
        { id: 'headache', label: 'Головная боль', group: 'head' },
        { id: 'dizziness', label: 'Головокружение', group: 'head' },
        { id: 'nightmares', label: 'Кошмары', group: 'sleep' },
        { id: 'insomnia', label: 'Бессонница', group: 'sleep' },
        { id: 'family_conflicts', label: 'Конфликты в семье', group: 'family' },
        { id: 'aversion_spouse', label: 'Отвращение к супругу', group: 'family' },
        { id: 'obsessive_thoughts', label: 'Навязчивые мысли', group: 'obsession' },
        { id: 'waswasa_prayer', label: 'Васваса в намазе', group: 'obsession' },
        { id: 'eye_contact', label: 'После взгляда/похвалы', group: 'ayn' },
        { id: 'envy_others', label: 'Зависть других', group: 'ayn' },
        { id: 'symptoms_worse', label: 'Симптомы усиливаются', group: 'dynamic' },
        { id: 'symptoms_morning', label: 'Утром хуже', group: 'dynamic' },
        { id: 'back_pain', label: 'Боль в спине', group: 'location' },
        { id: 'abdominal_pain', label: 'Боль в животе', group: 'location' }
    ],
    
    jinnTypes: [
        { id: 'marid', name: 'Марид' },
        { id: 'amir', name: 'Амир' },
        { id: 'qarin', name: 'Карин' },
        { id: 'muslim', name: 'Мусульманин' },
        { id: 'kafir', name: 'Неверующий' }
    ],
    
    verses: [
        { id: 'fatiha', name: 'Аль-Фатиха', text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ...' },
        { id: 'bakara_1_5', name: 'Аль-Бакара 1-5', text: 'المَٰٓ... أُولَٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ...' },
        { id: 'ayat_kursi', name: 'Аят аль-Курси', text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...' },
        { id: 'ikhlas', name: 'Аль-Ихлас', text: 'قُلْ هُوَ اللَّهُ أَحَدٌ...' },
        { id: 'falaq', name: 'Аль-Фаляк', text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...' },
        { id: 'nas', name: 'Ан-Нас', text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ...' }
    ]
};

// Получение данных по ключу
function getKB(key) {
    return KnowledgeBase[key] || [];
}

// Поиск программы по недугу
function findProgramsByIllness(illnessId) {
    return KnowledgeBase.programs.filter(p => p.illness === illnessId);
}

// Поиск органа по ID
function getOrganById(id) {
    return KnowledgeBase.organs.find(o => o.id === id);
}

// Поиск недуга по ID
function getIllnessById(id) {
    return KnowledgeBase.illnesses.find(i => i.id === id);
}

// Экспорт
window.KnowledgeBase = {
    ...KnowledgeBase,
    getKB,
    findProgramsByIllness,
    getOrganById,
    getIllnessById
};
