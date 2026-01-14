# VS Code Remote Debugging (Quick Guide)

✅ 简要步骤：

1. 在 VS Code 中打开远程工作区（Remote SSH）。
2. 在“运行与调试”侧栏选择 `Start Backend (inspect)` 任务以用 `--inspect` 启动后端：
   - 或者在终端运行： `cd backend && PORT=3001 node --inspect=0.0.0.0:9229 app.js`
3. 选择 `Attach to Backend (Remote)` 启动调试器并设置断点（例如 `backend/controllers/authController.js` 的 `login` 方法）。
4. 运行 `Start Frontend (Vite)` 任务以启动前端： `cd frontend && npm run dev`。
5. 启动 `Launch Frontend (Chrome)` 配置，打开浏览器并访问 `http://localhost:5173`，在 `Login.vue` 或 `user` store 中设置断点。
6. 在浏览器中执行登录（使用管理员账号），验证：
   - 前端是否自动跳转到 `/admin/dashboard`。
   - 后端 `login` 接口是否触发断点并返回包含 `role` 的 token/user。

💡 调试要点：
- 确保端口 9229 在远端可用并已正确转发（如果使用 Remote SSH，VS Code 会自动转发）。
- 如果后端已有进程占用 3000，使用 `PORT=3001` 来启动（示例已使用 3001）。
- 前端使用 Vite（默认 5173），如需修改端口，请更新 `launch.json` 的 `url`。

---

如果你需要，我可以把这些配置提交到当前分支并创建 Pull Request（目前已将配置添加到分支）。
