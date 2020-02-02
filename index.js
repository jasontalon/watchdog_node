require("dotenv").config();
const { log } = require("console"),
  axios = require("axios"),
  shortid = require("shortid"),
  moment = require("moment"),
  timeout = 2000,
  camera = process.argv[2];
const {
  DETECTOR_URL,
  CCTV_URL,
  CAPTURE_LIMIT = 10,
  GQL_URL,
  GQL_SECRET
} = process.env;

+(async function() {
  const group = shortid.generate();

  let CAPTURE_COUNT = 0,
    SAVE_COUNT = 1,
    nextRun = moment();

  while (CAPTURE_LIMIT > CAPTURE_COUNT) {
    if (nextRun <= moment()) {
      log(`${moment().format("LTS")} [${camera}] ${group} #${CAPTURE_COUNT}`);
      try {
        const base64Image = await getBase64Image(
          CCTV_URL.replace("{camera}", camera)
        );

        const results = await detect(base64Image);

        const persons = await findAllPersons(results);

        if (persons.length > 0) {
          save({ camera, group, sequence: SAVE_COUNT, base64Image, persons });
          SAVE_COUNT += 1;
        }
      } catch ({ message, stack }) {
        log({ message, stack });
      } finally {
        CAPTURE_COUNT += 1;
        nextRun = moment().add(1, "second");
      }
    }
  }
})();

async function save({ camera, group, sequence, base64Image, persons }) {
  const query = `mutation insert_log($log: [logs_insert_input!]!) { insert_logs(objects: $log) { affected_rows } } `,
    variables = {
      log: {
        camera,
        group,
        sequence,
        base64Image,
        predictions: JSON.stringify(persons)
      }
    },
    [header_key, header_value] = GQL_SECRET.split("=");

  const {
    data: { errors }
  } = await axios.post(
    GQL_URL,
    {
      query,
      variables,
      operationName: "insert_log"
    },
    { headers: { [header_key]: header_value }, timeout: 2500 },
    { timeout }
  );

  if (errors) log(errors, "ERROR");
}
async function detect(base64Image) {
  const { data } = await axios.post(
    DETECTOR_URL,
    { base64: base64Image },
    { timeout }
  );
  if (!data) return [];
  if (data.length == 0) return [];

  return data;
}
async function findAllPersons(data) {
  const persons = data.filter(p => p.class == "person");
  if (!persons) return [];
  if (persons.length == 0) return [];

  return persons;
}
async function getBase64Image(url) {
  const { data } = await axios.get(
    url,
    {
      responseType: "arraybuffer"
    },
    { timeout }
  );

  return Buffer.from(data, "binary").toString("base64");
}
