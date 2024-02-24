const fs = require('fs');

const data = {
  timeZone: 'Europe/Berlin',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
};

const BUILD_DIR = 'build';

const path = `${BUILD_DIR}/appsscript.json`;

if (!fs.existsSync(path)) {
  fs.writeFile(path, JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
    console.log('appsscript.json has been saved!');
  });
} else {
  console.log(
    'appsscript.json already exists. If you want to recreate this file, remove appscript.json from the build folder.'
  );
}
