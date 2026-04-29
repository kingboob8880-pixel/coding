/**
 * RUKYA PRO — Диагностический движок
 */

// Локальная диагностика (без интернета)
function mockDiagnose(complaints, symptoms) {
    const diagnosis = {
        illnesses: [],
        organs: [],
        hasJinn: false,
        jinnType: null,
        jinnLocation: null,
        hasAyn: false,
        hasHouse: false,
        severity: 1,
        priority: 'sihr',
        confidence: 0.7,
        notes: []
    };

    // Анализ симптомов
    const symptomIds = symptoms.filter(s => s.checked).map(s => s.id);

    // Определение типа недуга
    if (symptomIds.includes('family_conflicts') || symptomIds.includes('aversion_spouse')) {
        diagnosis.illnesses.push({ id: 'sihr_tafriq', name: 'Сихр разлада' });
        diagnosis.priority = 'sihr_tafriq';
    }

    if (symptomIds.includes('obsessive_thoughts') || symptomIds.includes('waswasa_prayer')) {
        diagnosis.illnesses.push({ id: 'waswasa_dini', name: 'Васваса' });
    }

    if (symptomIds.includes('eye_contact') || symptomIds.includes('envy_others')) {
        diagnosis.illnesses.push({ id: 'ayn_hasida', name: 'Сглаз' });
        diagnosis.hasAyn = true;
    }

    if (symptomIds.includes('nightmares') || symptomIds.includes('chest_pain')) {
        diagnosis.illnesses.push({ id: 'massas_jinn', name: 'Касание джинна' });
        diagnosis.hasJinn = true;
        diagnosis.jinnType = 'qarin';
        diagnosis.jinnLocation = 'sadr';
    }

    if (symptomIds.length === 0 && complaints) {
        // Анализ текста жалоб
        const text = complaints.toLowerCase();
        if (text.includes('разлад') || text.includes('муж') || text.includes('жена')) {
            diagnosis.illnesses.push({ id: 'sihr_tafriq', name: 'Сихр разлада' });
        }
        if (text.includes('кошмар') || text.includes('джинн')) {
            diagnosis.illnesses.push({ id: 'massas_jinn', name: 'Касание джинна' });
            diagnosis.hasJinn = true;
        }
        if (text.includes('сглаз') || text.includes('похвал')) {
            diagnosis.illnesses.push({ id: 'ayn_hasida', name: 'Сглаз' });
            diagnosis.hasAyn = true;
        }
    }

    // Определение органов
    if (symptomIds.includes('chest_pain') || symptomIds.includes('heart_palpitation')) {
        diagnosis.organs.push({ id: 'qalb', name: 'Сердце' });
    }
    if (symptomIds.includes('headache') || symptomIds.includes('dizziness')) {
        diagnosis.organs.push({ id: 'ras', name: 'Голова' });
    }
    if (symptomIds.includes('back_pain')) {
        diagnosis.organs.push({ id: 'zahr', name: 'Спина' });
    }
    if (symptomIds.includes('abdominal_pain')) {
        diagnosis.organs.push({ id: 'batn', name: 'Живот' });
    }

    // Если органы не определены, добавляем общее
    if (diagnosis.organs.length === 0) {
        diagnosis.organs.push({ id: 'jasad', name: 'Тело' });
    }

    // Тяжесть (по количеству симптомов)
    const checkedCount = symptomIds.length;
    if (checkedCount >= 10) diagnosis.severity = 5;
    else if (checkedCount >= 7) diagnosis.severity = 4;
    else if (checkedCount >= 4) diagnosis.severity = 3;
    else if (checkedCount >= 2) diagnosis.severity = 2;
    else diagnosis.severity = 1;

    // Уверенность
    diagnosis.confidence = Math.min(0.95, 0.5 + (checkedCount * 0.05));

    // Заметки
    if (diagnosis.hasJinn && diagnosis.hasAyn) {
        diagnosis.notes.push('Обнаружены признаки и джинна, и сглаза. Требуется комплексный подход.');
    }
    if (diagnosis.severity >= 4) {
        diagnosis.notes.push('Высокая тяжесть состояния. Рекомендуется длительный курс.');
    }

    return diagnosis;
}

// AI-диагностика через DeepSeek API
async function aiDiagnose(complaints, symptoms, apiKey) {
    const symptomList = symptoms.filter(s => s.checked).map(s => s.label).join(', ');
    
    const prompt = `Ты — эксперт по диагностике духовных недугов в исламской традиции (рукья). 
Проанализируй жалобы пациента и симптомы, определи тип недуга.

Жалобы: ${complaints}
Симптомы: ${symptomList}

Верни ТОЛЬКО JSON в формате:
{
  "illnesses": [{"id": "sihr_tafriq", "name": "Сихр разлада"}],
  "organs": [{"id": "qalb", "name": "Сердце"}],
  "hasJinn": false,
  "jinnType": null,
  "jinnLocation": null,
  "hasAyn": false,
  "hasHouse": false,
  "severity": 3,
  "priority": "sihr",
  "confidence": 0.85,
  "notes": ["Заметка"],
  "evidence": ["Доказательство 1"],
  "differential": ["Альтернативная гипотеза"]
}`;

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'Ты помощник для диагностики духовных недугов в исламской традиции.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Извлечение JSON из ответа
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Не удалось извлечь JSON из ответа');
    } catch (error) {
        console.error('AI Diagnosis error:', error);
        // Фоллбэк на локальную диагностику
        return mockDiagnose(complaints, symptoms);
    }
}

// Валидация диагноза
function validateDiagnosis(diagnosis) {
    const required = ['illnesses', 'organs', 'severity'];
    
    for (const field of required) {
        if (!diagnosis[field]) {
            diagnosis[field] = field === 'illnesses' || field === 'organs' ? [] : 1;
        }
    }

    // Нормализация
    if (!Array.isArray(diagnosis.illnesses)) {
        diagnosis.illnesses = [];
    }
    if (!Array.isArray(diagnosis.organs)) {
        diagnosis.organs = [];
    }
    if (typeof diagnosis.severity !== 'number') {
        diagnosis.severity = 1;
    }
    if (diagnosis.severity < 1) diagnosis.severity = 1;
    if (diagnosis.severity > 5) diagnosis.severity = 5;

    // Приоритет по умолчанию
    if (!diagnosis.priority && diagnosis.illnesses.length > 0) {
        diagnosis.priority = diagnosis.illnesses[0].id;
    }

    return diagnosis;
}

// Рекомендация программ
function recommendPrograms(diagnosis) {
    const recommendations = [];
    
    for (const illness of diagnosis.illnesses) {
        const programs = KnowledgeBase.findProgramsByIllness(illness.id);
        
        for (const program of programs) {
            let matchScore = 80;
            
            // Бонус за наличие дома
            if (diagnosis.hasHouse && program.name.includes('дом')) {
                matchScore += 15;
            }
            
            // Бонус за тяжесть
            if (diagnosis.severity >= 4 && program.duration >= 14) {
                matchScore += 5;
            }
            
            recommendations.push({
                ...program,
                matchScore: Math.min(100, matchScore),
                reason: `Соответствует диагнозу: ${illness.name}`
            });
        }
    }

    // Сортировка по проценту совпадения
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Топ-3
    return recommendations.slice(0, 3);
}

// Экспорт
window.DiagnosisEngine = {
    mockDiagnose,
    aiDiagnose,
    validateDiagnosis,
    recommendPrograms
};
