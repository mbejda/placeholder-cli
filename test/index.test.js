const {expect, test} = require('@oclif/test');
const {cli} = require('cli-ux');
const fs = require('fs');

const imageHash = require('node-image-hash');

const cmd = require('..');

const mockImage = './test/images/mock/cat.jpg';
const testImage = './test/images/test/cat.jpg';

describe('No jpegs images exist', async () => {
  test
  .stdout({print: true})
  .do(() => cmd.run(['test/images/mock/**.jpeg']))
  .it('runs test/images/mock/**.jpeg', ctx => {
    expect(ctx.stdout).to.contain('No images found : test/images/mock/**.jpeg')
  })
});

describe('Image should be modified',_ => {
  try {
    fs.unlinkSync(mockImage)
  } catch (err) {
    console.error(err)
  }

  try {
    fs.copyFileSync(testImage, mockImage)
  } catch (error) {
    console.error(error)
  }

  let oldSignature;

  test
  .stub(cli, 'confirm', () => async () => 'y')
  .stdout()
  .hook('init')
  .do(async () => {
    oldSignature = await imageHash.hash(mockImage, 8, 'hex');
    cmd.run(['test/images/mock/*.jpg'])
  })
  .it('runs test/images/mock/*.jpg', async ctx => {
    const newSignature = await imageHash.hash(mockImage, 8, 'hex');
    fs.unlinkSync(mockImage)
    expect(newSignature.hash).not.equal(oldSignature.hash)
  })
});
