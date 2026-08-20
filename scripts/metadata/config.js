/**
 * Metadata configuration for templates
 *
 * How to add a new template:
 * 1. Add entry to TEMPLATES object with unique fields and labels
 * 2. Define base metadata keys and language overrides
 * 3. Add UI labels for each field in all supported languages
 */

export const SUPPORTED_LANGUAGES = ['en'];

export const SHARED_FIELDS = {
  language: { base: 'language' },
};

export const SHARED_LABELS = {
  // Add shared labels here
};

/**
 * Template-specific configurations
 * Add new templates as needed
 */
export const TEMPLATES = {
  // Example: news-article template
  newsArticle: {
    fields: {
      title: { base: 'og:title' },
      author: { base: 'author' },
      date: { base: 'date' },
      category: { base: 'category' },
      links: { base: 'links' },
      image: { base: 'og:image' },
    },
    labels: {
      writtenBy: {
        en: 'Written by',
      },
      publishedOn: {
        en: 'Published on',
      },
      category: {
        en: 'Category',
      },
    },
  },

  // Example: article-with-sidebar template
  articleTemplate: {
    fields: {
      title: { base: 'og:title' },
      heroImage: { base: 'og:image' },
      description: { base: 'description' },
      sidebar: { base: 'sidebar-content' },
    },
    labels: {
      relatedContent: {
        en: 'Related Content',
      },
    },
  },

  // Add more templates as needed
};
