## 背景

> [**Taro3**](https://taro-docs.jd.com/taro/docs/) 是一个开放式跨端跨框架解决方案，支持使用 React/Vue 等框架来开发各端小程序、H5、RN 等应用。通过「**Write once Run anywhere**」来实现跨端，来**降低研发成本，提升业务代码维护性**。

从官方资料了解到，Taro3 相比 Taro1/2，最大的变化是从重编译时转变成了重运行时，使得 Taro3 能够支持 React 和 Vue 甚至 jQuery 来开发小程序。

- 小程序跨端的基本原理是怎么样的？
- 运行时和编译时的实现原理有什么区别？
- 为什么 Taro3 能够支持不同前端框架？

## 小程序跨端的基本原理

### 小程序的架构

在讲 Taro 架构之前，我们先来回顾一下小程序的架构。
微信小程序主要分为 **逻辑层** 和 **视图层**，以及在他们之下的原生部分。逻辑层主要负责 JS 运行，视图层主要负责页面的渲染，它们之间主要通过 Event 和 Data 进行通信，同时通过 JSBridge 调用原生的 API。这也是以微信小程序为首的大多数小程序的架构。

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/vB2gga.png)

由于原生部分对于前端开发者来说就像是一个黑盒，因此，整个架构图的原生部分可以省略。同时，我们我们对 逻辑层 和 视图层 也做一下简化，最后可以得到小程序架构图的极简版：

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/fH5bUs.png)

也就是说，只需要在逻辑层调用对应的 App()/Page() 方法，且在方法里面处理 data、提供生命周期/事件函数等，同时在视图层提供对应的模版及样式供渲染就能运行小程序了。这也是大多数小程序开发框架重点考虑和处理的部分。

### 小程序跨端基本思路

了解了小程序的基本架构，那么我们如何让 react 或者 vue 的代码，运行到小程序呢？
这里以 Taro2 为例：架构主要分为：编译时 和 运行时。

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/NumAzv.png)

其中编译时主要是将 Taro 代码通过 Babel 转换成 小程序的代码，如：JS、WXML、WXSS、JSON。
运行时主要是进行一些：生命周期、事件、data 等部分的处理和对接。

但这种方式存在一些缺陷：

- JSX 支持程度不完美。Taro 对 JSX 的支持是通过编译时的适配去实现的，但 JSX 又非常之灵活，因此还不能做到 100% 支持所有的 JSX 语法。
- 不支持 source-map。Taro 对源代码进行了一系列的转换操作之后，就不支持 source-map 了，用户调试、使用这个项目就会不方便。
- 维护和迭代十分困难。Taro 编译时代码非常的复杂且离散，维护迭代都非常的困难。



## Taro3原理浅析

### 设计思路

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/UJvaBb.png)

无论是 React 或者 Vue，他们都会使用到浏览器的 DOM 和 BOM API，然后再渲染到浏览器上。那么我们同样可以在小程序里面实现一层 DOM 和 BOM，从而让这些框架运行到小程序上。

### DOM渲染方案

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/KLdRGI.png)

但是这里有一个问题，即使我们去得到一棵 Taro DOM 树，那要怎么样去 setData 到视图层？因为小程序并没有提供动态创建节点的能力，我们需要考虑如何使用相对静态的 wxml 来渲染相对动态的 Taro DOM 树。我们使用了模板拼接的方式，根据运行时提供的 DOM 树数据结构，各 templates 递归地相互引用，最终可以渲染出对应的动态 DOM 树。
![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/4HRwnY.png)

这里先看一个比较简单的 view 模板实例。上方是一个 view 组件模板，首先我们需要在 template 里面写一个 view，然后把它所有的属性全部列出来（把所有的属性都列出来是因为小程序里面不能去动态地添加属性)。接下来是遍历渲染所有子节点，这些子节点首先会去引用中间层模板，然后中间层模板会根据对应的 nodeName，再去找到对应的组件模板。通过这样的方式把模板一步一步拼接起来，就可以渲染出我们动态的 DOM 树。

### 适配 React

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/JHaVBu.png)

接下来看一下怎么样去适配 React。React 架构主要分为 React Core、Reconcliers、Renderers，但是 React DOM 渲染器的体积比较大，里面有很多兼容性代码，放到小程序里面的话就太大了。因此我们就想自己去实现一个渲染器，我们可以提供一个 hostConfig 以对接 Taro DOM 的各 API，从而去实现一个小程序的渲染器。

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/16C2Xx.png)

接下来看一下 React 的整体的渲染流程。首先 React 会使用 taro-react 这个包里面提供的小程序的渲染器，然后再配合 taro-runtime 里面的 createReactPage 函数，去把页面渲染出对应的 Taro DOM 树，然后我们会对 Taro DOM 树做一个 Hydrate 操作，得到需要 setData 的数据，然后进行 setData，视图层会根据这些 data 数据对所有的模板进行拼接，从而渲染出对应的页面。

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/Ixbi6v.png)

其中，每个模块发挥的作用如上图。

- react-core 是react 的核心，提供 jsx 等核心 api 给开发者使用
- react-reconciler 内部基于“双缓存”的调和机制维护了Fiber组件树，并完整实现了Diff算法，决定何时更新、更新什么；并且react抽离了协调器逻辑，用于编写自定义渲染器。
- Renderer 则具体实现客户端的渲染，以及DOM事件处理；react-dom是浏览器端的Renderer，调用DOM、BOM API来渲染界面。但在小程序环境中，则行不通。

### 适配 Vue

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/FXZKWz.png)

接下来看一下 Vue 的渲染流程。因为 Vue 这边并没有很多冗余代码，因此我们可以直接使用，Vue 同样需要配合 taro-runtime 包里面的 createVuePage 方法，把页面渲染出一个 Taro DOM 树，然后进行 setData，在视图层对这些模板拼接，最终渲染出对应页面。

### Taro3 小程序端架构

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/pAGTil.png)

接下来看一下 Taro Next 小程序端的整体架构。首先是用户的 React 或 Vue 的代码会通过 CLI 进行 Webpack 打包，其次在运行时我们会提供 React 和 Vue 对应的适配器进行适配，然后调用我们提供的 DOM 和 BOM API，最后把整个程序渲染到所有的小程序端上面。

### H5端架构

![image.png](https://kxf-oss.oss-cn-hangzhou.aliyuncs.com/blog/xnuh0r.png)

再来看一下 H5 端的架构，同样的也是需要把用户的 React 或者 Vue 代码通过 Webpack 进行打包。然后在运行时我们需要去做三件事情：第一件事情是我们需要去实现一个组件库，组件库需要同时给到 React 、Vue 甚至更加多的一些框架去使用，因此我们就使用了 Stencil 去实现了一个基于 WebComponents 且遵循微信小程序规范的组件库，第二、三件事是我们需要去实现一个小程序规范的 API 和路由机制，最终我们就可以把整个程序给运行在浏览器上面。

## 写在最后

关于 Taro3 的性能，因为使用了 template 嵌套的方式，当应用的体积越大，Taro3 反而会比原生小程序体积更小。另外对于 Taro 3 本身在性能存在劣势的场景，Taro 官方团队已经给出了相应的解决方案来应对。比如，提升首次渲染速度，我们可以使用[预渲染](https://taro-docs.jd.com/taro/docs/prerender)；对于无限滚动加载的列表场景，我们提供了[虚拟列表组件](https://taro-docs.jd.com/taro/docs/virtual-list)。



