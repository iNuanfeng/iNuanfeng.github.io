# Node.js：深入浅出 http 与 stream

## 前言

> stream（流）是Node.js提供的又一个仅在服务区端可用的模块，流是一种抽象的数据结构。Stream 是一个抽象接口，Node 中有很多对象实现了这个接口。例如，对http 服务器发起请求的request 对象就是一个 Stream，还有stdout（标准输出流）。

通过本文，你会知道 stream 是什么，以及 strem 在 http 服务中发挥着什么作用。

## 一、stream（流）是什么

### 1.1 举个栗子

假设楼上有一桶水，想倒往楼下的水桶。直接往下倒，肯定会洒出来，那么在两个水桶间加一根管子（pipe），就可以让楼上的水，逐渐地流到楼下的水桶内：

<img src="http://yun.inuanfeng.com/blog/KaoDII.jpg" alt="a1" style="zoom:50%;" />

### 1.2 为什么要使用 stream

看了前面稍微了解 Node.js 的同学可能就要问了，流的作用不就是传递数据麽，也就是把一个地方数据拷贝到另一个地方，不用流也可以这样实现：

```
var water = fs.readFileSync('a.txt', {encoding: 'utf8'});
fs.writeFileSync('b.txt', water);
```



但这样做有个致命问题：

> 处理数据量较大的文件时不能分块处理，导致速度慢，内存容易爆满。

```
const rs = fs.createReadStream('a.mp4')
const ws = fs.createWriteStream('b.mp4')
rs.pipe(ws) // pipe自动调用了 data, end 等事件
```

### 1.3 小结

其实 stream 不仅可以用来处理文件，它可以处理任何一种数据提供源。下面来看看 stream 在 http 服务中，扮演着什么样的角色。

## 二、深入 http 模块

先来几个灵魂拷问：

- 浏览器发起 http 请求，它属于流吗？
- Node.js 的 Koa 框架，是基于流的吗？
- 接口转发时，能用流来处理吗？

下面一步步来深入了解 Node.js 的 http 服务。

### 2.1 Nodejs 中的 http 模块

> Node 可以不需要 Apache、Nginx、IIS，自身就可以搭建可靠的 http 服务。

创建一个简单的 http 服务：

```
const http = require('http');

const server = http.createServer(function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/html;charset=UTF-8"
  })
  res.end("欢迎来到推啊！！！")
})

server.listen(3000, function () {
  console.log('listening port 3000')
})
```

### 2.2 http.createServer 发生了什么？

> Node 是如何监听 http 请求的，内部的处理机制是什么。

http.createServer() 方法返回的是 http 模块封装的一个基于事件的 http 服务器。

http.createServer() 封装了 http.Server()

```
const http = require('http');
const server = new http.Server();

server.on('request', function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/html;charset=UTF-8"
  })
  res.end("欢迎来到推啊！！！")
})

server.listen(3000, function () {
  console.log('listening port 3000');
});
```

Koa 框架的本质是在 http 模块的上层，封装了自己的 ctx 对象，以及实现了洋葱模型的中间件体系。

![a2](http://yun.inuanfeng.com/blog/2kawKc.jpg)

### 2.3 进一步了解 http 模块

> Node.js 中的 HTTP 接口旨在支持传统上难以使用的协议的许多特性。 特别是，大块的、可能块编码的消息。 接口永远不会缓冲整个请求或响应，用户能够流式传输数据。
>
> 为了支持所有可能的 HTTP 应用程序，Node.js 的 HTTP API 都非常底层。 它仅进行流处理和消息解析。

http.Server() 是基于事件的，主要事件有：

- request：最常用的事件，当客户端请求到来时，该事件被触发，提供req和res参数，表示请求和响应信息。
- connection：当Tcp连接建立时，该事件被触发，提供一个socket参数，是 net.Socket 的实例。
- close

那么，http 模块是如何监听获取浏览器发来的请求呢？

这就需要进一步看看 Node.js 中，http 模块是如何实现的了。

### 2.4 http 的下层：net 模块

> http.Server 继承自: <net.Server>
>
> net 模块用于创建基于流的 TCP 或 IPC 的服务器（net.createServer()）与客户端（net.createConnection()）

创建 TCP 服务：

```
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' 监听器。
  console.log('客户端已连接');
  c.on('end', () => {
    console.log('客户端已断开连接');
  });
  c.write('你好\r\n');
  c.pipe(c);
});
server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('服务器已启动');
});
```

telnet 进行测试：

![a3](http://yun.inuanfeng.com/blog/5OTMCL.jpg)

> 需要注意的是，net 模块创建出来的是一个 TCP 服务，而它监听接受到的数据，是一个 stream（流）

net 模块接收到的内容是没法直接打印的，需要通过 strema 的方式来处理。

下面代码接受并打印浏览器请求：

```
const net = require('net');
const fs = require('fs');

const server = net.createServer((c) => {
  let stream = fs.createWriteStream('test.txt');
  c.pipe(stream).on('finish', () => {
    console.log('Done');
  });
  c.on('error', (err) => {
    console.log(err);
  });
})

server.listen('4000', () => {
  console.log('服务器已启动');
});
```

在浏览器输入 localhost:4000 后，在服务端目录下生成 test.txt 文件：

```
GET / HTTP/1.1
Host: localhost:4000
Connection: keep-alive
Cache-Control: max-age=0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ko;q=0.6
Cookie: UM_distinctid=16e3ab5c769669-0aa68fde01b9b3-37647e05-13c680-16e3ab5c76a1ec; _9755xjdesxxd_=32; gdxidpyhxdE=6EK5fbKotSpp2Uiam1adlQW2uSUV%2FlvMMzX0Lo2iqcBIdSnV4Gf2CIYG2LZevagi2DhNAVlVmPjg4WyCs0EXamAO%2B3tQHgmnyrEj14hrmaV6Ev2MHAdWnIR9giTvXoIlRicy1MhUZ007j%5C%5C84xvU4PmLl0sEbHlkQ4Tvefuj9Ri%2B6D%2FZ%3A1574856606158; YD00636840014594%3AWM_NI=dKC1nbSYkvmP3bFoHMIDoTTp82bhdKlE9PKhaaJmK%2FO5hJLvRckcK9ONax49iBl7ML0AK8sRz90Qd%2Bexn2ABVSxcFOebaImloWcpuWVLQ8eRrrbgDEaIMdym983xRZqnV1c%3D; YD00636840014594%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eeafd83a8aea9dd7ed5ca9b88ba3d44a828e8faaf23d8ab3ff9bec7c86b7a7d0b12af0fea7c3b92aa8958dd2ed6a9187a597f05cf1be8a90cb478b9ca1b5d77cfceeae89e741b09bf7b1ca64a3bf868eca258deba8abcf7e92bda584ca338d92af99b733ab9ea4d8d048f49f85d9f25abae700b2e721a7a8a2d3c44a968db884c545a7beafaaf068ad89ad91f85d96949fd9e85ab2aeae88c74fa3978385fc67fbe8fd99d152b3b29ad2e237e2a3; YD00636840014594%3AWM_TID=PZ3AtyPUGXFABQFEABZp7I3hmitUyn7z; CNZZDATA1278176396=591860064-1572943020-%7C1574943751; _yapi_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjI4LCJpYXQiOjE1NzY0NjQzMjIsImV4cCI6MTU3NzA2OTEyMn0.EEdBvJMRnnu2-_qli_Jqc2D6CtxocEzZjEz_hWv4qEk; _yapi_uid=28
```

### 2.5 http 服务的完整链路

> 梳理一下 http 服务的整个调用链路：

1. Nodejs 创建 http 服务，内部其实是继承了 net.Server 模块。
2. net 模块内部实际上是使用了 TCP 和 Stream 模块，绑定 TCP 端口后，将数据以流的形式，通过 connection 事件回调给 http 模块。
3. http 模块接收到 stream 后，调用 httpParser 解析，回调给 request 事件。

![a4](http://yun.inuanfeng.com/blog/gc34hM.jpg)

- net 模块主要做的事情，就是启动 TCP 服务，将监听到的请求信息，通过 connection 回调给 http 模块。
- http 模块主要做的就是在 connection 回调中解析报文数据，然后触发业务中的 request 回调，提供给开发者使用。

## 三、应用中的 stream

> 在深入了解 http 模块内部的基本原理后，可以想想我们在应用场景中，可以利用 stream（流）做到哪些事情

可以尝试自己实现一下平时接触到的一些应用，如：

- http-proxy-middleware转发中间件
- 大文件流式上传服务
- 流媒体播放服务
- ......