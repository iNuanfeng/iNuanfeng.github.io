# 如何用 Webpack 改造 Gulp 旧工程

## 前言

> 近几年，前端各种框架工具层出不穷，从两三年前还是一个jQuery搞定全站，到之后requirejs/seajs，node，gulp/webpack，Angular/React/Vue，RN/weex的不断涌现，完全颠覆了原来的前端开发模式。

那么这些框架和工具给我们到底带来了什么好处呢？其实我认为最核心莫过于这两点：模块化开发、自动化工程。而本次前端重构所围绕的核心问题就是自动化工程，将原有的gulp版本的项目利用webpack彻底改造，顺利消灭了既繁琐又易错的人工操作。

## gulp版本的痛点

我们先来看下奇货商城之前的开发流程：

![](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/CdAV4t.png)

从上图可以看出，我们奇货前端开发之前存在的一些痛点：

1. 前端在后端项目里面修改vm文件联调；
2. 开发联调需要上传静态资源到测试域名CDN；
3. 不同目录下的资源还需要在CDN上传网站上一级一级目录的点开再上传；
4. 上线前需要人工去替换vm文件里的CDN路径；
5. 上线前还需要人工去上传静态资源到正式域名CDN；
6. 开发模式不支持es6转义，导致低端安卓机无法在本地进行前端调试；
7. gulp-babel不完全支持es6转es5，导致部分低端安卓机出现各种莫名其妙的问题；

以上这些痛点，造成的重复性无用功，既浪费精力又着实让人蛋疼，而经过这次的框架重构，只需一键操作，就可完成联调和发布的部署。省心省力还不会出错。

## 如何利用webpack做自动化

先看一下改版后，奇货商城的开发流程：

![2](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/sMiOHt.png)

从上图可以看到，我们经过改版后做到了：

1. vm文件自动生成
2. 开发联调直接读取本地静态资源
3. 打包后所有资源在同一级目录，一次性拖拽上传（下个版本将实现前静态资源自动上传）
4. 只需一行配置项，自动生成对应的线上CDN路径
5. 完美的babel-loader，es6语法也可在低端安卓机上轻松本地调试；

下面我们看看如何实现。

### 项目结构

下面是部分主要目录结构：

``` cmd
├── build   （所有的webpack配置项）
│   ├── build.js
│   ├── dev-client.js
│   ├── dev-server.js
│   ├── utils.js    （★入口配置，生成文件配置，vm生成都靠这个文件）
│   ├── webpack.base.conf.js    （基础配置）
│   ├── webpack.dev.conf.js     （开发模式配置）
│   └── webpack.prod.conf.js    （生成环境配置）
├── config  （node环境变量，入口文件的配置）
│   ├── dev.env.js
│   ├── entry.js    （页面文件列表）
│   ├── index.js    （★主配置文件）
│   ├── prod.env.js
│   └── skinEntry.js    （皮肤文件列表）
├── dist    （打包后生成的文件夹，已全部转成vm）
│   ├── goods
│   │   ├── detail.vm
│   ├── index.vm
│   └── static  （打包后-静态资源文件）
│       ├── css
│       ├── js
│       └── skins   （打包后皮肤文件夹）
│           ├── default
│           │   ├── default.1184b4d7.js
│           │   ├── default.f07ae9df.css
│           │   └── default.html
│           ├── huotu
│           └── pay
├── mock
├── package.json
├── routes
├── src （源文件）
│   ├── js
│   │   ├── components
│   │   ├── goods
│   │   │   ├── detail.js
│   │   │   └── skins
│   │   │       ├── default.js
│   │   │       ├── huotu.js
│   │   ├── index.js
│   ├── less
│   │   ├── components
│   │   ├── goods
│   │   │   ├── detail.less
│   │   │   └── skins
│   │   │       ├── default.less
│   │   │       ├── huotu.less
│       ├── index.less
│   └── pages
│       ├── components
│       ├── goods
│       │   ├── detail.html
│       │   └── skins
│       │       ├── default.html
│       │       ├── huotu.html
│       └── index.html
├── static
│   └── images
└── unit    （公共库）
    ├── common  （业务组件）
    │   ├── js
    │   └── less
    ├── layout  （公共页面）
    │   ├── footer.html
    │   └── header.html
    └── lib     （第三方组件）
```

以上是我们奇商城的前端目录结构。

webpack的一些必用的loader和plugin，例如less-loader, style-loader, file-loader, html-loader, 还有UglifyJsPlugin, ExtractTextPlugin, OptimizeCSSPlugin等等，在这里就不详细展开了。

我们重点说说以下几点核心：

### node脚本调用webpack

通过node脚本来调用webpack，而不是直接在命令行启动webpack，会有这么几个用处：

- 通过node启express做本地mock数据；
- 开发环境和生产环境的公共配置项，通过webpack-merge模块做抽离，方便维护；
- 可以设置node环境变量，以区分不同环境中的打包配置，这点在后面还有一个大招；

### HtmlWebpackPlugin

这货可以说是整个构建过程里，核心中的核心了。

自动生成vm、开发环境调用本地资源，以及皮肤文件的管理都有这个插件的功。部分代码：

```
new HtmlWebpackPlugin({
  filename: process.env.NODE_ENV === 'production' ? path + name + '.vm' : path + name + '.html',
  template: template,
  inject: false,
  chunks: [pathBuild + name, 'vendor', 'manifest']
})
```

通过判断node环境变量，决定生成vm还是本地html；

### CommonsChunkPlugin

通过这个插件实现了js模块打包，公共模块提取，客户端缓存&增量发布，皮肤文件生成。部分代码：

```
for (let i = 0; i < entry.length; i++) {
  let item = entry[i]
  let path = item.path
  let name = item.name
  let pathBuild = path.replace(/\//g, '-');
  result[pathBuild + name] = './src/js/' + path + name + '.js'
}

for (let i = 0; i < skinEntry.length; i++) {
  let item = skinEntry[i]
  let path = item.path
  let name = item.name
  if (process.env.NODE_ENV === 'production') {
    result['../skins/' + path + name] = './src/js/goods/skins/' + name + '.js'
  } else {
    result['skins/' + path + name] = './src/js/goods/skins/' + name + '.js'
  }
}

Object.assign(result, {
  vendor: ['@unit/common/js/base', '@unit/common/js/util']
})


// 公共文件提取
new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor', // 注意不要.js后缀
  chunks: utils.computeChunks(entryConfig, '')
})

// 避免修改业务代码导致vendor的md5改变，保留文件缓存
new webpack.optimize.CommonsChunkPlugin({
  name: 'manifest',
  chunks: ['vendor']
})
```

### 自动化部署

自动化部署是在打包服务器通过脚本实现的，先通过npm命令打包前端工程，然后将代码copy到后端工程中，最后打包后端项目，再发布。

![3](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/Obkwhq.png)

## 遇到的困难

### 公共文件的引入

webpack官方文档并没有如何引入公共html文件的说明，这一点是在翻了N多资料后才发现的，最终的方案是：
去掉webpack.config.js文件中配置的全局html-loader，这样html模版文件就不会被html-loader解析，我们可以使用ejs语法嵌入其他html页面和图片资源。因为没了全局的html-loader解析html文件，使用ejs语法嵌入的资源返回的是ejs代码，还需要使用html-loader来解析成html代码。

（html-loader!）表示引用html-loader这个加载器来解析

```
<%= require('html-loader!../layout/header.html') %>
```

但是这样将全局html-loader去掉后，又碰到了下面的问题。

### jsp变量的引入

vm中有时需要直接引用后端的变量，如${cssUrl}，就像这样：

![4](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/CTw3sD.png)

这时候webpack打包居然就报错了，报错了：

![5](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/dGvkDy.png)

### 原因排查

出现这个问题的原因应该是由于HtmlWebpackPlugin这个插件引用的模版默认是ejs，当不使用全局html-loader的时候，模板文件其实是以ejs解析的，而${cssUrl}在ejs中也识别为一个变量，当然就报错了。

#### 解决方法

这过程中，整个周末都在想这个问题，甚至已经开始考虑用gulp+webpack的方案了。。

又翻了很多资料，突然想到既然是ejs模板，可以尝试了一些ejs去写，而不是非要把这个模板以html的方式loader进来，然后就有了如下方法：

```
<link href="<%= '${cssUrl}' %>" rel="stylesheet">  
```

这时候就被识别为一个字符串了！成功解决。

#### 进一步探索，巧用node环境变量

上面的方法解决的其实也是挺丑的，因为本地开发的时候需要引用本地文件的，上线的时候又得傻乎乎地去一个个地方去替换：

```
<!-- <link href="<%= skinCss %>" rel="stylesheet">   -->
<link href="/skins/pay/pay.css" rel="stylesheet">
```

然后马上试了下，在模板文件中用ejs去读node环境变量process.env.NODE_ENV，果然能取到值，就有了下面这个相对完美的方案：

```
<% 
if (process.env.NODE_ENV === 'production') { 
  skinCss = '${cssUrl}';
} else { 
  skinCss = '/skins/pay/pay.css'; 
} 
%>

<link href="<%= skinCss %>" rel="stylesheet">
```

其中production就是利用node启动webpack时配置的，在这里派上了大用场。

## End

到这里，我们奇货商城已经实现了前端工程自动化，再也不用一遍又一遍地去vm里修改路径，人工去记着改了哪些文件，要上传哪些静态资源。更加不用担心漏传什么资源文件而导致线上bug辣。😃