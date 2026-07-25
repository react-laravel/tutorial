# HTTP Kernel 的核心流程

文件：`vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php`

HTTP Kernel 是一次 Web 请求的总调度器。

## 构造方法

Kernel 构造函数需要两个依赖：

```text
Application $app
Router $router
```

容器会自动解析它们。`Router` 来自 `RoutingServiceProvider` 注册的 `'router'` 单例。

构造方法里还会调用 `syncMiddlewareToRouter()`，把 Kernel 里已有的中间件组和别名同步到 Router。

## handle($request)

`handle` 的主线：

1. 记录请求开始时间：`$this->requestStartedAt = Carbon::now()`。
2. 开启 HTTP method override。
3. 调用 `sendRequestThroughRouter($request)`。
4. 如果过程中抛异常，报告异常并渲染异常响应。
5. 派发 `RequestHandled` 事件。
6. 返回 Response。

## sendRequestThroughRouter

这是 Kernel 中最关键的方法。

### 1. 把 request 放进容器

```text
$this->app->instance('request', $request)
```

从这里开始，代码里解析 `request` 或 `Illuminate\Http\Request`，拿到的就是当前请求。

### 2. 清理 Request Facade 缓存

Facade 会缓存已解析实例。请求对象换了之后，需要让 Request Facade 下次重新从容器取。

### 3. bootstrap 应用

```text
$this->bootstrap()
```

如果应用还没有 bootstrap，就按顺序运行六个 bootstrapper：

1. `LoadEnvironmentVariables`
2. `LoadConfiguration`
3. `HandleExceptions`
4. `RegisterFacades`
5. `RegisterProviders`
6. `BootProviders`

下一章单独解释它们：[六个 bootstrapper](../04-bootstrap/01-bootstrappers.md)

### 4. 进入全局中间件管道

```text
(new Pipeline($app))
  ->send($request)
  ->through($this->middleware)
  ->then($this->dispatchToRouter())
```

这就是常说的洋葱模型。请求先经过全局中间件，最后才进入 Router。响应返回时，会按相反方向穿回中间件。

当前骨架中，具体中间件由 `bootstrap/app.php` 的 `withMiddleware` 和 Laravel 默认配置共同决定。

### 5. dispatchToRouter

`dispatchToRouter()` 返回一个闭包。这个闭包会：

1. 再次把当前 request 放进容器。
2. 调用 `$this->router->dispatch($request)`。

从这里进入路由章节：[Router 如何匹配并执行路由](../05-routing/03-route-dispatch.md)
