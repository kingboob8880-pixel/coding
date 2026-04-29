/**
 * RUKYA PRO - Treatment Planner v2.0
 * Intelligent treatment planning with adaptive dosing, prayer integration,
 * and dynamic schedule generation
 */

const TreatmentPlanner = {
    // Prayer times structure (will be calculated based on location)
    prayerTimes: {
        fajr: '05:30',
        dhuhr: '12:30',
        asr: '15:45',
        maghrib: '18:15',
        isha: '19:45'
    },

    // Treatment intensity levels based on severity
    intensityLevels: {
        1: { formulasPerDay: 3, repeatsMultiplier: 1, restDays: 0 },
        2: { formulasPerDay: 5, repeatsMultiplier: 1.5, restDays: 0 },
        3: { formulasPerDay: 7, repeatsMultiplier: 2, restDays: 1 },
        4: { formulasPerDay: 9, repeatsMultiplier: 2.5, restDays: 1 },
        5: { formulasPerDay: 11, repeatsMultiplier: 3, restDays: 2 }
    },

    /**
     * Generate intelligent treatment plan based on diagnosis
     */
    generatePlan(diagnosis, patientData, options = {}) {
        const { severity, primaryCondition, bodyMap, recommendations } = diagnosis;
        const { duration, detailLevel, includePrayerTimes, location } = options;

        // Get intensity settings based on severity
        const intensity = this.intensityLevels[severity] || this.intensityLevels[3];
        
        // Select appropriate program from library
        const program = this.selectProgram(primaryCondition, bodyMap);
        
        // Generate daily schedule
        const schedule = this.generateDailySchedule(program, intensity, duration, includePrayerTimes);
        
        // Add adaptive elements
        const adaptivePlan = this.addAdaptiveElements(schedule, patientData);
        
        // Include spiritual support measures
        const spiritualSupport = this.generateSpiritualSupport(recommendations);
        
        return {
            programName: program.name,
            duration: duration || 14,
            severity: severity,
            dailySchedule: schedule,
            spiritualSupport,
            adaptivePlan,
            warnings: recommendations.warnings || [],
            milestones: this.generateMilestones(duration),
            exportReady: true
        };
    },

    /**
     * Select best program from library based on condition
     */
    selectProgram(condition, bodyMap) {
        const programLibrary = {
            sihr_mahfi: {
                name: 'Разрушение скрытого сихра',
                focus: ['cleansing', 'protection', 'knots_breaking'],
                duration: 14,
                keyFormulas: ['ayat_kursi', 'falaq', 'nas', 'kahf_1-10']
            },
            sihr_tafriq: {
                name: 'Восстановление семейной гармонии',
                focus: ['love_restoration', 'hatred_removal', 'protection'],
                duration: 14,
                keyFormulas: ['rum_21', 'nur_31', 'fatiha', 'ikhlas']
            },
            sihr_mahabba: {
                name: 'Освобождение от навязчивой привязанности',
                focus: ['freedom', 'heart_cleansing', 'protection'],
                duration: 14,
                keyFormulas: ['kahf_1-10', 'falaq', 'nas', 'ayat_kursi']
            },
            massas_jinn: {
                name: 'Изгнание джинна',
                focus: ['expulsion', 'body_cleansing', 'fortification'],
                duration: 21,
                keyFormulas: ['baqarah', 'fatiha', 'kursi', 'jinn_surah']
            },
            ayn_hasida: {
                name: 'Снятие сглаза',
                focus: ['washing', 'cleansing', 'protection'],
                duration: 7,
                keyFormulas: ['falaq', 'nas', 'fatiha', 'ayat_water']
            },
            waswasa_dini: {
                name: 'Очищение от васвасы',
                focus: ['mind_cleansing', 'faith_strengthening', 'peace'],
                duration: 10,
                keyFormulas: ['alam_nashrah', 'fatiha', 'ayat_kursi']
            }
        };

        return programLibrary[condition.type] || programLibrary.sihr_mahfi;
    },

    /**
     * Generate daily schedule with prayer integration
     */
    generateDailySchedule(program, intensity, duration, includePrayerTimes = true) {
        const schedule = [];
        
        for (let day = 1; day <= duration; day++) {
            const dayPlan = {
                day,
                date: this.calculateDate(day),
                sessions: []
            };

            // Morning session (after Fajr)
            if (includePrayerTimes) {
                dayPlan.sessions.push({
                    time: this.prayerTimes.fajr,
                    type: 'morning',
                    formulas: this.selectFormulasForSession(program, 'morning', intensity),
                    adhkars: ['morning_adhkar'],
                    notes: 'Лучшее время для чтения после рассвета'
                });
            }

            // Midday session (after Dhuhr)
            if (intensity.formulasPerDay >= 5) {
                dayPlan.sessions.push({
                    time: this.prayerTimes.dhuhr,
                    type: 'midday',
                    formulas: this.selectFormulasForSession(program, 'midday', intensity),
                    adhkars: ['dhuhr_sunna'],
                    notes: 'Чтение после обязательной молитвы'
                });
            }

            // Afternoon session (after Asr)
            if (intensity.formulasPerDay >= 7) {
                dayPlan.sessions.push({
                    time: this.prayerTimes.asr,
                    type: 'afternoon',
                    formulas: this.selectFormulasForSession(program, 'afternoon', intensity),
                    adhkars: ['asr_sunna'],
                    notes: 'Время для дополнительной рукьи'
                });
            }

            // Evening session (after Maghrib)
            if (intensity.formulasPerDay >= 9) {
                dayPlan.sessions.push({
                    time: this.prayerTimes.maghrib,
                    type: 'evening',
                    formulas: this.selectFormulasForSession(program, 'evening', intensity),
                    adhkars: ['evening_adhkar'],
                    notes: 'Важное время для защиты'
                });
            }

            // Night session (after Isha)
            if (intensity.formulasPerDay >= 11) {
                dayPlan.sessions.push({
                    time: this.prayerTimes.isha,
                    type: 'night',
                    formulas: this.selectFormulasForSession(program, 'night', intensity),
                    adhkars: ['isha_sunna', 'sleep_adhkar'],
                    notes: 'Завершение дня с защитой'
                });
            }

            // Rest day logic
            const isRestDay = intensity.restDays > 0 && day % (intensity.restDays + 3) === 0;
            if (isRestDay) {
                dayPlan.isRestDay = true;
                dayPlan.notes = 'День отдыха для восстановления';
                dayPlan.sessions = dayPlan.sessions.map(session => ({
                    ...session,
                    formulas: session.formulas.slice(0, Math.ceil(session.formulas.length / 2))
                }));
            }

            schedule.push(dayPlan);
        }

        return schedule;
    },

    /**
     * Select formulas for specific session
     */
    selectFormulasForSession(program, sessionType, intensity) {
        const formulaPool = program.keyFormulas || [];
        const count = Math.ceil(intensity.formulasPerDay / 5);
        
        // Rotate formulas to avoid repetition
        const startIndex = (sessionType === 'morning') ? 0 : 
                          (sessionType === 'midday') ? 1 :
                          (sessionType === 'afternoon') ? 2 :
                          (sessionType === 'evening') ? 3 : 4;
        
        const selected = [];
        for (let i = 0; i < count; i++) {
            const index = (startIndex + i) % formulaPool.length;
            selected.push(formulaPool[index]);
        }
        
        return selected;
    },

    /**
     * Add adaptive elements based on patient response
     */
    addAdaptiveElements(schedule, patientData) {
        const adaptive = {
            adjustmentPoints: [],
            monitoringMetrics: [],
            escalationTriggers: [],
            deEscalationCriteria: []
        };

        // Set adjustment points every 3 days
        for (let i = 3; i < schedule.length; i += 3) {
            adaptive.adjustmentPoints.push({
                day: i,
                actions: ['assess_symptoms', 'adjust_intensity', 'review_progress']
            });
        }

        // Monitoring metrics based on condition
        adaptive.monitoringMetrics = [
            { name: 'Качество сна', frequency: 'daily', scale: '1-10' },
            { name: 'Уровень тревоги', frequency: 'daily', scale: '1-10' },
            { name: 'Физические симптомы', frequency: 'every_3_days', type: 'checklist' },
            { name: 'Духовное состояние', frequency: 'weekly', scale: '1-10' }
        ];

        // Escalation triggers (when to intensify)
        adaptive.escalationTriggers = [
            'Усиление симптомов после 5 дней',
            'Появление новых симптомов',
            'Отсутствие улучшений после 7 дней'
        ];

        // De-escalation criteria (when to reduce)
        adaptive.deEscalationCriteria = [
            'Стабильное улучшение в течение 5 дней',
            'Исчезновение основных симптомов',
            'Нормализация сна и аппетита'
        ];

        return adaptive;
    },

    /**
     * Generate spiritual support recommendations
     */
    generateSpiritualSupport(recommendations) {
        return {
            dailyAdhkar: {
                morning: ['Ayat al-Kursi', 'Al-Falaq', 'An-Nas', 'Al-Ikhlas (3x)'],
                evening: ['Ayat al-Kursi', 'Al-Falaq', 'An-Nas', 'Al-Ikhlas (3x)', 'Al-Mulk']
            },
            weeklyPractices: [
                'Чтение Суры Аль-Бакара раз в неделю',
                'Пост по понедельникам и четвергам (если возможно)',
                'Садака каждый день',
                'Истигفار 100 раз в день'
            ],
            lifestyleRecommendations: [
                'Избегать музыки и запрещенных изображений',
                'Поддерживать тахарат (очищение) постоянно',
                'Читать Коран перед сном',
                'Не находиться одному в темноте'
            ],
            dietaryAdvice: [
                'Употреблять финики натощак',
                'Пить воду, над которой читали Коран',
                'Избегать запрещенной пищи',
                'Умеренность в еде и питье'
            ]
        };
    },

    /**
     * Generate treatment milestones
     */
    generateMilestones(duration) {
        const milestones = [];
        const checkpointDays = [3, 7, 14, 21, 30];
        
        checkpointDays.forEach(day => {
            if (day <= duration) {
                milestones.push({
                    day,
                    expectedProgress: this.getExpectedProgress(day),
                    assessment: `Оценка эффективности на ${day} день`,
                    actions: this.getMilestoneActions(day)
                });
            }
        });
        
        return milestones;
    },

    getExpectedProgress(day) {
        if (day <= 3) return 'Первые признаки реакции, возможны обострения';
        if (day <= 7) return 'Начало улучшений, снижение острых симптомов';
        if (day <= 14) return 'Заметное улучшение, стабилизация состояния';
        if (day <= 21) return 'Значительное улучшение, закрепление результата';
        return 'Полное восстановление, профилактика рецидива';
    },

    getMilestoneActions(day) {
        const actions = {
            3: ['Оценить реакцию', 'Скорректировать дозировку при необходимости'],
            7: ['Промежуточная диагностика', 'Добавить поддерживающие формулы'],
            14: ['Полная оценка прогресса', 'Решение о продолжении или завершении'],
            21: ['Закрепление результатов', 'Переход на профилактический режим'],
            30: ['Финальная оценка', 'Выдача заключения', 'Рекомендации по профилактике']
        };
        return actions[day] || ['Мониторинг состояния'];
    },

    /**
     * Calculate date for future day
     */
    calculateDate(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Update prayer times based on location
     */
    updatePrayerTimes(location, customTimes) {
        if (customTimes) {
            this.prayerTimes = { ...this.prayerTimes, ...customTimes };
        }
        // Could integrate with prayer time API in future
    },

    /**
     * Generate printable schedule card
     */
    generateScheduleCard(plan) {
        return {
            title: `План лечения: ${plan.programName}`,
            duration: `${plan.duration} дней`,
            dailyRoutine: plan.dailySchedule.slice(0, 7), // First week preview
            keyMilestones: plan.milestones,
            emergencyContacts: ['При ухудшении обратиться к специалисту']
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreatmentPlanner;
}
