const fs = require('fs');
const path = require('path');
require('dotenv').config();

const scriptId = process.env.MOMENTUM_TRACKER_SCRIPT_ID;

const data = {
  _comment:
    'DO NOT MODIFY DIRECTLY. This file was generated by generate-clasp-config script.',
  scriptId,
  rootDir: path.resolve(__dirname, 'build'),
};

fs.writeFile('.clasp.json', JSON.stringify(data, null, 2), (err) => {
  if (err) throw err;
  console.log('.clasp.json file generated');
});
