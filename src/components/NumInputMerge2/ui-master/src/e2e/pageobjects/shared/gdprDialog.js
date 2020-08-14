/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  cookieDlgContainer: {
    selector: 'div.truste_box_overlay',
    locateStrategy: 'css selector'
  },

  cookieFrame: {
    selector: 'div.truste_box_overlay_inner > iframe',
    locateStrategy: 'css selector'
  },

  cookieAcceptBtn: {
    selector: 'a.call',
    locateStrategy: 'css selector'
  },
};
