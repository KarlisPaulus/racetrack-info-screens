const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false, // Disable logging
});

// Define Race model
const Race = sequelize.define('Race', {
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Define Driver model
const Driver = sequelize.define('Driver', {
  name: { type: DataTypes.STRING, allowNull: false },
  carAssigned: { type: DataTypes.STRING, allowNull: false },
  RaceId: { type: DataTypes.INTEGER, allowNull: false },
});

// Define LapTime model
const LapTime = sequelize.define('LapTime', {
  lapTime: { type: DataTypes.FLOAT, allowNull: false },
  formattedLap: { type: DataTypes.STRING },
  bestLap: { type: DataTypes.FLOAT },
  formattedBest: { type: DataTypes.STRING },
  lapCount: { type: DataTypes.INTEGER },
});

// Define RaceStatus model
const RaceStatus = sequelize.define('RaceStatus', {
  running: { type: DataTypes.BOOLEAN, defaultValue: false },
  mode: { type: DataTypes.STRING, defaultValue: 'Danger' },
  remainingTime: { type: DataTypes.INTEGER, defaultValue: 0 },
  timerDuration: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// Relationships
Race.hasMany(Driver, { as: 'drivers', foreignKey: 'RaceId', onDelete: 'CASCADE' });
Driver.belongsTo(Race, { foreignKey: 'RaceId' });

Driver.hasMany(LapTime, { onDelete: 'CASCADE' });
LapTime.belongsTo(Driver);

// Sync database
const initDB = async () => {
  await sequelize.sync();
};

module.exports = { sequelize, Race, Driver, LapTime, RaceStatus, initDB };