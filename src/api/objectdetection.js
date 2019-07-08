const tf = require("@tensorflow/tfjs-node-gpu"),
  cocoSsd = require("@tensorflow-models/coco-ssd"),
  { createCanvas, loadImage } = require("canvas");

module.exports = {
  initModel: async base => {
    if (!base) base = "lite_mobilenet_v2";
    console.log(`loading ${base}`);
    return await cocoSsd.load(base);
  },

  makeCanvas: async imageUrl => {
    let image = await Promise.race([
        loadImage(imageUrl),
        new Promise((res, rej) => {
          setTimeout(() => rej(new Error("fetching image timeout")), 1800);
        })
      ]),
      canvas = createCanvas(image.width, image.height),
      context = canvas.getContext("2d");

    context.drawImage(image, 0, 0, image.width, image.height);

    return { canvas, image };
  },

  predict: async (model, canvas) => {
    if (!model) throw "please initialize MODEL first";
    if (!canvas) throw "please initialize CANVAS first";

    const predictions = await model.detect(canvas);

    return predictions;
  }
};
