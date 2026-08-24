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

/**
 * Move attributes from one element to another
 * @param {Element} from Source element
 * @param {Element} to Target element
 * @param {string[]} attributes Optional list of attributes to move
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes (data-aue-*, data-richtext-*)
 * @param {Element} from Source element
 * @param {Element} to Target element
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}
