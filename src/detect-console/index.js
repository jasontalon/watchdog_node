const axios = require("axios"),
  moment = require("moment"),
  argv = require("yargs").argv,
  _ = require("lodash"),
  io = require("socket.io-client");

const url = "http://localhost:3000/detect",
 socket = io("http://localhost:3000/");

let objects_detected = [],
  lastDetect = moment(),
  lastNotify = moment();

const main = async () => {
  console.log(argv);
  const timeShouldStop = moment()
    .add(parseInt(argv.duration), "seconds")
    .format();

  const doDetect = setInterval(async () => {
    try {
      if (timeShouldStop <= moment().format()) {
        clearInterval(doDetect);
        process.exit();
      } else {
        const result = await axios.post(url, {
          camera: argv.camera,
          classes: argv.classes.split(",")
        });
        if (result.data.predictions.length > 0) {
          const durationFromLastDetection = moment().diff(
            lastDetect,
            "milliseconds"
          );

          const durationFromLastNotification = moment().diff(
            lastNotify,
            "milliseconds"
          );

          if (durationFromLastNotification > 2000) {
            lastNotify = moment();
            socket.emit("on predictions", {
              camera: argv.camera,
              results: result.data
            });
          }

          lastDetect = moment();

          objects_detected.push(
            _.map(result.data.predictions, r => {
              return {
                class: r.class,
                date: result.data.date
              };
            })
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 1000);
};

main();
