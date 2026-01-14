import { defineStore } from 'pinia'
import { showFailToast, showSuccessToast, showLoadingToast } from 'vant'
import html2canvas from 'html2canvas'

export const useListStore = defineStore('list', {
  state: () => ({
    // 要货清单
    list: {
      id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: []
    },
    // 选中的产品
    selectedProduct: null,
    // 数量
    quantity: 1,
    // 显示数量输入对话框
    showQuantityDialog: false,
    // 显示图片预览
    showPreview: false,
    // 预览图片列表
    previewImages: [],
    // 预览图片索引
    previewIndex: 0
  }),

  getters: {
    // 清单总数量
    totalQuantity: (state) => {
      return state.list.items.reduce((total, item) => total + item.quantity, 0)
    },
    // 清单总金额
    totalAmount: (state) => {
      return state.list.items.reduce((total, item) => total + (item.quantity * item.product.price), 0)
    },
    // 清单是否为空
    isEmpty: (state) => {
      return state.list.items.length === 0
    },
    // 清单项目数量
    itemCount: (state) => {
      return state.list.items.length
    }
  },

  actions: {
    // 显示数量输入对话框
    showQuantityInput(product) {
      this.selectedProduct = product
      this.quantity = 1
      this.showQuantityDialog = true
    },

    // 加入清单
    addToList() {
      if (!this.selectedProduct) {
        showFailToast('请选择产品')
        return
      }

      try {
        // 查找产品是否已在清单中
        const existingItemIndex = this.list.items.findIndex(item => item.product.id === this.selectedProduct.id)
        
        if (existingItemIndex !== -1) {
          // 已存在，数量累加
          this.list.items[existingItemIndex].quantity += this.quantity
          showSuccessToast(`已将${this.selectedProduct.name}数量增加${this.quantity}`)
        } else {
          // 不存在，添加新项目
          this.list.items.push({
            id: Date.now().toString(),
            product: this.selectedProduct,
            quantity: this.quantity
          })
          showSuccessToast(`已将${this.selectedProduct.name}加入清单`)
        }

        // 更新清单更新时间
        this.list.updated_at = new Date().toISOString()
        
        // 关闭对话框
        this.showQuantityDialog = false
        this.selectedProduct = null
        this.quantity = 1

        // 保存到本地存储
        this.saveList()
      } catch (error) {
        console.error('加入清单失败:', error)
        showFailToast('加入清单失败')
      }
    },

    // 从清单中移除项目
    removeFromList(itemId) {
      try {
        const itemIndex = this.list.items.findIndex(item => item.id === itemId)
        if (itemIndex !== -1) {
          const productName = this.list.items[itemIndex].product.name
          this.list.items.splice(itemIndex, 1)
          showSuccessToast(`已将${productName}从清单中移除`)
          
          // 更新清单更新时间
          this.list.updated_at = new Date().toISOString()
          
          // 保存到本地存储
          this.saveList()
        }
      } catch (error) {
        console.error('移除项目失败:', error)
        showFailToast('移除项目失败')
      }
    },

    // 更新清单项目数量
    updateItemQuantity(itemId, quantity) {
      try {
        const itemIndex = this.list.items.findIndex(item => item.id === itemId)
        if (itemIndex !== -1) {
          this.list.items[itemIndex].quantity = quantity
          
          // 更新清单更新时间
          this.list.updated_at = new Date().toISOString()
          
          // 保存到本地存储
          this.saveList()
        }
      } catch (error) {
        console.error('更新数量失败:', error)
        showFailToast('更新数量失败')
      }
    },

    // 清空清单
    clearList() {
      try {
        this.list.items = []
        this.list.updated_at = new Date().toISOString()
        showSuccessToast('清单已清空')
        
        // 保存到本地存储
        this.saveList()
      } catch (error) {
        console.error('清空清单失败:', error)
        showFailToast('清空清单失败')
      }
    },

    // 保存清单到本地存储
    saveList() {
      try {
        localStorage.setItem('productList', JSON.stringify(this.list))
      } catch (error) {
        console.error('保存清单失败:', error)
      }
    },

    // 从本地存储加载清单
    loadList() {
      try {
        const savedList = localStorage.getItem('productList')
        if (savedList) {
          this.list = JSON.parse(savedList)
        }
      } catch (error) {
        console.error('加载清单失败:', error)
      }
    },

    // 显示图片预览
    showImagePreview(image, images) {
      if (images && images.length > 0) {
        this.previewImages = images.map(img => img.image_url)
        this.previewIndex = images.findIndex(img => img.id === image.id)
      } else {
        this.previewImages = [image.image_url]
        this.previewIndex = 0
      }
      this.showPreview = true
    },

    // 导出清单为图片
    async exportListAsImage(elementId) {
      try {
        const element = document.getElementById(elementId)
        if (!element) {
          showFailToast('找不到要导出的元素')
          return false
        }

        // 显示加载提示
        showLoadingToast({
          message: '正在导出...',
          forbidClick: true,
          duration: 0
        })

        // 将清单转换为图片
        const canvas = await html2canvas(element, {
          scale: 2, // 提高图片清晰度
          useCORS: true, // 允许跨域图片
          backgroundColor: '#ffffff',
          logging: false
        })

        // 转换为图片链接
        const image = canvas.toDataURL('image/png')

        // 创建下载链接
        const link = document.createElement('a')
        link.href = image
        link.download = `要货清单_${new Date().getTime()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 隐藏加载提示
        showSuccessToast('导出成功')
        return true
      } catch (error) {
        console.error('导出图片失败:', error)
        showFailToast('导出失败')
        return false
      }
    },

    // 取消操作
    onCancel() {
      this.showQuantityDialog = false
      this.selectedProduct = null
      this.quantity = 1
      this.showPreview = false
    }
  }
})