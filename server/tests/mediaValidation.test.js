const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load only the signature validators with no database or external dependencies.
const filename = path.join(__dirname, '..', 'utils', 'helpers.js');
const source = fs.readFileSync(filename, 'utf8');
const segment = source.slice(source.indexOf('exports.isValidImageFile ='), source.indexOf('exports.isExtAllowed ='));
const validators = {};
vm.runInNewContext('(function(exports) {' + segment + '})', { Buffer })(validators);
const file = data => ({ data: Buffer.from(data) });

test('JPEG and WebP are not mislabeled as PNG', () => {
    const jpg = file([0xff, 0xd8, 0xff, 0x01]);
    assert.equal(validators.isValidMediaFile(jpg, '.jpg'), true);
    assert.equal(validators.isValidMediaFile(jpg, '.png'), false);
    const png = file([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(validators.isValidMediaFile(png, '.png'), true);
});

test('recorded WebM and MP4 data require matching extensions', () => {
    const webm = file([0x1a, 0x45, 0xdf, 0xa3, 0x42, 0x86]);
    assert.equal(validators.isValidMediaFile(webm, '.webm'), true);
    assert.equal(validators.isValidMediaFile(webm, '.mp4'), false);
    const mp4 = file([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    assert.equal(validators.isValidMediaFile(mp4, '.mp4'), true);
    assert.equal(validators.isValidMediaFile(mp4, '.m4a'), true);
});
