const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InviteCode = sequelize.define('InviteCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: '邀请码不能为空' },
        len: { args: [6, 20], msg: '邀请码长度必须在6-20个字符之间' }
      }
    },
    status: {
      type: DataTypes.ENUM('unused', 'used', 'expired'),
      allowNull: false,
      defaultValue: 'unused',
      validate: {
        isIn: { args: [['unused', 'used', 'expired']], msg: '无效的邀请码状态' }
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: { msg: '创建者不能为空' }
      }
    },
    used_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'invite_codes',
    timestamps: true,
    underscored: true,
    hooks: {
      // 自动生成邀请码
      beforeCreate: (inviteCode) => {
        if (!inviteCode.code) {
          inviteCode.code = generateInviteCode();
        }
      }
    }
  });

  // 生成随机邀请码
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  return InviteCode;
};