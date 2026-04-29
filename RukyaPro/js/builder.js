/**
 * RUKYA PRO — Генератор формул (builder.js)
 */

// Генерация формулы из шаблона
function buildFormula(template, attribute, organ, illness, action, repetitions = 7) {
    const organObj = KnowledgeBase.getOrganById(organ) || { name: 'орган', arabic: 'العضو' };
    const attrObj = KnowledgeBase.attributes.find(a => a.id === attribute) || { name: 'Аллах' };
    
    // Арабский текст с подстановкой
    let arabicText = template.text_ar || '';
    arabicText = arabicText.replace('{attribute}', attrObj.name);
    arabicText = arabicText.replace('{organ_ar}', organObj.arabic);
    
    // Русский перевод
    let russianText = template.text_ru || '';
    russianText = russianText.replace('{attribute}', attrObj.name);
    russianText = russianText.replace('{organ}', organObj.name);
    russianText = russianText.replace('{illness}', illness?.name || 'недуг');
    russianText = russianText.replace('{action}', action || 'исцеление');
    
    return {
        id: generateId(),
        templateId: template.id,
        type: template.type,
        arabic: arabicText,
        russian: russianText,
        repetitions: repetitions,
        attribute: attrObj.name,
        organ: organObj.name,
        illness: illness?.name || null
    };
}

// Генерация блока формул
function buildBlock(blockType, diagnosis, severity, detailLevel) {
    const formulas = [];
    const multiplier = getSeverityMultiplier(severity);
    const detailMultiplier = getDetailMultiplier(detailLevel);
    
    switch (blockType) {
        case 'cleansing':
            // Чистка по недугу
            for (const illness of diagnosis.illnesses) {
                const template = KnowledgeBase.templates.find(t => t.type === 'ruqya');
                if (template) {
                    for (const organ of diagnosis.organs) {
                        formulas.push(buildFormula(
                            template,
                            'ash_shafi',
                            organ.id,
                            illness,
                            'очищение',
                            7 * multiplier
                        ));
                    }
                }
            }
            break;
            
        case 'homeBlock':
            // Блок дома
            if (diagnosis.hasHouse) {
                const protectionTemplate = KnowledgeBase.templates.find(t => t.type === 'protection');
                if (protectionTemplate) {
                    formulas.push(buildFormula(
                        protectionTemplate,
                        'al_hayy',
                        'jasad',
                        null,
                        'защита дома',
                        10 * multiplier
                    ));
                }
            }
            break;
            
        case 'defense':
            // Защита
            const defenseTemplate = KnowledgeBase.templates.find(t => t.type === 'protection');
            if (defenseTemplate) {
                formulas.push(buildFormula(
                    defenseTemplate,
                    'al_qayyum',
                    'jasad',
                    null,
                    'общая защита',
                    3 * detailMultiplier
                ));
                
                // Защита органов
                for (const organ of diagnosis.organs.slice(0, 2)) {
                    formulas.push(buildFormula(
                        defenseTemplate,
                        'al_muafi',
                        organ.id,
                        null,
                        `защита ${organ.name}`,
                        3
                    ));
                }
            }
            break;
            
        case 'closing':
            // Закрытие дверей
            const closingTemplate = KnowledgeBase.templates.find(t => t.type === 'closing');
            if (closingTemplate) {
                formulas.push(buildFormula(
                    closingTemplate,
                    'ar_rahman',
                    'jasad',
                    null,
                    'закрытие дверей тела',
                    7
                ));
                
                if (diagnosis.hasHouse) {
                    formulas.push(buildFormula(
                        closingTemplate,
                        'ar_rahim',
                        'jasad',
                        null,
                        'закрытие дверей дома',
                        7
                    ));
                }
            }
            break;
            
        case 'waterOil':
            // Вода и масло
            if (detailLevel !== 'short') {
                const waterTemplate = KnowledgeBase.templates.find(t => t.type === 'water');
                if (waterTemplate) {
                    formulas.push({
                        id: generateId(),
                        type: 'water',
                        arabic: 'بِسْمِ اللَّهِ',
                        russian: 'Читать на воду: Фатиха, Аят аль-Курси, Аль-Ихлас, Аль-Фаляк, Ан-Нас',
                        repetitions: 7,
                        instruction: 'Пить натощак и умываться'
                    });
                    
                    formulas.push({
                        id: generateId(),
                        type: 'oil',
                        arabic: 'بِسْمِ اللَّهِ',
                        russian: 'Читать на оливное масло: те же суры',
                        repetitions: 7,
                        instruction: 'Наносить на больные места перед сном'
                    });
                }
            }
            break;
            
        case 'final':
            // Финал
            formulas.push({
                id: generateId(),
                type: 'return_evil',
                arabic: 'وَلا يَحْسَبَنَّ الَّذِينَ كَفَرُوا أَنَّمَا نُمْلِي لَهُمْ خَيْرٌ لِأَنفُسِهِمْ',
                russian: 'Аят о возвращении зла тем, кто причиняет вред',
                repetitions: 7,
                instruction: 'Читать с намерением вернуть колдовство его источнику'
            });
            
            formulas.push({
                id: generateId(),
                type: 'inaccessibility',
                arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
                russian: 'Достаточно нам Аллаха, и Он — лучший покровитель',
                repetitions: 100,
                instruction: 'Читать для защиты от любого вреда'
            });
            
            if (detailLevel === 'full') {
                formulas.push({
                    id: generateId(),
                    type: 'dua',
                    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ اشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا',
                    russian: 'О Аллах, Господь людей, устрани зло, исцели, ведь Ты — Исцеляющий, нет исцеления, кроме Твоего исцеления, исцеления, которое не оставляет болезни',
                    repetitions: 7,
                    instruction: 'Мольба об исцелении'
                });
            }
            break;
            
        case 'soulKnots':
            // Духовные зажимы
            formulas.push({
                id: generateId(),
                type: 'soul_knot',
                arabic: 'أَعُوذُ بِاللَّهِ مِنَ الْهَمِّ وَالْحَزَنِ',
                russian: 'Прибегаю к Аллаху от печали и скорби',
                repetitions: 21,
                instruction: 'От духовных зажимов и блоков'
            });
            break;
    }
    
    return formulas;
}

// Множитель по тяжести
function getSeverityMultiplier(severity) {
    if (severity >= 5) return 3;
    if (severity >= 4) return 2;
    if (severity >= 3) return 1.5;
    return 1;
}

// Множитель по детализации
function getDetailMultiplier(level) {
    switch (level) {
        case 'short': return 1;
        case 'medium': return 1.5;
        case 'full': return 2;
        default: return 1;
    }
}

// Сборка полного плана
function buildFullPlan(diagnosis, program, duration, detailLevel, limitFormulas = 50, includeSoulKnots = false) {
    const plan = {
        id: generateId(),
        programId: program.id,
        programName: program.name,
        duration: duration,
        detailLevel: detailLevel,
        createdAt: new Date().toISOString(),
        sections: {}
    };
    
    // Чистка
    plan.sections.cleansing = buildBlock('cleansing', diagnosis, diagnosis.severity, detailLevel);
    
    // Блок дома
    plan.sections.homeBlock = buildBlock('homeBlock', diagnosis, diagnosis.severity, detailLevel);
    
    // Защита
    plan.sections.defense = buildBlock('defense', diagnosis, diagnosis.severity, detailLevel);
    
    // Закрытие
    plan.sections.closing = buildBlock('closing', diagnosis, diagnosis.severity, detailLevel);
    
    // Вода и масло
    plan.sections.waterOil = buildBlock('waterOil', diagnosis, diagnosis.severity, detailLevel);
    
    // Финал
    plan.sections.final = buildBlock('final', diagnosis, diagnosis.severity, detailLevel);
    
    // Духовные зажимы (опционально)
    if (includeSoulKnots) {
        plan.sections.soulKnots = buildBlock('soulKnots', diagnosis, diagnosis.severity, detailLevel);
    }
    
    // Подсчёт формул
    const totalFormulas = Object.values(plan.sections).reduce((sum, section) => sum + section.length, 0);
    plan.totalFormulas = totalFormulas;
    
    // Ограничение числа формул
    if (limitFormulas && totalFormulas > limitFormulas) {
        // Упрощаем план
        const ratio = limitFormulas / totalFormulas;
        for (const key of Object.keys(plan.sections)) {
            const section = plan.sections[key];
            if (key !== 'cleansing') {
                plan.sections[key] = section.slice(0, Math.ceil(section.length * ratio));
            }
        }
    }
    
    return plan;
}

// Экспорт
window.FormulaBuilder = {
    buildFormula,
    buildBlock,
    buildFullPlan,
    getSeverityMultiplier,
    getDetailMultiplier
};
