/**
 * RUKYA PRO - Formula Builder
 * Generates complete ruqya formulas from templates with variable substitution
 */

// Storage is now available globally via window.storage
let attributesCache = null;
let organsCache = null;
let templatesCache = null;
let actionsCache = null;
let illnessesCache = null;

async function loadData() {
  if (!attributesCache) {
    const data = await Promise.all([
      fetch('data/attributes.json').then(r => r.json()).catch(() => []),
      fetch('data/organs.json').then(r => r.json()).catch(() => []),
      fetch('data/templates.json').then(r => r.json()).catch(() => []),
      fetch('data/actions.json').then(r => r.json()).catch(() => []),
      fetch('data/illnesses.json').then(r => r.json()).catch(() => [])
    ]);
    attributesCache = data[0];
    organsCache = data[1];
    templatesCache = data[2];
    actionsCache = data[3];
    illnessesCache = data[4];
  }
  return { attributesCache, organsCache, templatesCache, actionsCache, illnessesCache };
}

function findById(collection, id) {
  return collection?.find(item => item.id === id);
}

// Arabic case forms for organs (simplified)
const organCases = {
  qalb: { nom: 'القلب', gen: 'القلب', acc: 'القلب' },
  sadr: { nom: 'الصدر', gen: 'الصدر', acc: 'الصدر' },
  batn: { nom: 'البطن', gen: 'البطن', acc: 'البطن' },
  ras: { nom: 'الرأس', gen: 'الرأس', acc: 'الرأس' },
  jasad: { nom: 'الجسد', gen: 'الجسد', acc: 'الجسد' },
  aql: { nom: 'العقل', gen: 'العقل', acc: 'العقل' },
  zahr: { nom: 'الظهر', gen: 'الظهر', acc: 'الظهر' },
  unuq: { nom: 'العنق', gen: 'العنق', acc: 'العنق' },
  yadayn: { nom: 'اليدين', gen: 'اليدين', acc: 'اليدين' },
  rijlayn: { nom: 'الرجلين', gen: 'الرجلين', acc: 'الرجلين' }
};

// Russian possessive forms
const russianPossessive = {
  qalb: { base: 'сердце', possessive: 'моего сердца' },
  sadr: { base: 'грудь', possessive: 'моей груди' },
  batn: { base: 'живот', possessive: 'моего живота' },
  ras: { base: 'голова', possessive: 'моей головы' },
  jasad: { base: 'тело', possessive: 'моего тела' },
  aql: { base: 'разум', possessive: 'моего разума' },
  qalb_aql: { base: 'сердце и разум', possessive: 'моего сердца и разума' },
  zahr: { base: 'спина', possessive: 'моей спины' },
  unuq: { base: 'шея', possessive: 'моей шеи' },
  yadayn: { base: 'руки', possessive: 'моих рук' },
  rijlayn: { base: 'ноги', possessive: 'моих ног' }
};

async function buildFormula(templateId, attributeId, organId, illnessId, actionId, repeats = 1) {
  const { attributesCache, organsCache, templatesCache, actionsCache, illnessesCache } = await loadData();
  
  const template = findById(templatesCache, templateId);
  const attribute = findById(attributesCache, attributeId);
  const organ = findById(organsCache, organId);
  const action = findById(actionsCache, actionId);
  const illness = findById(illnessesCache, illnessId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  // Build Arabic formula with substitutions
  let arabicText = template.arabic_template;
  let translitText = template.translit_template;
  let ruText = template.ru_template;
  
  // Substitute attribute names
  if (attribute) {
    arabicText = arabicText.replace(/\{attribute_ar\}/g, attribute.name_ar);
    translitText = translitText.replace(/\{attribute_ru\}/g, attribute.name_ru);
    ruText = ruText.replace(/\{attribute_ru\}/g, attribute.name_ru.toLowerCase());
  }
  
  // Substitute organ names
  if (organ) {
    const arabicOrgan = organCases[organ.id]?.nom || organ.name_ar;
    arabicText = arabicText.replace(/\{organ_ar\}/g, arabicOrgan);
    translitText = translitText.replace(/\{organ_ru\}/g, organ.name_ru);
    
    if (russianPossessive[organ.id]) {
      ruText = ruText.replace(/\{organ_possessive\}/g, russianPossessive[organ.id].possessive);
      ruText = ruText.replace(/\{organ_base\}/g, russianPossessive[organ.id].base);
    } else {
      ruText = ruText.replace(/\{organ_possessive\}/g, organ.name_ru);
      ruText = ruText.replace(/\{organ_base\}/g, organ.name_ru);
    }
  }
  
  // Substitute illness names
  if (illness) {
    arabicText = arabicText.replace(/\{illness_ar\}/g, illness.name_ar);
    translitText = translitText.replace(/\{illness_ru\}/g, illness.name_ru);
    ruText = ruText.replace(/\{illness_ru\}/g, illness.name_ru.toLowerCase());
  }
  
  // Substitute action names
  if (action) {
    arabicText = arabicText.replace(/\{action_ar\}/g, action.name_ar);
    translitText = translitText.replace(/\{action_ru\}/g, action.name_ru);
    ruText = ruText.replace(/\{action_ru\}/g, action.name_ru.toLowerCase());
  }
  
  return {
    id: `${templateId}_${attributeId}_${organId}_${illnessId}_${actionId}_${Date.now()}`,
    templateId,
    attributeId,
    organId,
    illnessId,
    actionId,
    repeats,
    arabic: arabicText,
    translit: translitText,
    ru: ruText,
    type: template.type,
    metadata: {
      attributeName: attribute?.name_ru || '',
      organName: organ?.name_ru || '',
      illnessName: illness?.name_ru || '',
      actionName: action?.name_ru || ''
    }
  };
}

async function buildFormulaFromBlock(block) {
  return buildFormula(
    block.template_id,
    block.attribute,
    block.organ,
    block.illness,
    block.action,
    block.repeats
  );
}

async function buildSoulKnotsFormula(day, focus, verses, dua) {
  const { versesCache } = await loadVerses();
  
  const verseTexts = verses.map(verseId => {
    const verse = findById(versesCache, verseId);
    return verse ? {
      arabic: verse.arabic,
      translit: verse.translit,
      ru: verse.ru,
      name: verse.name_ru
    } : null;
  }).filter(Boolean);
  
  return {
    id: `soul_knots_day_${day}`,
    day,
    focus,
    verses: verseTexts,
    dua,
    type: 'soul_knots'
  };
}

let versesCache = null;

async function loadVerses() {
  if (!versesCache) {
    versesCache = await fetch('data/verses.json').then(r => r.json()).catch(() => []);
  }
  return { versesCache };
}

async function getVerse(verseId) {
  const { versesCache } = await loadVerses();
  return findById(versesCache, verseId);
}

async function getVersesForIllness(illnessCategory) {
  const routing = await fetch('data/ayah-routing.json').then(r => r.json()).catch(() => ({}));
  const verseIds = routing[illnessCategory] || [];
  
  const { versesCache } = await loadVerses();
  return verseIds.map(id => findById(versesCache, id)).filter(Boolean);
}

function adjustRepeatsBySeverity(baseRepeats, severity, detailLevel = 'medium') {
  const severityMultipliers = {
    1: 0.7,
    2: 0.85,
    3: 1.0,
    4: 1.2,
    5: 1.5
  };
  
  const detailMultipliers = {
    short: 0.7,
    medium: 1.0,
    full: 1.3
  };
  
  const severityMult = severityMultipliers[severity] || 1.0;
  const detailMult = detailMultipliers[detailLevel] || 1.0;
  
  return Math.round(baseRepeats * severityMult * detailMult);
}

async function clearCache() {
  attributesCache = null;
  organsCache = null;
  templatesCache = null;
  actionsCache = null;
  illnessesCache = null;
  versesCache = null;
}

// Make builder available globally for non-module scripts
window.builder = {
  buildFormula,
  buildFormulaFromBlock,
  buildSoulKnotsFormula,
  getVerse,
  getVersesForIllness,
  adjustRepeatsBySeverity,
  clearCache,
  loadData
};
