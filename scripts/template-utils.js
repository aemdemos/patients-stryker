/**
 * Template Utilities - Helper functions for template-specific decoration
 */

import { getMetadata } from './aem.js';
import {
  getMetadataKey, getTemplateMetadataMap, getUILabel,
} from './metadata/api.js';

/**
 * Get localized metadata value for a field
 * @param {string} fieldName Field name
 * @param {string} templateType Template type
 * @param {Document} doc Document object (optional)
 * @returns {string} Metadata value or empty string
 */
export function getLocalizedMetadata(fieldName, templateType, doc = document) {
  const language = getMetadata('language', doc) || 'en';
  const metadataKey = getMetadataKey(fieldName, templateType, language);

  if (!metadataKey) {
    return getMetadata(fieldName, doc);
  }

  return getMetadata(metadataKey, doc);
}

/**
 * Get multiple localized metadata values
 * @param {string[]} fieldNames Array of field names
 * @param {string} templateType Template type
 * @param {Document} doc Document object (optional)
 * @returns {object} Object with field names and values
 */
export function getLocalizedMetadataMultiple(fieldNames, templateType, doc = document) {
  const result = {};
  fieldNames.forEach((fieldName) => {
    result[fieldName] = getLocalizedMetadata(fieldName, templateType, doc);
  });
  return result;
}

/**
 * Get all metadata for a template
 * @param {string} templateType Template type
 * @param {Document} doc Document object (optional)
 * @returns {object} All field names and values
 */
export function getAllLocalizedMetadata(templateType, doc = document) {
  const language = getMetadata('language', doc) || 'en';
  const metadataMap = getTemplateMetadataMap(templateType, language);

  const result = {};
  Object.keys(metadataMap).forEach((fieldName) => {
    result[fieldName] = getLocalizedMetadata(fieldName, templateType, doc);
  });

  return result;
}

/**
 * Get localized UI label
 * @param {string} labelKey Label key
 * @param {string} templateType Template type
 * @param {Document} doc Document object (optional)
 * @returns {string} Localized UI label
 */
export function getLocalizedUILabel(labelKey, templateType, doc = document) {
  const language = getMetadata('language', doc) || 'en';
  return getUILabel(labelKey, templateType, language);
}
