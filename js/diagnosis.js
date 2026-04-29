/**
 * RUKYA PRO - Diagnostic Engine
 * Local diagnosis algorithm and AI integration (DeepSeek)
 */

// Storage is now available globally via window.storage
let illnessesCache = null;
let organsCache = null;
let complaintCorpusCache = null;
let matrixCache = null;

async function loadDiagnosisData() {
  if (!illnessesCache) {
    const data = await Promise.all([
      fetch('data/illnesses.json').then(r => r.json()).catch(() => []),
      fetch('data/organs.json').then(r => r.json()).catch(() => []),
      fetch('data/complaint-corpus.json').then(r => r.json()).catch(() => ({})),
      fetch('data/matrix.json').then(r => r.json()).catch(() => ({}))
    ]);
    illnessesCache = data[0];
    organsCache = data[1];
    complaintCorpusCache = data[2];
    matrixCache = data[3];
  }
  return { illnessesCache, organsCache, complaintCorpusCache, matrixCache };
}

/**
 * Local diagnosis algorithm (works offline)
 * Analyzes complaints and questionnaire responses
 */
async function mockDiagnose(complaints, questionnaireResponses = {}) {
  const { illnessesCache, organsCache, complaintCorpusCache, matrixCache } = await loadDiagnosisData();
  
  const detectedIllnesses = [];
  const detectedOrgans = [];
  let severitySum = 0;
  let severityCount = 0;
  
  // Parse complaints text
  const complaintsLower = complaints.toLowerCase();
  
  // Match against complaint corpus
  if (complaintCorpusCache.phrases) {
    for (const phrase of complaintCorpusCache.phrases) {
      if (complaintsLower.includes(phrase.text.toLowerCase())) {
        // Add illness indicators
        if (phrase.keywords) {
          for (const keyword of phrase.keywords) {
            // Map keywords to illnesses
            const illnessMapping = mapKeywordToIllness(keyword);
            if (illnessMapping && !detectedIllnesses.includes(illnessMapping)) {
              detectedIllnesses.push(illnessMapping);
            }
            
            // Map keywords to organs
            const organMapping = mapKeywordToOrgan(keyword);
            if (organMapping && !detectedOrgans.includes(organMapping)) {
              detectedOrgans.push(organMapping);
            }
          }
        }
        
        // Add to severity calculation
        severitySum += phrase.severity || 2;
        severityCount++;
      }
    }
  }
  
  // Check questionnaire responses
  for (const [category, responses] of Object.entries(questionnaireResponses)) {
    if (Array.isArray(responses)) {
      for (const response of responses) {
        if (response.checked) {
          const categoryMapping = mapCategoryToIllness(category, response.id);
          if (categoryMapping && !detectedIllnesses.includes(categoryMapping)) {
            detectedIllnesses.push(categoryMapping);
          }
          
          const organFromCategory = mapCategoryToOrgan(category);
          if (organFromCategory && !detectedOrgans.includes(organFromCategory)) {
            detectedOrgans.push(organFromCategory);
          }
          
          severitySum += 2;
          severityCount++;
        }
      }
    }
  }
  
  // Calculate average severity (1-5 scale)
  const avgSeverity = severityCount > 0 
    ? Math.round(severitySum / severityCount) 
    : 3;
  const severity = Math.max(1, Math.min(5, avgSeverity));
  
  // Determine priority based on illness types
  let priority = 'standard';
  if (detectedIllnesses.includes('sihr_mujaddad')) {
    priority = 'renewing_sihr';
  } else if (detectedIllnesses.some(i => i.startsWith('sihr')) && detectedIllnesses.some(i => i.startsWith('massas'))) {
    priority = 'sihr_jinn_combo';
  } else if (detectedIllnesses.includes('ayn_hasida')) {
    priority = 'ayn_after_main';
  }
  
  // Determine ruqya method
  let method = 'standard';
  if (detectedIllnesses.some(i => i.includes('jinn'))) {
    method = 'expulsion_focus';
  } else if (detectedIllnesses.some(i => i.includes('sihr'))) {
    method = 'breaking_focus';
  }
  
  // Build healer case analysis
  const healerCase = buildHealerCase(detectedIllnesses, detectedOrgans, severity, complaints);
  
  return {
    patient: {},
    clinic: {
      complaints,
      questionnaire: questionnaireResponses
    },
    diagnosis: {
      illnessTypes: detectedIllnesses.length > 0 ? detectedIllnesses : ['waswasa_dini'],
      organs: detectedOrgans.length > 0 ? detectedOrgans : ['qalb'],
      severity,
      hasJinn: detectedIllnesses.some(i => i.includes('jinn')),
      jinnType: detectedIllnesses.includes('massas_jinn') ? 'marid' : null,
      jinnLocation: detectedOrgans.find(o => ['batn', 'sadr', 'qalb'].includes(o)) || null,
      hasAyn: detectedIllnesses.some(i => i.includes('ayn') || i.includes('hasad')),
      houseAffected: detectedIllnesses.includes('sihr_bayt') || complaintsLower.includes('дом'),
      priority,
      method
    },
    healer_case: healerCase,
    notes: generateNotes(detectedIllnesses, severity)
  };
}

function mapKeywordToIllness(keyword) {
  const mappings = {
    'headache': 'waswasa_dini',
    'ras': 'waswasa_dini',
    'chest_pain': 'massas_jinn',
    'sadr': 'massas_jinn',
    'qalb': 'sihr_tafriq',
    'fear': 'khawf',
    'panic': 'khawf',
    'khawf': 'khawf',
    'nightmares': 'massas_jinn',
    'sleep': 'waswasa_dini',
    'irritability': 'ghadab',
    'ghadab': 'ghadab',
    'prayer': 'waswasa_dini',
    'waswasa': 'waswasa_dini',
    'salah': 'waswasa_dini',
    'obsession': 'waswasa_dini',
    'aql': 'waswasa_dini',
    'cold': 'sihr_bayt',
    'limbs': 'sihr_bayt',
    'rijlayn': 'sihr_bayt',
    'yadayn': 'sihr_bayt',
    'abdomen': 'massas_jinn',
    'batn': 'massas_jinn',
    'insomnia': 'waswasa_dini',
    'quran': 'massas_jinn',
    'reaction': 'massas_jinn',
    'voice': 'massas_jinn',
    'change': 'massas_jinn',
    'family': 'sihr_tafriq',
    'conflict': 'sihr_tafriq',
    'tafriq': 'sihr_tafriq',
    'house': 'sihr_bayt',
    'bayt': 'sihr_bayt',
    'sihr': 'sihr_mahfi',
    'ayn': 'ayn_hasida',
    'praise': 'ayn_hasida',
    'hasad': 'hasad',
    'weakness': 'sihr_mahfi',
    'fatigue': 'sihr_mahfi',
    'appetite': 'sihr_mahfi',
    'back': 'massas_jinn',
    'zahr': 'massas_jinn',
    'anxiety': 'khawf',
    'sadness': 'huzn',
    'huzn': 'huzn',
    'depression': 'huzn'
  };
  return mappings[keyword] || null;
}

function mapKeywordToOrgan(keyword) {
  const organKeywords = ['qalb', 'sadr', 'batn', 'ras', 'aql', 'zahr', 'unuq', 'yadayn', 'rijlayn'];
  if (organKeywords.includes(keyword)) {
    return keyword;
  }
  
  const mappings = {
    'chest_pain': 'sadr',
    'headache': 'ras',
    'abdomen': 'batn',
    'back': 'zahr'
  };
  return mappings[keyword] || null;
}

function mapCategoryToIllness(category, symptomId) {
  const mappings = {
    'heart_chest': 'massas_jinn',
    'head_mind': 'waswasa_dini',
    'family': 'sihr_tafriq',
    'house': 'sihr_bayt',
    'obsessions': 'waswasa_dini',
    'evil_eye': 'ayn_hasida',
    'dynamics': 'sihr_mujaddad',
    'pain_localization': 'massas_jinn'
  };
  return mappings[category] || null;
}

function mapCategoryToOrgan(category) {
  const mappings = {
    'heart_chest': 'qalb',
    'head_mind': 'aql',
    'pain_localization': 'jasad'
  };
  return mappings[category] || null;
}

function buildHealerCase(illnesses, organs, severity, complaints) {
  // Calculate confidence based on evidence
  const evidenceCount = illnesses.length + organs.length;
  const confidence = Math.min(5, Math.ceil(evidenceCount / 2));
  
  // Build evidence list
  const evidence = [];
  for (const illness of illnesses) {
    evidence.push(`Симптомы указывают на ${getIllnessName(illness)}`);
  }
  for (const organ of organs) {
    evidence.push(`Затронут орган: ${getOrganName(organ)}`);
  }
  
  // Differential hypotheses
  const differentials = [];
  if (illnesses.includes('waswasa_dini')) {
    differentials.push('Возможно сочетание с масс джинн');
  }
  if (illnesses.includes('sihr_tafriq')) {
    differentials.push('Проверить наличие сихра в доме');
  }
  
  // Warnings about treatment order
  const warnings = [];
  if (severity >= 4) {
    warnings.push('Требуется интенсивный курс лечения');
  }
  if (illnesses.some(i => i.includes('sihr')) && illnesses.some(i => i.includes('jinn'))) {
    warnings.push('Сначала работать со связкой сихр-джинн');
  }
  
  // Top recommended programs
  const topPrograms = recommendPrograms(illnesses);
  
  return {
    confidence,
    evidence,
    differentials,
    warnings,
    topPrograms
  };
}

function getIllnessName(id) {
  const names = {
    'sihr_mahfi': 'скрытый сихр',
    'sihr_tafriq': 'сихр разлада',
    'sihr_mahabba': 'сихр привязанности',
    'sihr_bayt': 'сихр в доме',
    'sihr_mujaddad': 'обновляемый сихр',
    'massas_jinn': 'касание джинна',
    'ayn_hasida': 'сглаз',
    'hasad': 'зависть',
    'waswasa_dini': 'васваса',
    'khawf': 'страх',
    'huzn': 'печаль',
    'ghadab': 'гнев'
  };
  return names[id] || id;
}

function getOrganName(id) {
  const names = {
    'qalb': 'сердце',
    'sadr': 'грудь',
    'batn': 'живот',
    'ras': 'голова',
    'jasad': 'тело',
    'aql': 'разум',
    'zahr': 'спина'
  };
  return names[id] || id;
}

function recommendPrograms(illnesses) {
  const recommendations = [];
  
  if (illnesses.includes('sihr_tafriq')) {
    recommendations.push({
      programId: 'sihr_tafriq_standard',
      matchPercent: 95,
      reason: 'Специализированная программа для разлада'
    });
  }
  if (illnesses.includes('massas_jinn')) {
    recommendations.push({
      programId: 'massas_jinn_intensive',
      matchPercent: 90,
      reason: 'Интенсивный курс для изгнания джинна'
    });
  }
  if (illnesses.includes('ayn_hasida')) {
    recommendations.push({
      programId: 'ayn_hasida_light',
      matchPercent: 85,
      reason: 'Лёгкий курс от сглаза'
    });
  }
  if (illnesses.includes('waswasa_dini')) {
    recommendations.push({
      programId: 'waswasa_dini_course',
      matchPercent: 88,
      reason: 'Духовный курс от васвасы'
    });
  }
  
  return recommendations.slice(0, 3);
}

function generateNotes(illnesses, severity) {
  const notes = [];
  
  notes.push('Рекомендуется начать лечение как можно скорее.');
  
  if (severity >= 4) {
    notes.push('При высокой тяжести возможно усиление симптомов в первые дни — это признак выхода джинна.');
  }
  
  if (illnesses.includes('sihr_bayt')) {
    notes.push('Необходимо провести чистку помещения параллельно с лечением пациента.');
  }
  
  notes.push('Важно соблюдать адабы рукьи: чтение азкаров, своевременный намаз, избегание грехов.');
  
  return notes.join(' ');
}

/**
 * Validate and normalize diagnosis structure
 */
function validate(diagnosis) {
  if (!diagnosis) return false;
  
  const required = ['illnessTypes', 'organs', 'severity'];
  for (const field of required) {
    if (!diagnosis[field]) return false;
  }
  
  // Normalize arrays
  if (!Array.isArray(diagnosis.illnessTypes)) {
    diagnosis.illnessTypes = [diagnosis.illnessTypes];
  }
  if (!Array.isArray(diagnosis.organs)) {
    diagnosis.organs = [diagnosis.organs];
  }
  
  // Clamp severity
  diagnosis.severity = Math.max(1, Math.min(5, parseInt(diagnosis.severity) || 3));
  
  // Set defaults
  diagnosis.hasJinn = diagnosis.hasJinn || false;
  diagnosis.hasAyn = diagnosis.hasAyn || false;
  diagnosis.houseAffected = diagnosis.houseAffected || false;
  
  return true;
}

/**
 * Call DeepSeek API for AI diagnosis
 */
async function diagnoseWithAI(complaints, apiKey, questionnaireResponses = {}) {
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }
  
  const prompt = buildAIPrompt(complaints, questionnaireResponses);
  
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
          {
            role: 'system',
            content: 'Вы — помощник специалиста по рукье. Анализируйте симптомы и предлагайте диагноз духовных недугов (сихр, джинн, сглаз, васваса). НЕ ставьте медицинские диагнозы. Возвращайте ответ в формате JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);
    
    // Validate and normalize
    if (validate(aiResponse.diagnosis || aiResponse)) {
      return {
        patient: aiResponse.patient || {},
        clinic: aiResponse.clinic || { complaints },
        diagnosis: aiResponse.diagnosis || aiResponse,
        healer_case: aiResponse.healer_case || buildHealerCase(
          (aiResponse.diagnosis || aiResponse).illnessTypes,
          (aiResponse.diagnosis || aiResponse).organs,
          (aiResponse.diagnosis || aiResponse).severity,
          complaints
        ),
        notes: aiResponse.notes || generateNotes(
          (aiResponse.diagnosis || aiResponse).illnessTypes,
          (aiResponse.diagnosis || aiResponse).severity
        )
      };
    }
    
    throw new Error('Invalid diagnosis format from AI');
  } catch (error) {
    console.error('AI diagnosis failed:', error);
    // Fallback to local diagnosis
    return mockDiagnose(complaints, questionnaireResponses);
  }
}

function buildAIPrompt(complaints, questionnaireResponses) {
  let prompt = `Пациент описывает следующие симптомы:\n${complaints}\n\n`;
  
  if (Object.keys(questionnaireResponses).length > 0) {
    prompt += `Ответы на опросник:\n${JSON.stringify(questionnaireResponses, null, 2)}\n\n`;
  }
  
  prompt += `Проанализируйте симптомы и верните диагноз в формате JSON:
{
  "diagnosis": {
    "illnessTypes": ["sihr_mahfi", "massas_jinn"],
    "organs": ["qalb", "sadr"],
    "severity": 3,
    "hasJinn": false,
    "hasAyn": false,
    "houseAffected": false
  },
  "healer_case": {
    "confidence": 4,
    "evidence": ["симptom 1", "symptom 2"],
    "differentials": ["alternative 1"],
    "warnings": ["warning 1"],
    "topPrograms": [{"programId": "...", "matchPercent": 90, "reason": "..."}]
  },
  "notes": "рекомендации лекарю"
}`;
  
  return prompt;
}

async function clearDiagnosisCache() {
  illnessesCache = null;
  organsCache = null;
  complaintCorpusCache = null;
  matrixCache = null;
}

// Make diagnosis available globally for non-module scripts
window.diagnosis = {
  runLocal: mockDiagnose,
  runAI: diagnoseWithAI,
  clearDiagnosisCache,
  loadDiagnosisData
};
