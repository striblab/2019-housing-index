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

// Intialize google analytics
function initializeGa() {
  window.dataLayer = window.dataLayer || [];
  window.gaId = 'UA-114906116-1';

  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', window.gaId);
  return window.gtag;
}
initializeGa();

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
