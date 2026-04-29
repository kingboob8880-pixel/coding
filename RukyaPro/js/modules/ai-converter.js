/**
 * RUKYA PRO v2.1 — AI Конвертер жалоб в JSON для DeepSeek
 * Преобразует свободный текст жалобы в структурированный JSON для системы
 */

const AIConverterModule = {
  
  /**
   * Системный промпт для конвертации жалоб в JSON
   */
  getSystemPrompt() {
    return `Ты — помощник специалиста по рукье (исламский экзорцист). 
Твоя задача: преобразовать жалобы пациента в структурированный JSON формат для системы RUKYA PRO.

ФОРМАТ ВЫХОДНОГО JSON (строго следуй этой структуре):
{
  "patient": {
    "name": "Имя пациента (если указано)",
    "age": возраст_числом_или_null,
    "gender": "male/female/unknown",
    "city": "Город (если указан)"
  },
  "complaints": "Полный текст жалоб одним блоком",
  "symptoms": {
    "heart_chest": ["симптом1", "симптом2"],
    "head_mind": ["симптом1"],
    "family": [],
    "home": ["симптом1"],
    "obsessions": [],
    "evil_eye": [],
    "dynamics": [],
    "pain_localization": []
  },
  "preliminary_diagnosis": {
    "type": "sihr_mahfi|massas_jinn|ayn_hasida|waswasa_dini|sihr_tafriq|sihr_mahabba|unknown",
    "severity": 1-5,
    "affected_organs": ["qalb", "sadr", "batn", "ras"],
    "has_jinn": false,
    "has_evil_eye": false,
    "house_affected": false
  },
  "notes": "Дополнительные наблюдения"
}

ПРАВИЛА:
1. Если данные не указаны — ставь null или пустой массив
2. Тип недуга выбирай из: sihr_mahfi (скрытый сихр), massas_jinn (касание джинна), ayn_hasida (сглаз), waswasa_dini (навязчивые мысли), sihr_tafriq (разлад), sihr_mahabba (привязанность)
3. Органы: qalb (сердце), sadr (грудь), batn (живот), ras (голова), jasad (тело), aql (разум)
4. Анализируй симптомы и предлагай наиболее вероятный диагноз
5. ОТВЕЧАЙ ТОЛЬКО JSON без дополнительного текста`;
  },

  /**
   * Конвертация текста жалобы в JSON через DeepSeek API
   */
  async convertToJSON(complaintText, apiKey) {
    if (!apiKey) {
      throw new Error('API ключ DeepSeek не установлен');
    }

    if (!complaintText || complaintText.trim().length < 10) {
      throw new Error('Текст жалобы слишком короткий');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: `Преобразуй следующую жалобу в JSON:\n\n${complaintText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Ошибка API DeepSeek');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Извлекаем JSON из ответа (может быть в markdown блоке)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось извлечь JSON из ответа AI');
    }

    try {
      const parsedJSON = JSON.parse(jsonMatch[0]);
      return this.validateAndNormalize(parsedJSON);
    } catch (parseError) {
      throw new Error(`Ошибка парсинга JSON: ${parseError.message}`);
    }
  },

  /**
   * Валидация и нормализация JSON
   */
  validateAndNormalize(data) {
    const normalized = {
      patient: {
        name: data.patient?.name || '',
        age: data.patient?.age || null,
        gender: ['male', 'female'].includes(data.patient?.gender) 
          ? data.patient.gender 
          : 'unknown',
        city: data.patient?.city || ''
      },
      complaints: data.complaints || '',
      symptoms: {
        heart_chest: Array.isArray(data.symptoms?.heart_chest) 
          ? data.symptoms.heart_chest 
          : [],
        head_mind: Array.isArray(data.symptoms?.head_mind) 
          ? data.symptoms.head_mind 
          : [],
        family: Array.isArray(data.symptoms?.family) 
          ? data.symptoms.family 
          : [],
        home: Array.isArray(data.symptoms?.home) 
          ? data.symptoms.home 
          : [],
        obsessions: Array.isArray(data.symptoms?.obsessions) 
          ? data.symptoms.obsessions 
          : [],
        evil_eye: Array.isArray(data.symptoms?.evil_eye) 
          ? data.symptoms.evil_eye 
          : [],
        dynamics: Array.isArray(data.symptoms?.dynamics) 
          ? data.symptoms.dynamics 
          : [],
        pain_localization: Array.isArray(data.symptoms?.pain_localization) 
          ? data.symptoms.pain_localization 
          : []
      },
      preliminary_diagnosis: {
        type: this.validateDiagnosisType(data.preliminary_diagnosis?.type),
        severity: Math.min(5, Math.max(1, data.preliminary_diagnosis?.severity || 2)),
        affected_organs: Array.isArray(data.preliminary_diagnosis?.affected_organs)
          ? data.preliminary_diagnosis.affected_organs
          : [],
        has_jinn: !!data.preliminary_diagnosis?.has_jinn,
        has_evil_eye: !!data.preliminary_diagnosis?.has_evil_eye,
        house_affected: !!data.preliminary_diagnosis?.house_affected
      },
      notes: data.notes || ''
    };

    return normalized;
  },

  /**
   * Валидация типа диагноза
   */
  validateDiagnosisType(type) {
    const validTypes = [
      'sihr_mahfi', 'massas_jinn', 'ayn_hasida', 
      'waswasa_dini', 'sihr_tafriq', 'sihr_mahabba',
      'sihr_bayt', 'sihr_mujaddad', 'hasad', 'khawf', 'huzn'
    ];
    
    return validTypes.includes(type) ? type : 'unknown';
  },

  /**
   * Быстрый анализ без API (локальная эвристика)
   */
  quickAnalysis(complaintText) {
    const text = complaintText.toLowerCase();
    
    const symptoms = {
      heart_chest: [],
      head_mind: [],
      family: [],
      home: [],
      obsessions: [],
      evil_eye: [],
      dynamics: [],
      pain_localization: []
    };

    // Ключевые слова для категорий
    const keywords = {
      heart_chest: ['сердц', 'груд', 'дышани', 'колоти', 'сжало', 'боль в груд'],
      head_mind: ['голов', 'разум', 'мысл', 'памят', 'головокруж', 'мигрень'],
      family: ['муж', 'жена', 'семь', 'ребенок', 'дет', 'родител', 'конфликт'],
      home: ['дом', 'квартир', 'комнат', 'угол', 'предмет', 'вещь ломает'],
      obsessions: ['навязчив', 'постоянно', 'не могу', 'сил', 'контрол'],
      evil_eye: ['сглаз', 'завист', 'похвал', 'восхищ', 'почернел', 'испортил'],
      dynamics: ['ухудш', 'улучш', 'период', 'волн', 'приступ'],
      pain_localization: ['болит', 'боль', 'колет', 'тянет', 'жжет', 'онем']
    };

    // Анализ текста
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (text.includes(word)) {
          symptoms[category].push(word);
        }
      }
    }

    // Определение типа недуга
    let diagnosisType = 'unknown';
    let severity = 2;

    if (symptoms.evil_eye.length > 0) {
      diagnosisType = 'ayn_hasida';
      severity = 2;
    } else if (symptoms.family.length > 0 && text.includes('разлад')) {
      diagnosisType = 'sihr_tafriq';
      severity = 4;
    } else if (symptoms.obsessions.length > 0 && text.includes('намаз')) {
      diagnosisType = 'waswasa_dini';
      severity = 3;
    } else if (symptoms.home.length > 0) {
      diagnosisType = 'sihr_mahfi';
      severity = 4;
    } else if (text.includes('джинн') || text.includes('масс')) {
      diagnosisType = 'massas_jinn';
      severity = 5;
    }

    // Определение органов
    const organs = [];
    if (symptoms.heart_chest.length > 0) organs.push('qalb', 'sadr');
    if (symptoms.head_mind.length > 0) organs.push('ras', 'aql');
    if (text.includes('живот')) organs.push('batn');
    if (text.includes('спин')) organs.push('zahr');

    return {
      patient: { name: '', age: null, gender: 'unknown', city: '' },
      complaints: complaintText,
      symptoms,
      preliminary_diagnosis: {
        type: diagnosisType,
        severity,
        affected_organs: [...new Set(organs)],
        has_jinn: text.includes('джинн'),
        has_evil_eye: symptoms.evil_eye.length > 0,
        house_affected: symptoms.home.length > 0
      },
      notes: ''
    };
  },

  /**
   * UI для модального окна конвертера
   */
  renderModal() {
    return `
      <div class="modal modal-enter" id="ai-converter-modal">
        <div class="modal-overlay" onclick="App.closeModal('ai-converter-modal')"></div>
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h2>🤖 AI Конвертер жалоб в JSON</h2>
            <button class="btn-icon" onclick="App.closeModal('ai-converter-modal')">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Текст жалобы пациента:</label>
              <textarea 
                id="ai-complaint-input" 
                class="input-field" 
                rows="8" 
                placeholder="Опишите симптомы пациента свободным текстом...&#10;&#10;Пример: Пациент жалуется на сильную боль в груди, постоянные головные боли, кошмары каждую ночь. В доме часто бьется посуда. Замечает сглаз после похвалы."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>Режим анализа:</label>
                <select id="ai-analysis-mode" class="input-field">
                  <option value="deepseek">DeepSeek API (точный)</option>
                  <option value="local">Локальный анализ (быстрый)</option>
                </select>
              </div>
            </div>

            <div class="form-actions" style="margin-top: 20px;">
              <button class="btn btn-primary" onclick="AIConverterModule.processConversion()">
                🚀 Конвертировать в JSON
              </button>
              <button class="btn btn-secondary" onclick="App.closeModal('ai-converter-modal')">
                Отмена
              </button>
            </div>

            <div id="ai-converter-result" class="mt-4" style="display: none;">
              <label>Результат:</label>
              <pre id="ai-json-output" class="code-block" style="background: var(--bg-secondary); padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px;"></pre>
              
              <div class="form-actions mt-3">
                <button class="btn btn-success" onclick="AIConverterModule.applyResult()">
                  ✅ Применить в мастер приёма
                </button>
                <button class="btn btn-secondary" onclick="AIConverterModule.copyResult()">
                  📋 Копировать JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Обработка конвертации
   */
  async processConversion() {
    const complaintText = document.getElementById('ai-complaint-input').value;
    const mode = document.getElementById('ai-analysis-mode').value;
    const resultDiv = document.getElementById('ai-converter-result');
    const outputPre = document.getElementById('ai-json-output');

    if (!complaintText.trim()) {
      App.toast('⚠️ Введите текст жалобы', 'warning');
      return;
    }

    // Показываем индикатор загрузки
    outputPre.textContent = '⏳ Анализ...';
    resultDiv.style.display = 'block';

    try {
      let result;

      if (mode === 'deepseek') {
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
          App.toast('⚠️ Установите API ключ DeepSeek в настройках', 'warning');
          outputPre.textContent = 'Ошибка: API ключ не установлен';
          return;
        }
        result = await this.convertToJSON(complaintText, apiKey);
      } else {
        // Локальный анализ
        await new Promise(resolve => setTimeout(resolve, 800)); // Имитация задержки
        result = this.quickAnalysis(complaintText);
      }

      this.lastResult = result;
      outputPre.textContent = JSON.stringify(result, null, 2);
      App.toast('✅ Конвертация успешна', 'success');

    } catch (error) {
      console.error('Conversion Error:', error);
      outputPre.textContent = `❌ Ошибка: ${error.message}`;
      App.toast('❌ Ошибка конвертации', 'error');
    }
  },

  /**
   * Применение результата в мастер приёма
   */
  applyResult() {
    if (!this.lastResult) {
      App.toast('⚠️ Сначала выполните конвертацию', 'warning');
      return;
    }

    // Закрываем модалку
    App.closeModal('ai-converter-modal');

    // Переходим в мастер приёма
    App.navigate('#/newcase');

    // Заполняем поля мастера (будет реализовано в app.js)
    setTimeout(() => {
      if (this.lastResult.patient.name) {
        document.getElementById('patient-name')?.setValue(this.lastResult.patient.name);
      }
      if (this.lastResult.complaints) {
        document.getElementById('patient-complaints')?.setValue(this.lastResult.complaints);
      }
      
      // Сохраняем предварительный диагноз
      localStorage.setItem('imported_diagnosis', JSON.stringify(this.lastResult.preliminary_diagnosis));
      
      App.toast('✅ Данные применены в мастер приёма', 'success');
    }, 500);
  },

  /**
   * Копирование JSON в буфер
   */
  copyResult() {
    if (!this.lastResult) return;

    navigator.clipboard.writeText(JSON.stringify(this.lastResult, null, 2))
      .then(() => {
        App.toast('📋 JSON скопирован в буфер', 'success');
      })
      .catch(() => {
        App.toast('❌ Ошибка копирования', 'error');
      });
  }
};
