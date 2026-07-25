# Application::handleRequest 接管请求

文件：`vendor/laravel/framework/src/Illuminate/Foundation/Application.php`

入口来自：

```php
$app->handleRequest(Request::capture());
```

## handleRequest 的三步

`handleRequest(Request $request)` 的主线非常清楚：

```text
$kernel = $this->make(HttpKernelContract::class)
$response = $kernel->handle($request)->send()
$kernel->terminate($request, $response)
```

## 第一步：从容器解析 HTTP Kernel

```php
$kernel = $this->make(HttpKernelContract::class);
```

`Application` 继承自 `Container`，所以 `$this->make(...)` 是服务容器解析。

为什么能解析 `HttpKernelContract::class`？因为前面 `ApplicationBuilder::withKernels()` 已经注册过：

```text
Illuminate\Contracts\Http\Kernel => Illuminate\Foundation\Http\Kernel
```

容器解析时会：

1. 查别名和绑定。
2. 找到具体类 `Illuminate\Foundation\Http\Kernel`。
3. 通过反射解析构造函数依赖。
4. 构造 Kernel。
5. 如果它是 singleton，缓存实例。
6. 触发 resolving / afterResolving 回调。

这里的 `afterResolving` 很关键：`withMiddleware()` 注册的回调会在 Kernel 被解析后执行，把中间件配置写入 Kernel。

## 第二步：Kernel 处理请求并发送响应

```php
$response = $kernel->handle($request)->send();
```

这行是链式调用：

1. `$kernel->handle($request)` 返回 Response 对象。
2. `->send()` 发送 HTTP header 和 body。
3. `send()` 的返回值仍是 Response，所以赋给 `$response`。

下一章进入：[HTTP Kernel 的核心流程](03-http-kernel.md)

## 第三步：终止请求

```php
$kernel->terminate($request, $response);
```

响应发送给浏览器后，Laravel 还会执行一些收尾工作：

- 触发 terminating 事件。
- 调用可终止中间件的 `terminate` 方法。
- 执行应用注册的 terminating 回调。
- 记录请求生命周期耗时处理器。

终止逻辑不会改变浏览器已经收到的响应，它主要用于后台收尾。
