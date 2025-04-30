const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const User = sequelize.define("user", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  user_name: { type: DataTypes.STRING },
  avatar: { type: DataTypes.BLOB, allowNull: true },
  role: { type: DataTypes.STRING, defaultValue: "USER" },
});

const Character = sequelize.define("character", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  character_picture: { type: DataTypes.BLOB, allowNull: true },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  settings: { type: DataTypes.TEXT, allowNull: true },
  interaction_count: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const ChatSession = sequelize.define("chatSession", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  character_id: { type: DataTypes.INTEGER, allowNull: false },
  context_history: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
  },
  last_message_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const Message = sequelize.define("message", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  sender_type: { type: DataTypes.STRING, allowNull: false },
  tokens_used: { type: DataTypes.INTEGER },
  chat_session_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  character_id: { type: DataTypes.INTEGER, allowNull: true },
});

const Favorite = sequelize.define("favorite", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const Tag = sequelize.define("tag", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

const CharacterTag = sequelize.define("character_tag", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const defineAssociations = () => {
  User.hasMany(Character, { foreignKey: "creator_id" });
  Character.belongsTo(User, { foreignKey: "creator_id" });

  User.hasMany(ChatSession, { foreignKey: "user_id" });
  ChatSession.belongsTo(User, { foreignKey: "user_id" });

  User.hasMany(Message, { foreignKey: "user_id" });
  Message.belongsTo(User, { foreignKey: "user_id" });

  Character.hasMany(Message, { foreignKey: "character_id" });
  Message.belongsTo(Character, { foreignKey: "character_id" });

  Character.hasMany(ChatSession, { foreignKey: "character_id" });
  ChatSession.belongsTo(Character, { foreignKey: "character_id" });

  ChatSession.hasMany(Message, { foreignKey: "chat_session_id" });

  Message.belongsTo(ChatSession, { foreignKey: "chat_session_id" });

  User.belongsToMany(Character, { through: Favorite });
  Character.belongsToMany(User, { through: Favorite });

  Character.belongsToMany(Tag, { through: CharacterTag });
  Tag.belongsToMany(Character, { through: CharacterTag });
};

defineAssociations();

module.exports = {
  User,
  Character,
  ChatSession,
  Message,
  Favorite,
  Tag,
  CharacterTag,
};
