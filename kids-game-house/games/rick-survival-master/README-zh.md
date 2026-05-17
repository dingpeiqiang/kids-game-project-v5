<p align="center">
  <a href="https://rick-survival.vercel.app/">
    <img src="https://user-images.githubusercontent.com/36636599/178037848-47ab3779-32a6-456f-9a00-e1d24c563608.png" alt="Rick Survival 游戏标志" width="300">
  </a>
</p>

<h3 align="center">瑞克生存</h3>

<p align="center">
  你是瑞克·桑切斯，每个人最喜欢的不稳定天才。生存并摧毁成千上万的怪物！
  <br>
  <a href="https://rick-survival.vercel.app"><strong>探索官方网站 »</strong></a>
  <br>
  <br>
  <a href="https://www.youtube.com/watch?v=fFbHJQXk_qM">预告片</a>
  ·
  <a href="https://www.youtube.com/watch?v=ZKgzCRgkzhs">游戏视频</a>
  ·
  <a href="https://github.com/nblackninja/rick-survival/releases/latest">下载</a>
</p>

<img align='right' src="https://user-images.githubusercontent.com/36636599/178049123-edb92253-aeef-4f41-be85-a99fec02ce1f.gif" width="50">

# 瑞克生存

[English](README.md) | [Русский](README-ru.md) | 中文

这是一款带有 RPG 元素的动作 Roguelike 生存游戏。游戏设定在不同的维度中，你必须在对抗日益增长的怪物群中生存下来。

[Overview.webm](https://user-images.githubusercontent.com/36636599/178049779-5734445b-59e2-4fc5-944a-7a16fa675263.webm)

<img align='right' src="https://user-images.githubusercontent.com/36636599/178054079-795a9922-bc20-489d-ae5e-eb9df319569f.gif" width="50">

## 🔨 技术栈
- [Phaser3](https://github.com/photonstorm/phaser) - 游戏引擎
- [Snowpack](https://github.com/FredKSchott/snowpack) - 构建工具
- [Rot.js](https://github.com/ondras/rot.js) - 地图生成
- [Electron](https://github.com/electron/electron) - 构建跨平台桌面游戏
- [Vue/Nuxt](https://github.com/nuxt/framework) - 网站前端框架
- [TypeScript](https://github.com/microsoft/TypeScript) 和 [ES6](https://github.com/eslint/eslint) - 用于整个项目

<img align='right' src="https://user-images.githubusercontent.com/36636599/178054752-b5d20d68-167f-4e1b-88c0-e6472d9d296f.gif" width="50">

## ✨ 特性
- 随机世界生成
  - 11 个令人兴奋的维度
- 敌人掉落物品
  - 经验值、金钱和生命值
- 角色进化
  - 46 种不同的瑞克
  - 在等级 15-20-25-30 时进化
- 升级 7 种属性
  - 生命恢复
  - 最大生命值
  - 身体伤害
  - 子弹速度
  - 子弹伤害
  - 装填速度
  - 移动速度
- 33 种独特武器
- 4 种游戏风格
  - 手枪（平衡）
  - 狙击枪（低射速，高伤害）
  - 机枪（高射速，低伤害）
  - 徒手（高生命值，高身体伤害）
- 敌人生成器
  - 可以设置敌人类型、数量和生成间隔
- 同时战斗中的 500 个怪物
  - 敌人出现在屏幕后面的随机位置
- 动画、音乐和音效

<img align='right' src="https://user-images.githubusercontent.com/36636599/178058461-d269af7f-7a38-4f8d-b8cd-9340589ef545.gif" width="50">

## 🖥 环境支持

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/electron/electron_48x48.png" alt="Electron" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Electron |
| --- | --- | --- | --- | --- |
| 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 |

<img align='right' src="https://user-images.githubusercontent.com/36636599/178062917-d250b650-195c-4dee-a5bc-220f85d47b35.gif" width="50">

## 📝 入门指南

### 1. 安装

```bash
git clone https://github.com/nblackninja/rick-survival.git
cd rick-survival
npm install
```

### 2. 使用

#### 2.1. 游戏

```bash
npm run dev
```

#### 2.2. 网站

```bash
npm run website:dev
```

#### 2.3. Electron

```bash
npm run build
npm run electron:start
```

### 3. 构建

```bash
npm run build
npm run electron:dist
```

<img align='right' src="https://user-images.githubusercontent.com/36636599/178063027-ce2f4cc0-3322-43fe-aa46-5ecf0d570cf1.gif" width="50">

## 🗂 资源
- [官方网站](https://rick-survival.vercel.app)
- [预告片](https://www.youtube.com/watch?v=fFbHJQXk_qM)
- [游戏玩法](https://www.youtube.com/watch?v=ZKgzCRgkzhs)
- [下载](https://github.com/nblackninja/rick-survival/releases/latest)

<img align='right' src="https://user-images.githubusercontent.com/36636599/178062377-7e547aa2-1566-4b1b-869e-54d8e9bdec98.gif" width="50">

## 💬 说明

如果您在使用应用程序时有任何建议或问题，请发送邮件至邮箱。

在创建它之前，我受到了三款游戏的启发：[Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/)、[Crimsonland](https://store.steampowered.com/app/262830/Crimsonland) 和 [Magic Survivor](https://play.google.com/store/apps/details?id=com.vkslrzm.Zombie)。

<img align='right' src="https://user-images.githubusercontent.com/36636599/178062261-638e3d64-d90e-4442-86ab-5bc5b83d1839.gif" width="50">

## 🔐 许可证

源代码根据 MIT 许可证发布，许可证可在[此处](LICENSE)获取。

---

> 网站 [yudinikita.ru](https://yudinikita.ru) &nbsp;&middot;&nbsp;
> 邮箱 <mail@yudinikita.ru> &nbsp;&middot;&nbsp;
> GitHub [@yudinikita](https://github.com/yudinikita)
