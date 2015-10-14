import path from 'path';

const bsVersion = require('browser-sync/package.json').version;

const getSnippet = port => {
  return (
    '\n<!-- browsersync snippet -->' +
    '\n<script>' +
    `\ndocument.write('<script async src="http://' + location.hostname + ':${port}/browser-sync/browser-sync-client.${bsVersion}.js"><\\/script>');` +
    '\n</script>' +
    '\n<!-- end browsersync snippet -->\n'
  );
};

export default function (port) {
  return function exhibitBrowserSyncSnippet({file, contents}) {
    if (path.extname(file) !== '.html') return contents;

    // decide where to put the snippet (crude but fast)
    const html = contents.toString();
    let index = html.lastIndexOf('</body>');
    if (index === -1) index = html.lastIndexOf('</html>');
    if (index === -1) index = html.length;

    return (
      html.substring(0, index) +
      getSnippet(port) +
      html.substring(index)
    );
  };
}
