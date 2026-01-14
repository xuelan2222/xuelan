const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileUpload = sequelize.define('FileUpload', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '文件名不能为空' },
        len: { args: [1, 255], msg: '文件名长度必须在1-255个字符之间' }
      }
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '原始文件名不能为空' },
        len: { args: [1, 255], msg: '原始文件名长度必须在1-255个字符之间' }
      }
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '文件路径不能为空' },
        len: { args: [1, 255], msg: '文件路径长度必须在1-255个字符之间' }
      }
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notEmpty: { msg: '文件大小不能为空' },
        min: { args: [0], msg: '文件大小不能小于0' }
      }
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: '文件类型不能为空' },
        len: { args: [1, 50], msg: '文件类型长度必须在1-50个字符之间' }
      }
    },
    upload_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: { msg: '上传用户ID不能为空' }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'file_uploads',
    timestamps: true,
    underscored: true
  });

  return FileUpload;
};