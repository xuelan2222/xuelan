import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'

// 导入Vant组件库
import { Button, Cell, CellGroup, NavBar, Tabbar, TabbarItem, Search, Grid, GridItem, Image as VanImage, Swipe, SwipeItem, Lazyload, showFailToast, showSuccessToast, Dialog, Loading, Form, Field, Checkbox } from 'vant'
import 'vant/lib/index.css'

// 导入Element Plus组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 全局样式（待后续添加）

// 创建Vue应用
const app = createApp(App)

// 配置Vant组件
app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Search)
app.use(Grid)
app.use(GridItem)
app.use(VanImage)
app.use(Swipe)
app.use(SwipeItem)
app.use(Lazyload)
app.use(Form)
app.use(Field)
app.use(Checkbox)
app.use(Dialog)
app.use(Loading)

// 配置Element Plus组件
app.use(ElementPlus, {
  locale: zhCn,
})

// 配置路由和状态管理
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')