/**
 * Metadata API - Functions to access metadata configuration
 */

import {
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
 * @returns {string|null} Metadata key or null
 */
export function getMetadataKey(fieldName, templateType) {
  const config = getTemplateConfig(templateType);
  const field = config?.fields?.[fieldName];
  if (!field) return null;

  return field.base;
}

/**
 * Get all metadata keys for a template
 * @param {string} templateType Template type
 * @returns {object} All field mappings
 */
export function getTemplateMetadataMap(templateType) {
  if (metadataMapCache.has(templateType)) {
    return metadataMapCache.get(templateType);
  }

  const config = getTemplateConfig(templateType);
  const fields = config?.fields || {};
  const result = {};

  Object.keys(fields).forEach((fieldName) => {
    result[fieldName] = getMetadataKey(fieldName, templateType);
  });

  metadataMapCache.set(templateType, result);
  return result;
}

/**
 * Get UI label
 * @param {string} labelKey Label key
 * @param {string} templateType Template type
 * @returns {string} UI label or key if not found
 */
export function getUILabel(labelKey, templateType) {
  const config = getTemplateConfig(templateType);
  const label = config?.labels?.[labelKey];

  return label || labelKey;
}

/**
 * Check if template exists
 * @param {string} templateType Template type
 * @returns {boolean} True if exists
 */
export function hasTemplateType(templateType) {
  return !!TEMPLATES[templateType];
}
