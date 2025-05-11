# 简约现代个人作品集网站

这是一个采用简约现代设计风格的个人作品集网站，具有清晰的信息结构和精致的动画效果，适合展示设计和开发作品。

## 功能特点

- 简约现代的设计风格
- 响应式布局，完美适配各种设备
- 精心设计的动画和过渡效果
- 作品分类筛选功能
- 技能展示与进度条
- 联系表单
- 项目详情模态框
- 打字机效果
- 滚动触发动画

## 使用方法

1. 替换 `img` 文件夹中的图片为您自己的作品和个人照片
2. 修改 HTML 中的个人信息、技能和作品描述
3. 根据需要调整 CSS 样式和颜色
4. 在 JavaScript 文件中更新项目数据

## 目录结构

```
personal-portfolio/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── img/
│   ├── hero-image.png
│   ├── about-image.jpg
│   ├── work-1.jpg
│   ├── work-2.jpg
│   └── ...
└── index.html
```

## 技术栈

- HTML5
- CSS3 (现代布局, Flexbox, Grid)
- JavaScript (ES6+)
- GSAP (GreenSock Animation Platform)
- Font Awesome 图标
- Google Fonts (Inter)

## 自定义

您可以通过修改 CSS 变量轻松更改网站的主题颜色和样式：

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #4f46e5;
    --accent-color: #22d3ee;
    --dark-color: #1e293b;
    --light-color: #f8fafc;
    /* 其他变量... */
}
```

## 设计理念

此作品集网站遵循极简主义设计原则，注重:

- 清晰的视觉层次
- 内容优先的布局
- 精心设计的空白空间
- 简洁而有力的交互
- 提供愉悦的用户体验 

## 如何添加新作品

### 方法一：直接编辑JavaScript代码（推荐）

由于本地文件CORS限制，当前项目使用了JavaScript硬编码的方式加载项目数据。要添加新作品，请按照以下步骤操作：

1. 打开 `js/main.js` 文件
2. 找到 `loadProjects` 函数中的 `projectsData` 数组（约在第250行）
3. 按照现有格式添加新的项目对象：

```javascript
{
    "title": "项目标题",
    "category": "web", // 可选值: web, app, graphic
    "shortDesc": "简短描述 / 子类别",
    "client": "客户名称",
    "date": "完成日期",
    "description": "详细项目描述...",
    "image": "img/work-x.jpg", // 图片路径
    "technologies": ["技术1", "技术2", "技术3"]
}
```

4. 将项目图片添加到 `img` 文件夹中
5. 刷新页面，新作品将自动显示在作品集中

### 方法二：使用JSON文件（适用于有web服务器的环境）

如果您通过Web服务器（如http-server或其他服务器）访问网站，可以使用JSON文件管理项目数据：

1. 启动本地服务器: `npx http-server -c-1`
2. 编辑 `data/projects.json` 文件添加新项目 
3. 通过 `http://localhost:8080` 访问网站

**注意**: 直接在浏览器中通过文件方式（`file://`协议）打开网站时，JSON加载方式会因CORS限制而失败。

### 图片要求

- 作品缩略图建议尺寸：600 x 450像素
- 文件格式：JPG或PNG
- 文件大小：建议不超过200KB
- 命名：work-1.jpg, work-2.jpg 等，建议保持连续性

### JSON数据文件结构

```
personal-portfolio/
├── data/
│   └── projects.json  // 项目数据文件
├── css/
├── js/
├── img/
└── index.html
```

### 项目数据示例

```json
[
    {
        "title": "项目名称",
        "category": "web",
        "shortDesc": "网页设计 / 响应式",
        "client": "客户名称",
        "date": "2023年10月",
        "description": "详细描述内容...",
        "image": "img/work-1.jpg",
        "technologies": ["HTML5", "CSS3", "JavaScript"]
    }
]
``` 