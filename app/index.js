/**
 * Main JS file for project.
 */

// /* global $ */

// Dependencies
import utils from './shared/utils.js';
import Content from '../templates/_index-content.svelte.html';

// Data
import index from '../assets/data/housing-index.json';
import metroTotals from '../assets/data/metro-totals.json';

// Mark page with note about development or staging
utils.environmentNoting();

// ...
$(document).ready(() => {
  // Hack to get share back
  let $share = $('.share-placeholder').size()
    ? $('.share-placeholder')
      .children()
      .detach()
    : undefined;
  let attachShare = !$share
    ? undefined
    : () => {
      $('.share-placeholder').append($share);
    };

  // Main component
  const app = new Content({
    target: document.querySelector('.article-lcd-body-content'),
    data: {
      index,
      metroTotals,
      attachShare
    }
  });
});
