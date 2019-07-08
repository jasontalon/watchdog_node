const express = require("express"),
  app = express(),
  port = 3000,
  http = require("http"),
  server = http.createServer(app),
  io = require("socket.io").listen(server),
  ai = require("./objectdetection"),
  bodyParser = require("body-parser"),
  _ = require("lodash"),
  moment = require("moment"),
  { createCanvas } = require("canvas"),
  Sequelize = require("sequelize");

const saveToDb = async row => {
  const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "C:\\detector\\api\\data\\watchdog.db",
      logging: false
    }),
    sql = `INSERT INTO log(camera,date,predictions,base64image) 
  SELECT :camera, :date, :predictions, :base64Image
  WHERE NOT EXISTS(SELECT 1 FROM log WHERE camera = :camera AND date = :date);
  `;

  await sequelize.query(sql, {
    replacements: row,
    type: sequelize.QueryTypes.INSERT
  });
};

const getLog = async (from, until, camera) => {
  const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "C:\\detector\\api\\data\\watchdog.db",
      logging: false
    }),
    sql = `SELECT camera, date, predictions from log where date between :from and :until 
    ${camera ? " AND camera = :camera " : ""}
    ORDER BY date ASC `;

  return await sequelize.query(sql, {
    replacements: { from, until, camera },
    type: sequelize.QueryTypes.SELECT
  });
};

const getBase64Img = async (camera, date) => {
  const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "C:\\detector\\api\\data\\watchdog.db",
      logging: false
    }),
    sql = `SELECT base64image from log where camera = :camera AND date = :date`;

  return await sequelize.query(sql, {
    replacements: { camera, date },
    type: sequelize.QueryTypes.SELECT
  });
};

(async () => {
  const model = await ai.initModel("mobilenet_v2"); //use mobilenet_v2 for prod.
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  app.use(bodyParser.json());
  app.use(
    express.urlencoded({
      extended: true
    })
  );

  app.get("/watchdog", (req, res) => res.sendFile(__dirname + "/index.html"));
  app.get("/watchlog", (req, res) => res.sendFile(__dirname + "/log.html"));
  app.get("/img", (req, res) => res.sendFile(__dirname + "/img.html"));

  app.get("/api/log", async (req, res) => {
    console.log(req.query);
    const { from, until, camera } = req.query;
    try {
      res.json(await getLog(from, until, camera));
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.get("/api/image", async (req, res) => {
    const { camera, date } = req.query;
    try {
      var results = await getBase64Img(camera, date);

      res.json({
        base64image: results.length > 0 ? results[0].base64image : ""
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err });
    }
  });

  app.post("/detect", async (req, res) => {
    console.log({ requested_on: moment().format(), request: req.body });

    let cameraUrl = `http://192.168.1.78:81/image/${
      req.body.camera
    }?user=admin&pw=admin&q=100`;

    try {
      let { canvas, image } = await ai.makeCanvas(cameraUrl),
        predictions = await ai.predict(model, canvas);
      predictions = _.filter(predictions, p =>
        req.body.classes.includes(p.class)
      );

      const response = { date: moment().format(), predictions };

      if (predictions.length > 0) {
        await saveToDb({
          camera: req.body.camera,
          date: response.date,
          predictions: JSON.stringify(predictions),
          base64Image: makeBase64Image(image, predictions)
        });
      }

      res.send(response);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  var clients = [];
  io.on("connection", function(socket) {
    clients.push(socket.id);
    socket.on("on predictions", function(msg) {
      socket.broadcast.emit("display predictions", msg);
    });
  });
  server.listen(port, () =>
    console.log(`Express api listening on port ${port}!`)
  );
})();

const makeBase64Image = (image, predictions) => {
  const half = 0.5;
  let smallCanvas = createCanvas(image.width * half, image.height * half),
    smallContext = smallCanvas.getContext("2d");

  smallContext.drawImage(image, 0, 0, image.width * half, image.height * half);

  if (predictions.length > 0) {
    smallContext.strokeStyle = "#ff0000";
    smallContext.lineWidth = 2;
    smallContext.fillStyle = "#ffffff";
    predictions.forEach(row => {
      smallContext.strokeRect(
        row.bbox[0] * half,
        row.bbox[1] * half,
        row.bbox[2] * half,
        row.bbox[3] * half
      );
      smallContext.fillText(row.class, row.bbox[0] * half, row.bbox[1] * half);
    });
  }

  return smallCanvas.toDataURL("image/jpeg", half);
};
