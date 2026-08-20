/**
 * Metadata API - Functions to access metadata configuration
 */

import {
  SUPPORTED_LANGUAGES,
  SHARED_FIELDS,
  SHARED_LABELS,
  TEMPLATES,
} from './config.js';

/**
 * Get template configuration
 * @param {string} templateType Template type (e.g., 'newsArticle')
 * @returns {object|null} Template config or null
 */
function getTemplateConfig(templateType) {
  const template = TEMPLATES[templateType];
  if (!template) return null;

  return {
    fields: { ...SHARED_FIELDS, ...template.fields },
    labels: { ...SHARED_LABELS, ...template.labels },
  };
}

const metadataMapCache = new Map();

/**
 * Get metadata key for a field
 * @param {string} fieldName Field name
 * @param {string} templateType Template type
 * @param {string} language Language code
 * @returns {string|null} Metadata key or null
 */
export function getMetadataKey(fieldName, templateType, language) {
  const config = getTemplateConfig(templateType);
  const field = config?.fields?.[fieldName];
  if (!field) return null;

  return field.overrides?.[language] || field.base;
}

/**
 * Get all metadata keys for a template
 * @param {string} templateType Template type
 * @param {string} language Language code
 * @returns {object} All field mappings
 */
export function getTemplateMetadataMap(templateType, language) {
  const cacheKey = `${templateType}:${language}`;

  if (metadataMapCache.has(cacheKey)) {
    return metadataMapCache.get(cacheKey);
  }

  const config = getTemplateConfig(templateType);
  const fields = config?.fields || {};
  const result = {};

  Object.keys(fields).forEach((fieldName) => {
    result[fieldName] = getMetadataKey(fieldName, templateType, language);
  });

  metadataMapCache.set(cacheKey, result);
  return result;
}

/**
 * Get UI label with fallback to English
 * @param {string} labelKey Label key
 * @param {string} templateType Template type
 * @param {string} language Language code
 * @returns {string} UI label or key if not found
 */
export function getUILabel(labelKey, templateType, language) {
  const config = getTemplateConfig(templateType);
  const label = config?.labels?.[labelKey]?.[language];

  if (!label) {
    const fallback = config?.labels?.[labelKey]?.en;
    if (fallback && language !== 'en' && typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      window.console.warn(`Missing ${language} translation for ${templateType}.${labelKey}, using English`);
    }
    return fallback || labelKey;
  }

  return label;
}

/**
 * Check if template exists
 * @param {string} templateType Template type
 * @returns {boolean} True if exists
 */
export function hasTemplateType(templateType) {
  return !!TEMPLATES[templateType];
}

/**
 * Get supported languages
 * @returns {string[]} Language codes
 */
export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}
