const Sequelize = require("sequelize");

const deleteLog = async row => {
  const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "C:\\detector\\api\\data\\watchdog.db",
      logging: true
    }),
    sql = `DELETE FROM log; VACUUM;`;

  await sequelize.query(sql, {
    replacements: row,
    type: sequelize.QueryTypes.DELETE
  });
};

deleteLog();