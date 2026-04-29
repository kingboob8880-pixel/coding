/**
 * RUKYA PRO - Plan Builder
 * Assembles complete treatment plans from programs and diagnosis
 */

// Storage is now available globally via window.storage
let programsCache = null;
let blocksCache = null;
let scheduleRulesCache = null;
let soulKnotsContentCache = null;

async function loadPlanData() {
  if (!programsCache) {
    const data = await Promise.all([
      fetch('data/programs.json').then(r => r.json()).catch(() => []),
      fetch('data/blocks.json').then(r => r.json()).catch(() => ({})),
      fetch('data/schedule-rules.json').then(r => r.json()).catch(() => ({})),
      fetch('data/soul_knots_content.json').then(r => r.json()).catch(() => ({}))
    ]);
    programsCache = data[0];
    blocksCache = data[1];
    scheduleRulesCache = data[2];
    soulKnotsContentCache = data[3];
  }
  return { programsCache, blocksCache, scheduleRulesCache, soulKnotsContentCache };
}

function findById(collection, id) {
  return collection?.find(item => item.id === id);
}

/**
 * Rank programs by diagnosis match
 * @param {Array} illnessTypes - Array of illness IDs from diagnosis
 * @returns {Array} Ranked programs with match percentage
 */
async function rankPrograms(illnessTypes) {
  const { programsCache } = await loadPlanData();
  
  if (!illnessTypes || illnessTypes.length === 0) {
    return programsCache.map(p => ({ ...p, matchPercent: 0, matchedIllnesses: [] }));
  }
  
  const ranked = programsCache.map(program => {
    const programIllnesses = program.illness_types || [];
    const matchedIllnesses = illnessTypes.filter(ill => programIllnesses.includes(ill));
    const matchPercent = Math.round((matchedIllnesses.length / illnessTypes.length) * 100);
    
    return {
      ...program,
      matchPercent,
      matchedIllnesses,
      hasAllIllnesses: matchedIllnesses.length === illnessTypes.length
    };
  });
  
  // Sort by match percent (descending), then by whether all illnesses are covered
  return ranked.sort((a, b) => {
    if (b.hasAllIllnesses && !a.hasAllIllnesses) return 1;
    if (a.hasAllIllnesses && !b.hasAllIllnesses) return -1;
    return b.matchPercent - a.matchPercent;
  });
}

/**
 * Get the best matching program for a diagnosis
 */
async function getBestProgram(illnessTypes) {
  const ranked = await rankPrograms(illnessTypes);
  return ranked[0] || null;
}

/**
 * Build a complete treatment plan
 * @param {Object} diagnosis - Diagnosis object with illness types, organs, severity
 * @param {String} programId - Selected program ID
 * @param {Number} durationDays - Course duration in days
 * @param {String} detailLevel - 'short', 'medium', or 'full'
 * @param {Number} formulaLimit - Maximum number of formulas
 * @param {Boolean} includeSoulKnots - Whether to include soul knots course
 * @returns {Object} Complete treatment plan
 */
async function buildTreatmentPlan(diagnosis, programId, durationDays, detailLevel = 'medium', formulaLimit = 50, includeSoulKnots = false) {
  const { programsCache, blocksCache, scheduleRulesCache, soulKnotsContentCache } = await loadPlanData();
  
  const program = findById(programsCache, programId);
  if (!program) {
    throw new Error(`Program not found: ${programId}`);
  }
  
  const rules = scheduleRulesCache;
  const severity = diagnosis.severity || 3;
  const selectedBlocks = getBlocksForDetailLevel(detailLevel, program.blocks, rules);
  
  // Validate duration
  const minDays = rules.min_days || 3;
  const maxDays = rules.max_days || 120;
  const actualDuration = Math.max(minDays, Math.min(durationDays || rules.default_days || 14, maxDays));
  
  // Build formulas from blocks
  const planSections = {};
  let totalFormulas = 0;
  
  for (const blockName of selectedBlocks) {
    if (totalFormulas >= formulaLimit) break;
    
    const blockFormulas = blocksCache[blockName] || [];
    const sectionFormulas = [];
    
    for (const blockItem of blockFormulas) {
      if (totalFormulas >= formulaLimit) break;
      
      // Adjust repeats based on severity and detail level
      const adjustedRepeats = adjustRepeatsBySeverity(blockItem.repeats || 1, severity, detailLevel);
      
      const formula = await buildFormulaFromBlock({
        ...blockItem,
        repeats: adjustedRepeats
      });
      
      sectionFormulas.push(formula);
      totalFormulas++;
    }
    
    if (sectionFormulas.length > 0) {
      planSections[blockName] = sectionFormulas;
    }
  }
  
  // Add soul knots course if requested
  let soulKnotsPlan = null;
  if (includeSoulKnots && soulKnotsContentCache.daily_formulas) {
    soulKnotsPlan = [];
    for (const dayFormula of soulKnotsContentCache.daily_formulas) {
      const skFormula = await buildSoulKnotsFormula(
        dayFormula.day,
        dayFormula.focus,
        dayFormula.verses,
        dayFormula.dua
      );
      soulKnotsPlan.push(skFormula);
    }
  }
  
  // Build the final plan structure
  const plan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    programId,
    programName: program.name_ru,
    diagnosis: {
      illnessTypes: diagnosis.illnessTypes || [],
      organs: diagnosis.organs || [],
      severity,
      hasJinn: diagnosis.hasJinn || false,
      hasAyn: diagnosis.hasAyn || false,
      houseAffected: diagnosis.houseAffected || false
    },
    duration: {
      days: actualDuration,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + actualDuration * 24 * 60 * 60 * 1000).toISOString()
    },
    settings: {
      detailLevel,
      formulaLimit,
      includeSoulKnots
    },
    sections: planSections,
    soulKnots: soulKnotsPlan,
    totalFormulas,
    status: 'active',
    completedDays: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return plan;
}

/**
 * Get blocks to include based on detail level
 */
function getBlocksForDetailLevel(detailLevel, programBlocks, rules) {
  const detailConfig = rules.detail_levels?.[detailLevel];
  
  if (!detailConfig) {
    return programBlocks || [];
  }
  
  // If program has specific blocks, filter by detail level config
  if (programBlocks && programBlocks.length > 0) {
    return programBlocks.filter(block => detailConfig.blocks?.includes(block));
  }
  
  // Otherwise use default blocks for detail level
  return detailConfig.blocks || [];
}

/**
 * Generate daily schedule from plan
 */
function generateDailySchedule(plan) {
  const { sections, soulKnots, duration } = plan;
  const days = duration.days;
  const schedule = [];
  
  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day,
      date: new Date(new Date().getTime() + (day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
      formulas: [],
      completed: false
    };
    
    // Add formulas from each section
    for (const [sectionName, formulas] of Object.entries(sections)) {
      for (const formula of formulas) {
        dayPlan.formulas.push({
          ...formula,
          section: sectionName,
          scheduled: true
        });
      }
    }
    
    // Add soul knots formula for this day if applicable
    if (soulKnots && day <= soulKnots.length) {
      dayPlan.formulas.push({
        ...soulKnots[day - 1],
        section: 'soulKnots',
        scheduled: true
      });
    }
    
    schedule.push(dayPlan);
  }
  
  return schedule;
}

/**
 * Calculate plan progress
 */
function calculateProgress(plan, completedDays) {
  const totalDays = plan.duration.days;
  const percent = Math.round((completedDays / totalDays) * 100);
  
  return {
    completedDays,
    totalDays,
    percent: Math.min(100, percent),
    remainingDays: Math.max(0, totalDays - completedDays),
    status: completedDays >= totalDays ? 'completed' : plan.status
  };
}

/**
 * Export plan as printable format
 */
function exportPlanAsText(plan) {
  let text = `ПЛАН ЛЕЧЕНИЯ\n`;
  text += `===============\n\n`;
  text += `Программа: ${plan.programName}\n`;
  text += `Длительность: ${plan.duration.days} дней\n`;
  text += `Уровень детализации: ${plan.settings.detailLevel}\n`;
  text += `Тяжесть: ${plan.diagnosis.severity}/5\n\n`;
  
  text += `Диагноз:\n`;
  text += `- Типы недугов: ${plan.diagnosis.illnessTypes.join(', ')}\n`;
  text += `- Органы: ${plan.diagnosis.organs.join(', ')}\n`;
  if (plan.diagnosis.hasJinn) text += `- Есть джинн: Да\n`;
  if (plan.diagnosis.hasAyn) text += `- Есть сглаз: Да\n`;
  if (plan.diagnosis.houseAffected) text += `- Затронут дом: Да\n`;
  text += `\n`;
  
  text += `ФОРМУЛЫ:\n`;
  text += `--------\n`;
  
  for (const [sectionName, formulas] of Object.entries(plan.sections)) {
    text += `\n[${sectionName}]\n`;
    for (const formula of formulas) {
      text += `\n  • Повторов: ${formula.repeats}\n`;
      text += `    Арабский: ${formula.arabic.substring(0, 100)}${formula.arabic.length > 100 ? '...' : ''}\n`;
      text += `    Перевод: ${formula.ru}\n`;
    }
  }
  
  if (plan.soulKnots) {
    text += `\n\nКУРС ДУХОВНЫХ ЗАЖИМОВ:\n`;
    text += `--------------------\n`;
    for (const sk of plan.soulKnots) {
      text += `\nДень ${sk.day}: ${sk.focus}\n`;
      text += `Мольба: ${sk.dua}\n`;
    }
  }
  
  return text;
}

async function clearPlanCache() {
  programsCache = null;
  blocksCache = null;
  scheduleRulesCache = null;
  soulKnotsContentCache = null;
}

// Make planBuilder available globally for non-module scripts
window.planBuilder = {
  build,
  rankPrograms,
  generateSchedule,
  addSoulKnotsCourse,
  exportPlanAsText,
  clearPlanCache,
  loadPlanData
};
