# 发送响应与结束请求

入口来自：

```text
$kernel->handle($request)->send()
```

这里的 Response 是 Symfony HTTP Foundation Response 的子类或兼容对象。

## Response::send

文件：`vendor/symfony/http-foundation/Response.php`

`send()` 的主线：

1. `sendHeaders()`
2. `sendContent()`
3. 如果允许 flush，则结束 FastCGI / LiteSpeed 请求或刷新输出缓冲。
4. 返回 `$this`。

## sendHeaders

`sendHeaders()` 负责向浏览器发送 HTTP header。

执行逻辑：

1. 如果 header 已经发送过，必要时只补状态行，然后返回。
2. 处理 1xx informational response。
3. 遍历 Response header，例如 `Content-Type`。
4. 发送 cookie header。
5. 发送 HTTP 状态行，例如 `HTTP/1.1 200 OK`。

对 welcome 页面来说，最终通常是 `200 OK` 和 HTML 类型响应。

## sendContent

`sendContent()` 很直接：

```text
echo $this->content
```

也就是把 HTML 字符串输出给 Web 服务器，再由 Web 服务器传给浏览器。

## flush

发送内容后，`send()` 会尝试尽快把响应交给客户端：

- 如果存在 `fastcgi_finish_request()`，调用它。
- 否则如果存在 `litespeed_finish_request()`，调用它。
- 否则在非 CLI 环境关闭输出缓冲并 `flush()`。

这一步让浏览器尽早收到响应，后面的 Laravel terminate 收尾可以继续做。

## Kernel::terminate

`Application::handleRequest` 发送响应后继续：

```text
$kernel->terminate($request, $response)
```

文件：`Illuminate\Foundation\Http\Kernel`

主线：

1. 派发 `Terminating` 事件。
2. 调用 `terminateMiddleware($request, $response)`。
3. 调用 `$app->terminate()`。
4. 如果注册了请求耗时处理器，判断是否超过阈值并执行。
5. 清空请求开始时间。

## terminateMiddleware

Kernel 会收集：

- 当前路由中间件。
- 全局中间件。

然后逐个解析中间件实例。如果中间件有 `terminate($request, $response)` 方法，就调用它。

这类中间件适合做响应发送后的收尾工作。

## Application::terminate

文件：`Illuminate\Foundation\Application`

应用层 terminate 会遍历 `$terminatingCallbacks`，用容器调用每个回调。

执行完这里，一次 `GET /` 请求的 Laravel 主线就结束了。

## 从入口到结束的闭环

回到最初的 `public/index.php`：

```php
$app->handleRequest(Request::capture());
```

这一行返回后，入口文件没有更多代码。PHP 请求生命周期结束，Web 服务器完成本次响应。
