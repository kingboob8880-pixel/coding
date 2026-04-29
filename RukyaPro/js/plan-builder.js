/**
 * RUKYA PRO — Конструктор планов лечения
 */

// Сборка плана для пациента
async function createTreatmentPlan(patientId, diagnosis, programId, duration, detailLevel, limitFormulas, includeSoulKnots) {
    const program = KnowledgeBase.programs.find(p => p.id === programId);
    
    if (!program) {
        throw new Error('Программа не найдена');
    }
    
    // Генерация плана
    const planData = FormulaBuilder.buildFullPlan(
        diagnosis,
        program,
        duration,
        detailLevel,
        limitFormulas,
        includeSoulKnots
    );
    
    // Сохранение в базу
    const plan = await RukyaStorage.add(RukyaStorage.STORES.PLANS, {
        patientId,
        ...planData,
        diagnosis,
        status: 'active',
        completedDays: 0,
        startDate: new Date().toISOString(),
        nextVisitDate: calculateNextVisit(duration)
    });
    
    return plan;
}

// Расчёт даты следующего визита
function calculateNextVisit(duration) {
    const date = new Date();
    date.setDate(date.getDate() + Math.min(7, duration));
    return date.toISOString().split('T')[0];
}

// Обновление прогресса плана
async function updatePlanProgress(planId, completedDays) {
    const plan = await RukyaStorage.get(RukyaStorage.STORES.PLANS, planId);
    
    if (!plan) {
        throw new Error('План не найден');
    }
    
    const progress = Math.round((completedDays / plan.duration) * 100);
    
    let status = 'active';
    if (progress >= 100) {
        status = 'completed';
    }
    
    await RukyaStorage.update(RukyaStorage.STORES.PLANS, {
        ...plan,
        completedDays,
        progress,
        status,
        updatedAt: new Date().toISOString()
    });
    
    return { completedDays, progress, status };
}

// Получение статистики по планам
async function getPlansStats() {
    const plans = await RukyaStorage.getAll(RukyaStorage.STORES.PLANS);
    
    const stats = {
        total: plans.length,
        active: 0,
        paused: 0,
        completed: 0,
        avgProgress: 0
    };
    
    let totalProgress = 0;
    
    for (const plan of plans) {
        if (!plan.deletedAt) {
            if (plan.status === 'active') stats.active++;
            else if (plan.status === 'paused') stats.paused++;
            else if (plan.status === 'completed') stats.completed++;
            
            totalProgress += plan.progress || 0;
        }
    }
    
    if (stats.total > 0) {
        stats.avgProgress = Math.round(totalProgress / stats.total);
    }
    
    return stats;
}

// Печать плана
function printPlan(plan, patient) {
    const printWindow = window.open('', '_blank');
    
    let sectionsHtml = '';
    const sectionNames = {
        cleansing: 'Чистка',
        homeBlock: 'Блок дома',
        defense: 'Защита',
        closing: 'Закрытие',
        waterOil: 'Вода и масло',
        final: 'Финал',
        soulKnots: 'Духовные зажимы'
    };
    
    for (const [key, section] of Object.entries(plan.sections)) {
        if (section && section.length > 0) {
            sectionsHtml += `<div class="print-section">
                <h3>${sectionNames[key] || key}</h3>
                ${section.map(f => `
                    <div class="formula">
                        <p class="arabic">${f.arabic}</p>
                        <p class="russian">${f.russian}</p>
                        <p class="meta">Повторов: ${f.repetitions}</p>
                    </div>
                `).join('')}
            </div>`;
        }
    }
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>План лечения — ${patient.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
                h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                .patient-info { margin-bottom: 30px; }
                .print-section { margin-bottom: 30px; page-break-inside: avoid; }
                .print-section h3 { background: #f0f0f0; padding: 10px; margin-bottom: 15px; }
                .formula { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
                .arabic { font-size: 24px; direction: rtl; margin-bottom: 10px; font-family: "Traditional Arabic", serif; }
                .russian { font-size: 14px; color: #333; }
                .meta { font-size: 12px; color: #666; margin-top: 8px; }
            </style>
        </head>
        <body>
            <h1>План лечения рукьей</h1>
            <div class="patient-info">
                <p><strong>Пациент:</strong> ${patient.name}</p>
                <p><strong>Программа:</strong> ${plan.programName}</p>
                <p><strong>Длительность:</strong> ${plan.duration} дней</p>
                <p><strong>Дата начала:</strong> ${new Date(plan.startDate).toLocaleDateString('ru-RU')}</p>
            </div>
            ${sectionsHtml}
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

// Экспорт плана в JSON
function exportPlan(plan) {
    const dataStr = JSON.stringify(plan, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_${plan.id}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Поиск планов с фильтрами
async function searchPlans(filters = {}) {
    let plans = await RukyaStorage.getAll(RukyaStorage.STORES.PLANS);
    
    // Фильтрация удалённых
    plans = plans.filter(p => !p.deletedAt);
    
    if (filters.status) {
        plans = plans.filter(p => p.status === filters.status);
    }
    
    if (filters.patientId) {
        plans = plans.filter(p => p.patientId === filters.patientId);
    }
    
    return plans;
}

// Завершение плана
async function completePlan(planId) {
    const result = await updatePlanProgress(planId, 999);
    
    if (result.status === 'completed') {
        showToast('План завершён', 'success');
    }
    
    return result;
}

// Пауза/возобновление плана
async function togglePlanPause(planId) {
    const plan = await RukyaStorage.get(RukyaStorage.STORES.PLANS, planId);
    
    if (!plan) {
        throw new Error('План не найден');
    }
    
    const newStatus = plan.status === 'paused' ? 'active' : 'paused';
    
    await RukyaStorage.update(RukyaStorage.STORES.PLANS, {
        ...plan,
        status: newStatus,
        updatedAt: new Date().toISOString()
    });
    
    return newStatus;
}

// Экспорт
window.PlanBuilder = {
    createTreatmentPlan,
    updatePlanProgress,
    getPlansStats,
    printPlan,
    exportPlan,
    searchPlans,
    completePlan,
    togglePlanPause,
    calculateNextVisit
};
