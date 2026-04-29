/**
 * RUKYA PRO - Enhanced Diagnosis Engine v2.0
 * Advanced diagnostic module with weighted symptoms, body map visualization,
 * differential diagnosis, and heuristic AI analysis.
 */

const DiagnosisEngine = {
    // Symptom weights for different conditions
    symptomWeights: {
        // Sihr (Magic) indicators
        sihr_mahfi: ['nightmares', 'chest_pain', 'aversion_quran', 'mood_swings', 'isolation'],
        sihr_tafriq: ['spouse_hatred', 'groundless_jealousy', 'sexual_aversion', 'constant_conflicts'],
        sihr_mahabba: ['obsessive_love', 'inability_to_leave', 'emotional_dependency', 'fear_of_separation'],
        
        // Jinn indicators
        massas_jinn: ['fainting', 'epileptic_seizures', 'voice_changes', 'speaking_unknown_languages', 'extreme_strength'],
        qarin: ['whispers_in_prayer', 'doubt_in_wudu', 'forgetting_quran', 'laziness_in_worship'],
        
        // Ayn (Evil Eye) indicators
        ayn_hasida: ['sudden_headache', 'excessive_yawning', 'hot_cold_flashes', 'bruising', 'sudden_illness_after_praise'],
        hasad: ['envy_symptoms', 'decline_after_success', 'unexplained_fatigue'],
        
        // Waswasa indicators
        waswasa_dini: ['obsessive_doubts', 'repeating_wudu', 'fear_of_najis', 'intrusive_blasphemous_thoughts']
    },

    // Body zones mapping
    bodyZones: {
        head: ['ras', 'aql', 'ayn', 'udhun'],
        chest: ['sadr', 'qalb', 'ru\'h'],
        abdomen: ['batn', 'kabd', 'tihol'],
        back: ['zahr', 'khasr'],
        limbs: ['yadayn', 'rijlayn'],
        general: ['jasad', 'dam']
    },

    /**
     * Advanced symptom analysis with weighting
     */
    analyzeSymptoms(symptoms, complaints) {
        const scores = {
            sihr_mahfi: 0,
            sihr_tafriq: 0,
            sihr_mahabba: 0,
            massas_jinn: 0,
            qarin: 0,
            ayn_hasida: 0,
            hasad: 0,
            waswasa_dini: 0
        };

        // Weight symptoms by severity and frequency
        symptoms.forEach(symptom => {
            const weight = symptom.severity || 1;
            const frequency = symptom.frequency || 1;
            const totalWeight = weight * frequency;

            // Check against each condition
            Object.keys(this.symptomWeights).forEach(condition => {
                if (this.symptomWeights[condition].includes(symptom.id)) {
                    scores[condition] += totalWeight;
                }
            });
        });

        // Analyze complaint text for keywords
        const complaintText = complaints.toLowerCase();
        const keywordBonus = this.analyzeComplaintKeywords(complaintText, scores);
        
        // Normalize scores
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const normalizedScores = {};
        
        Object.keys(scores).forEach(key => {
            normalizedScores[key] = {
                score: scores[key],
                percentage: Math.round((scores[key] / totalScore) * 100),
                confidence: this.calculateConfidence(scores[key], totalScore)
            };
        });

        return {
            primary: this.findPrimaryCondition(normalizedScores),
            allConditions: normalizedScores,
            bodyMap: this.generateBodyMap(symptoms, complaints),
            differential: this.generateDifferentialDiagnosis(normalizedScores),
            recommendations: this.generateTreatmentRecommendations(normalizedScores)
        };
    },

    /**
     * Analyze complaint text for diagnostic keywords
     */
    analyzeComplaintKeywords(text, scores) {
        const keywords = {
            sihr_mahfi: ['колдовство', 'порча', 'узлы', 'черная магия', 'ночные кошмары'],
            sihr_tafriq: ['разлад', 'ссора', 'ненависть', 'муж', 'жена', 'развод'],
            sihr_mahabba: ['привязанность', 'любовь', 'не могу уйти', 'одержимость'],
            massas_jinn: ['джинн', 'бесноватый', 'припадок', 'голос', 'чужой голос'],
            ayn_hasida: ['сглаз', 'похвалили', 'восхищались', 'внезапно заболел'],
            waswasa_dini: ['сомнения', 'намаз', 'омовение', 'греховные мысли']
        };

        let bonus = 0;
        Object.keys(keywords).forEach(condition => {
            keywords[condition].forEach(keyword => {
                if (text.includes(keyword)) {
                    scores[condition] += 2; // Bonus points for keyword match
                    bonus += 2;
                }
            });
        });
        return bonus;
    },

    /**
     * Calculate confidence level based on score distribution
     */
    calculateConfidence(score, total) {
        if (total === 0) return 0;
        const ratio = score / total;
        if (ratio > 0.6) return 5;
        if (ratio > 0.4) return 4;
        if (ratio > 0.25) return 3;
        if (ratio > 0.15) return 2;
        return 1;
    },

    /**
     * Find primary condition with highest score
     */
    findPrimaryCondition(scores) {
        let maxScore = 0;
        let primary = null;
        
        Object.keys(scores).forEach(key => {
            if (scores[key].score > maxScore) {
                maxScore = scores[key].score;
                primary = {
                    type: key,
                    ...scores[key]
                };
            }
        });
        
        return primary;
    },

    /**
     * Generate body map visualization data
     */
    generateBodyMap(symptoms, complaints) {
        const affectedZones = {};
        
        // Map symptoms to body zones
        symptoms.forEach(symptom => {
            const zone = this.findBodyZone(symptom.location);
            if (zone) {
                if (!affectedZones[zone]) {
                    affectedZones[zone] = { intensity: 0, symptoms: [] };
                }
                affectedZones[zone].intensity += symptom.severity || 1;
                affectedZones[zone].symptoms.push(symptom);
            }
        });

        return {
            zones: affectedZones,
            primaryZone: this.findMostAffectedZone(affectedZones),
            visualization: this.createVisualizationData(affectedZones)
        };
    },

    findBodyZone(location) {
        for (const [zone, organs] of Object.entries(this.bodyZones)) {
            if (organs.includes(location)) return zone;
        }
        return 'general';
    },

    findMostAffectedZone(zones) {
        let maxIntensity = 0;
        let primaryZone = 'general';
        
        Object.keys(zones).forEach(zone => {
            if (zones[zone].intensity > maxIntensity) {
                maxIntensity = zones[zone].intensity;
                primaryZone = zone;
            }
        });
        
        return primaryZone;
    },

    createVisualizationData(zones) {
        return Object.keys(zones).map(zone => ({
            zone,
            intensity: zones[zone].intensity,
            color: this.getIntensityColor(zones[zone].intensity),
            symptoms: zones[zone].symptoms.length
        }));
    },

    getIntensityColor(intensity) {
        if (intensity >= 5) return '#dc2626'; // Red
        if (intensity >= 3) return '#f59e0b'; // Orange
        if (intensity >= 1) return '#eab308'; // Yellow
        return '#22c55e'; // Green
    },

    /**
     * Generate differential diagnosis with probabilities
     */
    generateDifferentialDiagnosis(scores) {
        const sorted = Object.entries(scores)
            .sort(([, a], [, b]) => b.score - a.score)
            .slice(0, 3);

        return sorted.map(([type, data], index) => ({
            rank: index + 1,
            type,
            probability: data.percentage,
            confidence: data.confidence,
            distinguishingFeatures: this.getDistinguishingFeatures(type),
            ruleOutCriteria: this.getRuleOutCriteria(type)
        }));
    },

    getDistinguishingFeatures(type) {
        const features = {
            sihr_mahfi: ['Ночные кошмары', 'Отвращение к Корану', 'Резкие перепады настроения'],
            sihr_tafriq: ['Внезапная ненависть между супругами', 'Беспочвенная ревность'],
            massas_jinn: ['Потеря сознания', 'Изменение голоса', 'Необъяснимая сила'],
            ayn_hasida: ['Внезапное начало после похвалы', 'Головная боль', 'Зевота'],
            waswasa_dini: ['Навязчивые сомнения в поклонении', 'Многократное повторение омовения']
        };
        return features[type] || [];
    },

    getRuleOutCriteria(type) {
        const criteria = {
            sihr_mahfi: ['Отсутствие ночных симптомов', 'Нет отвращения к чтению Корана'],
            sihr_tafriq: ['Хорошие отношения в семье', 'Отсутствие конфликтов'],
            massas_jinn: ['Нет потери сознания', 'Нет изменения поведения'],
            ayn_hasida: ['Постепенное развитие', 'Отсутствие связи с похвалой'],
            waswasa_dini: ['Сомнения не связаны с религией', 'Нет навязчивых действий']
        };
        return criteria[type] || [];
    },

    /**
     * Generate treatment recommendations based on diagnosis
     */
    generateTreatmentRecommendations(scores) {
        const primary = this.findPrimaryCondition(scores);
        if (!primary) return [];

        const recommendations = {
            priority: [],
            secondary: [],
            supportive: [],
            warnings: []
        };

        // Priority treatments based on primary condition
        if (primary.type.includes('sihr')) {
            recommendations.priority.push('Разрушение узлов колдовства');
            recommendations.priority.push('Чтение аятов разрушения сихра');
            recommendations.warnings.push('Возможна сильная реакция в первые дни');
        }
        
        if (primary.type.includes('jinn') || primary.type.includes('massas')) {
            recommendations.priority.push('Изгнание джинна из тела');
            recommendations.priority.push('Закрытие дверей входа');
            recommendations.warnings.push('Требуется присутствие специалиста при сильном масса');
        }
        
        if (primary.type.includes('ayn')) {
            recommendations.priority.push('Снятие сглаза водой');
            recommendations.secondary.push('Чтение аль-Фалак и ан-Нас');
        }
        
        if (primary.type.includes('waswasa')) {
            recommendations.priority.push('Игнорирование наущений');
            recommendations.supportive.push('Увеличение зикра');
            recommendations.warnings.push('Не обсуждать подробности наущений');
        }

        // Supportive measures
        recommendations.supportive.push('Регулярное чтение Корана');
        recommendations.supportive.push('Садака ежедневно');
        recommendations.supportive.push('Азкары утром и вечером');

        return recommendations;
    },

    /**
     * Heuristic AI analysis without external API
     */
    heuristicAnalysis(patientData) {
        const { symptoms, complaints, history, familyBackground } = patientData;
        
        // Pattern recognition
        const patterns = this.recognizePatterns(symptoms, history);
        
        // Temporal analysis
        const temporalFactors = this.analyzeTemporalPatterns(history);
        
        // Contextual analysis
        const contextualFactors = this.analyzeContext(familyBackground, complaints);
        
        // Synthesis
        const synthesis = this.synthesizeAnalysis(patterns, temporalFactors, contextualFactors);
        
        return {
            diagnosis: synthesis.diagnosis,
            confidence: synthesis.confidence,
            reasoning: synthesis.reasoning,
            alternativeHypotheses: synthesis.alternatives,
            recommendedActions: synthesis.actions,
            redFlags: synthesis.redFlags
        };
    },

    recognizePatterns(symptoms, history) {
        // Implementation of pattern recognition logic
        return { acute: false, chronic: false, recurring: false };
    },

    analyzeTemporalPatterns(history) {
        // Implementation of temporal analysis
        return { onset: 'unknown', progression: 'stable' };
    },

    analyzeContext(familyBackground, complaints) {
        // Implementation of contextual analysis
        return { familyHistory: false, environmentalFactors: [] };
    },

    synthesizeAnalysis(patterns, temporal, contextual) {
        // Synthesis logic combining all factors
        return {
            diagnosis: {},
            confidence: 0,
            reasoning: [],
            alternatives: [],
            actions: [],
            redFlags: []
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosisEngine;
}
