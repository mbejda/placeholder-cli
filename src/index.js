const {Command, flags} = require('@oclif/command');
const PImage = require('pureimage');
const sizeOf = require('image-size');
const glob = require('glob');
const fs = require('fs');
const {cli} = require('cli-ux');
const Listr = require('listr');
const chalk = require('chalk');
const path = require('path');

class PlaceholderCommand extends Command {
  async getFiles(globPath, options) {
    const files = await glob.sync(globPath, options);
    return files
  }

  async run() {
    const {flags, args} = this.parse(PlaceholderCommand);
    const globPath = args.path;
    const fontSize = flags.fontSize || 100;
    const fontColor = flags.fontColor || '#969696';
    const bgColor = flags.bgColor || '#CCCCCC';

    const fontInfo = {
      path: path.resolve(__dirname, 'font/SourceSansPro-Bold.ttf'),
      name: 'Source Sans Pro',
    };
    const options = {
      ignore: ['**/node_modules/**', './node_modules/**'],
    };
    const files = await this.getFiles(globPath, options);

    if (!files || files.length === 0) {
      return this.log(`No images found : ${globPath}`)
    }

    const table = files.map(files => {
      return {files}
    });

    cli.table(table, {
      files: {
        minWidth: 7,
      },
    });

    const confirm = `Do you want me to replace those ${chalk.greenBright(files.length)} images with placeholders? y|n`;

    const prompt = await cli.confirm(confirm);

    if (prompt === false) {
      this.warn('Placeholder cancelled')
    }

    const fnt = PImage.registerFont(fontInfo.path, fontInfo.name);

    cli.action.start('Starting');
    fnt.load(async () => {
      const tasks = new Listr(
        files.map(file => {
          return {
            title: file,
            task: async () => {
              try {
                const size = sizeOf(file);
                // Create Blank Image
                const img = PImage.make(size.width, size.height);
                // Image Text
                const text = `${size.width} x ${size.height}`;
                const ctx = img.getContext('2d');
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, size.width, size.height);
                ctx.fillStyle = fontColor
                ctx.font = `${fontSize} '${fontInfo.name}'`;
                ctx.textBaseline = 'middle';
                const textSize = ctx.measureText(text);
                ctx.fillText(text, (size.width / 2 - textSize.width / 2), size.height / 2);
                await PImage.encodePNGToStream(img, fs.createWriteStream(file));
                Promise.resolve(true);
                return
              } catch (error) {
                return Promise.reject(error)
              }
            },
          }
        })
      );

      try {
        await tasks.run();
        cli.action.stop()
      } catch (error) {
        this.error(error);
        cli.action.stop()
      }
    })
  }
}

PlaceholderCommand.description = `Replace images with placeholders.
...
placeholder ./**/*.jpeg
`;

PlaceholderCommand.flags = {
  // add --version flag to show CLI version
  help: flags.help({char: 'h'}),
  fontColor: flags.string({char: 'fc', description: 'font color'}),
  bgColor: flags.string({char: 'bg', description: 'background color'}),
  fontSize: flags.string({char: 'fs', description: 'font size'}),
};

PlaceholderCommand.args = [
  {
    name: 'path',
    required: true,
    description: '"./**/*.{jpg, jpeg, png}"',
  },
];

module.exports = PlaceholderCommand;
