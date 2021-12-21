# Vue3.x 从初始化到渲染到底发生了什么？

> Vue3 在初始化的时候做了什么？和 Vue2 相比有哪些差异吗？Vue3 又是如何处理响应式数据和渲染过程的？
>
> 本文从 Vue3 源码入手，一步步分析 Vue3 的核心渲染过程。



`Vue3.0` 正式发布于 2020-9-18，相比 `Vue2.x` 有以下几点主要改进：

1. 性能提升：重写虚拟dom，Tree-Shaking机制
2. 完全模块化，更易维护
3. 易用性和扩展性：Composition-api，Fragment，Teleport，Suspense
4. 完全 TypeScript 支持



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
│   └── vue-compat                # 兼容相关
├── scripts
└── test-dts
```

这里，我们标注出了哪些是核心文件，其中 `vue` 文件夹就是框架的入口目录。

然后，我们寻找入口文件，从打包工具的配置文件 `rollup.config.js` 中找到：

```javascript
let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`
```

入口文件分两种，一种是完整版：`/packages/vue/src/index.ts`，另一种是 `runtime` 版本：`/packages/vue/src/runntime.ts`。



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



## 渲染流程

假设我们只是熟练使用框架 api 的程度，这时候我们拿到了入口，如何梳理出主链路，以及分支链路？

一行行读代码？行不通。

根据功能维度 先读文档 和 仓库内的 readme？也许可以。

根据内部模块划分 看仓库代码？也许可以。



## 重点问题拷问

如何传值，如何响应，如何编译，如何渲染，如何更新，



## 写在最后

