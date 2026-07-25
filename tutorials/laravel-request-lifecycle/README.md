# Laravel 13 启动流程逐行阅读

这套笔记从 `public/index.php` 开始，按一次普通浏览器请求 `GET /` 的真实调用顺序往里追。读法接近 Xdebug 的单步调试：看到 `require`、静态方法、容器解析、路由闭包、视图和响应，就跳到对应文件解释。

## 阅读边界

Laravel 的入口会很快进入 Composer、Symfony、Illuminate 容器、事件、视图、路由等大量源码。为了让人能读完，这套文档遵守一个边界：主线每一步都会追到真正负责行为的方法；底层通用工具，例如数组工具、字符串工具、PHP 扩展 polyfill，只在影响主线时说明，不把每个辅助函数继续无限展开。

本文基于当前项目里的 Laravel `13.8.0` 源码与当前文件内容编写。如果以后 `composer update`，方法位置或细节可能会变。

## 建议阅读顺序

1. [总览：一次请求的调用栈](00-overview/call-stack.md)
2. [入口文件：public/index.php](01-entry/01-public-index.md)
3. [Composer 自动加载](01-entry/02-composer-autoload.md)
4. [bootstrap/app.php 返回 Application](02-application/01-bootstrap-app.md)
5. [Application::configure 做了什么](02-application/02-application-configure.md)
6. [ApplicationBuilder 链式配置](02-application/03-application-builder.md)
7. [Request::capture 捕获 HTTP 请求](03-request/01-request-capture.md)
8. [Application::handleRequest 接管请求](03-request/02-application-handle-request.md)
9. [HTTP Kernel 的核心流程](03-request/03-http-kernel.md)
10. [六个 bootstrapper](04-bootstrap/01-bootstrappers.md)
11. [服务提供者和路由加载](05-routing/01-providers-and-route-loading.md)
12. [routes/web.php 如何注册 GET /](05-routing/02-route-registration.md)
13. [Router 如何匹配并执行路由](05-routing/03-route-dispatch.md)
14. [view('welcome') 到 HTML](06-response/01-view-to-response.md)
15. [发送响应与结束请求](06-response/02-send-and-terminate.md)
16. [源码地图与继续阅读路线](appendix/source-map.md)

## 一句话版主线

浏览器访问 `/`，Web 服务器把请求交给 `public/index.php`；Laravel 加载 Composer 自动加载器，构建 `Application`，捕获当前 HTTP 请求，通过 HTTP Kernel 运行环境加载、配置加载、异常处理、Facade、服务提供者和路由；Router 匹配 `routes/web.php` 里的 `/` 路由，执行闭包返回 `view('welcome')`；视图被渲染成 HTML 响应，Symfony Response 发送 header 和内容，Kernel 再执行终止逻辑。
