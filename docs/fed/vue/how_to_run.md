# Vue3.x 从初始化到渲染到底发生了什么？

> Vue3 在初始化的时候做了什么？和 Vue2 相比有哪些差异吗？Vue3 又是如何处理响应式数据和渲染过程的？
>
> 本文从 Vue3 源码入手，一步步分析 Vue3 的核心渲染过程。



`Vue3.0` 正式发布于 2020-9-18，相比 `Vue2.x` 有以下几点主要改进：

1. 性能提升：重写虚拟dom，Tree-Shaking机制
2. 完全模块化，更易维护
3. 易用性和扩展性：Composition-api，Fragment，Teleport，Suspense
4. 完全 TypeScript 支持



- 一、使用 monorepo管理源码
- 二、使用 TypeScript 开发源码
- 三、性能优化 1.源码体积优化 2.数据劫持优化Proxy 3.编译优化 4.diff算法优化
- 四、语法 API 优化：Composition API



想要了对 `Vue3` 的底层核心，直接读源码是最直接的。而且 `Vue3` 对做了非常好的模块划分，源码易读易维护。本文主要分析 `Vue3` 的核心渲染逻辑。



## 前期准备

> 要阅读源码，这几件事是必备的：下载并编译源码，了解模块划分和入口，方便的调试手段



### 1. 下载编译源码

本文分析基于 `Vue@3.2.26 ` 版本。

```bash
# 下载（ Vue3 仓库：https://github.com/vuejs/vue-next ）
git clone git@github.com:vuejs/vue-next.git

# 安装（ Vue3 使用 pnpm 包管理工具 ）
cd vue-next
pnpm install

# 打包编译
yarn build
```

打包产物会存放到 `/packages/vue/dist` 文件夹下：

```bash
dist
├── vue.cjs.js                          # (3kb) CJS格式（Node.js 环境使用）
├── vue.cjs.prod.js                     # (2kb) 
├── vue.esm-browser.js                  # (601kb) ESM格式（浏览器使用 <script type="module"></script>）
├── vue.esm-browser.prod.js             # (130kb) 
├── vue.esm-bundler.js                  # (3kb) ESM格式（Webpack 等工程使用）
├── vue.global.js                       # (630kb) IIFE格式（IIFE格式支持浏览器直接引用）
├── vue.global.prod.js                  # (130kb) 
├── vue.runtime.esm-browser.js          # (403kb) 
├── vue.runtime.esm-browser.prod.js     # (84kb) 
├── vue.runtime.esm-bundler.js          # (0.6kb) ESM格式（★最常用，Webpack 等工程内引用的就是这个）
├── vue.runtime.global.js               # (427kb) 
└── vue.runtime.global.prod.js          # (83kb) 
```

可以看到，`Vue` 打包了很多个版本的文件，带 `prod` 的文件是压缩过的，例如去除了很多 `warning` 信息。

带 `runtime` 的文件是去除了 `compiler` 模块的，体积最小，它与完整版的差别在于不能写 `template` 模板，只能写 `h` 函数。我们平时工程内最常用的 `runtime` 版本，是通过 `vue-loader` 来实现支持 `template` 写法，同时享受到了好的开发体验和最优的加载体积。

值得注意的是，`vue.runtime.esm-bundler.js` 体积只有0.6kb，因为它把 `@vue/runtime-dom` 和 `@vue/shared` 等核心模块做了单独的 `npm` 发包。



### 2. 模块划分和入口

`Vue3` 的源码统一放在 `packages` 文件夹下：

```bash
.
├── examples                      # 我们自己创建，用于存放 DEMO 页
├── packages
│   ├── compiler-core             # ★核心文件
│   ├── compiler-dom              # ★核心文件
│   ├── compiler-sfc              # 单文件模块
│   ├── compiler-ssr              # 服务端渲染
│   ├── reactivity                # 响应式模块
│   ├── reactivity-transform      # 响应式模块
│   ├── runtime-core              # ★核心文件
│   ├── runtime-dom               # ★核心文件
│   ├── runtime-test              # 单元测试
│   ├── server-renderer           # 服务端渲染
│   ├── sfc-playground            # 单文件模块
│   ├── shared                    # ★工具库
│   ├── size-check                # 打包体积检测
│   ├── template-explorer         # 代码编译预览
│   ├── vue                       # ★入口
│   └── vue-compat                # Vue2升级相关
├── scripts
└── test-dts
```

这里，我们标注出了哪些是核心文件，其中 `vue` 文件夹就是框架的入口目录。

然后，我们寻找入口文件，从打包工具的配置文件 `rollup.config.js` 中找到：

```javascript
let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`
```

入口文件分两种，一种是完整版：`/packages/vue/src/index.ts`，另一种是 `runtime` 版本：`/packages/vue/src/runtime.ts`。



### 3. 方便的调试手段

`Vue3` 项目本身提供了非常好用的完整版的调试方案：

```bash
# 编译运行（生成 source map，方便调试）
SOURCE_MAP=true yarn dev

# 运行文件服务
yarn serve

# 浏览器打开如下示例页面
http://localhost:5000/packages/vue/examples/classic/todomvc
```

其中，生成的 js 文件位于 `/packages/vue/dist/vue.global.js`，会监听修改实时更新，并且生成了 `sourcemap` 文件。仓库中提供的示例位于：`/packages/vue/examples` 文件夹内。

最后，打开 `Chrome` 的 `Sources`，就可以愉快地调试源码了！

<img src="https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/gcKISA.png" alt="image-20211221193453451" style="zoom:50%;" />



## 正式开始前

源码非常多，从头开始看影响效率，而且容易一头扎进细节。首先，明确你读源码的目的是什么？是屡清核心链路，还是研究某一块细节。类似设计一个框架或模块，首先得有需求，也就是功能，然后再有设计和实现。

相对应的，我们阅读源码前，可以先使用这个框架，并且读完相关的文档，看看有哪些功能，有没有一些设计思路介绍。然后自己先梳理出想要了解的思维脑图，以及流程图，再带着原先的问题，进入源码，这样我们就可以更加有方向性。



### 核心模块结构是怎么样的？

我们这次希望剖析 `Vue3` 的核心渲染逻辑，根据功能和官方文档介绍，我们梳理出以下功能脑图：

以及根据官方文档介绍，梳理出以下链路图：

梳理模块依赖关系：

这里有个小方法，通过 vscode 全局查找 packages 里的包名，排除以下非核心相关的文件：`*.md, *.json, __tests__, *.js, vue-compat/, size-check/`



### 全局变量 Vue 是从哪里来的？

我们在使用 Vue3 的时候会发现，`import vue from 'vue'`， 输出的并不是 Vue 全局变量，但 vue.global.js 里面有全局变量 Vue。这是为什么呢？原因是 Vue3 的源码中已经不会将 vue 放到全局变量上，它是导出一个对象，里面包含了 `createApp, nextTick` 等等所有的 @vue/runtime-dom 和 @vue/runtime-core 下的方法。至于 vue.global.js 里面为什么有全局变量 `Vue`，那是通过 rollup 打包生成的，具体是通过 `packages/vue/packages` 下的 `buildOptions.name` 进行定义的。



<!--假设我们只是熟练使用框架 api 的程度，这时候我们拿到了入口，如何梳理出主链路，以及分支链路？-->

<!--一行行读代码？行不通。-->

<!--根据功能维度 先读文档 和 仓库内的 readme？也许可以。-->

<!--根据内部模块划分 看仓库代码？也许可以。-->



## 开始阅读

现在我们有了入口，有了大致的模块概念，接下来让我们从 Vue3 初始化开始，在源码中探索答案。来看看 Vue3.x 从初始化到渲染到底发生了什么？













## 重点问题拷问

如何传值，如何响应，如何编译，如何渲染，如何更新，



## 写在最后



本文是从整体视角解读了 Vue，归类了总结；

看完这边，我们学习到了xxxxx。



后面的 Vue 系列文章，我们会带着一个类型的几个问题，分别解读各个部分的源码；

包括响应式，异步，组件，api，composition api，等等；

另外也包括 Vue 之外的一些值得学习的地方，如何管理开源项目，如何做单元测试，如何做monorepo等等，当然这部分会放在其他的类目下面。