const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: { msg: '用户ID不能为空' }
      }
    },
    operation: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: '操作类型不能为空' },
        len: { args: [1, 50], msg: '操作类型长度必须在1-50个字符之间' }
      }
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: '资源类型长度必须在0-50个字符之间' }
      }
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'IP地址不能为空' },
        len: { args: [1, 50], msg: 'IP地址长度必须在1-50个字符之间' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'operation_logs',
    timestamps: true,
    underscored: true
  });

  return OperationLog;
};