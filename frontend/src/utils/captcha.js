// 前端生成验证码工具类

/**
 * 生成随机验证码
 * @param {number} length - 验证码长度
 * @returns {string} 随机生成的验证码
 */
export const generateRandomCode = (length = 4) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 生成验证码图片
 * @param {string} code - 验证码字符串
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @returns {string} 验证码图片的base64编码
 */
export const generateCaptchaImage = (code, width = 100, height = 44) => {
  // 创建canvas元素
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  
  // 设置背景色
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, width, height)
  
  // 绘制噪点
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`
    ctx.fillRect(x, y, 1, 1)
  }
  
  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.5)`
    ctx.lineWidth = 1
    ctx.stroke()
  }
  
  // 绘制验证码
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 验证码字符随机位置和颜色
  for (let i = 0; i < code.length; i++) {
    const x = (width / code.length) * (i + 0.5)
    const y = height / 2
    const rotation = (Math.random() - 0.5) * 0.4 // -0.2到0.2弧度的旋转
    const color = `rgb(${Math.random() * 80}, ${Math.random() * 80}, ${Math.random() * 80})`
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.fillStyle = color
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }
  
  // 绘制边框
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, width - 1, height - 1)
  
  // 返回base64编码
  return canvas.toDataURL('image/png')
}

/**
 * 验证验证码是否正确
 * @param {string} inputCode - 用户输入的验证码
 * @param {string} correctCode - 正确的验证码
 * @returns {boolean} 验证结果
 */
export const validateCaptcha = (inputCode, correctCode) => {
  // 添加严格的参数检查
  if (!inputCode || !correctCode) {
    console.error('验证码验证失败: 输入或正确验证码为空', { inputCode, correctCode })
    return false
  }
  
  // 确保都是字符串类型
  const normalizedInput = String(inputCode).trim().toLowerCase()
  const normalizedCorrect = String(correctCode).trim().toLowerCase()
  
  const isValid = normalizedInput === normalizedCorrect
  console.log('验证码验证结果:', { 
    input: normalizedInput, 
    correct: normalizedCorrect, 
    isValid 
  })
  
  return isValid
}