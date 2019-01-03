/**
 * Main JS file for project.
 */

// /* global _ */

// Dependencies
import utils from './shared/utils.js';
import Content from '../templates/_index-content.svelte.html';

// Data
import index from '../assets/data/housing-index.json';

// Mark page with note about development or staging
utils.environmentNoting();

// Main component
const app = new Content({
  target: document.querySelector('.article-lcd-body-content'),
  data: {
    index
  }
});
