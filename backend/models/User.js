const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');


module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: '用户名不能为空' },
        len: { args: [3, 50], msg: '用户名长度必须在3-50个字符之间' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '密码不能为空' },
        len: { args: [6, 255], msg: '密码长度必须在6-255个字符之间' }
      }
    },
    role: {
      type: DataTypes.ENUM('system_admin', 'admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: { args: [['system_admin', 'admin', 'user']], msg: '无效的角色' }
      }
    },
    region_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'regions',
        key: 'id'
      },
      validate: {
        notNull: { msg: '区域不能为空' }
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: { args: [['active', 'inactive']], msg: '无效的状态' }
      }
    },
    invite_code_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'invite_codes',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: '无效的电子邮箱格式' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        is: { args: /^1[3-9]\d{9}$/, msg: '无效的手机号码格式' }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      // 密码加密
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // 验证密码
  User.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};