/**
 * Provides an alternative syntax to autoload plugins, looks more ES6.
 *
 *   import $ from 'exhibit/plugins';
 *
 * or even:
 *
 *   import {sass, browserify} from 'exhibit/plugins';
 */

module.exports = require('./index').plugins();
