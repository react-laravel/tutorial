# ApplicationBuilder 链式配置

文件：`vendor/laravel/framework/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php`

`ApplicationBuilder` 是 Laravel 默认骨架里“把配置写在 bootstrap/app.php”的关键。它包着一个已经创建好的 `Application`，然后通过链式方法把功能挂上去。

## configure 默认调用的四个 with

`Application::configure()` 内部已经调用：

```text
withKernels()
withEvents()
withCommands()
withProviders()
```

### withKernels

把接口绑定到默认 Kernel：

- `Illuminate\Contracts\Http\Kernel` => `Illuminate\Foundation\Http\Kernel`
- `Illuminate\Contracts\Console\Kernel` => `Illuminate\Foundation\Console\Kernel`

这是后面 `$app->make(HttpKernelContract::class)` 能解析 HTTP Kernel 的原因。

### withEvents

安排应用 booting 时注册事件服务提供者。如果启用事件发现，也会设置发现路径。

### withCommands

为 Console Kernel 准备命令路径。当前 `withRouting(commands: routes/console.php)` 也会把命令路由文件加入这里。

### withProviders

调用 `RegisterProviders::merge(...)`，把额外 provider 和 `bootstrap/providers.php` 合并到后续注册流程。

当前 `bootstrap/providers.php` 只有：

```php
return [
    App\Providers\AppServiceProvider::class,
];
```

## withRouting

当前调用是：

```php
withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

它的核心逻辑：

1. 如果没有手写 `$using` 闭包，就调用 `buildRoutingCallback(...)` 生成一个。
2. 如果配置了 `health`，让维护模式中间件放行 `/up`。
3. 调用 `RouteServiceProvider::loadRoutesUsing($using)`，把路由加载闭包存到 RouteServiceProvider 的静态属性里。
4. 注册一个 app booting 回调：应用 boot 时强制注册 `RouteServiceProvider`。
5. 如果命令路由文件存在，交给 `withCommands`。

### buildRoutingCallback 生成的闭包会做什么

应用 boot 到加载路由时，这个闭包会执行：

- 如果配置了 API 路由，就按 `api` 中间件和 `api` 前缀加载。
- 如果配置了 `health`，注册 `GET /up` 健康检查路由。
- 如果配置了 Web 路由，就用 `Route::middleware('web')->group($web)` 加载 `routes/web.php`。
- 执行额外路由回调。
- 如果配置了 Folio 页面路由，就加载页面。
- 如果传了 `then` 回调，最后执行它。

当前项目最关键的是：`Route::middleware('web')->group(routes/web.php)`。

## withMiddleware

它没有马上改 Kernel，而是注册 `afterResolving(HttpKernel::class, ...)`：

1. 创建 `Middleware` 配置对象。
2. 默认设置未登录跳转到 `route('login')`。
3. 执行你在 `bootstrap/app.php` 里传入的闭包。当前闭包为空。
4. 把全局中间件、中间件组、别名、优先级同步到 HTTP Kernel。

为什么要等 `afterResolving`？因为 HTTP Kernel 这时可能还没被创建。等容器真正解析 Kernel 时再设置，顺序更稳。

## withExceptions

它把异常处理契约绑定到默认异常处理器：

```text
ExceptionHandler contract => Illuminate\Foundation\Exceptions\Handler
```

如果你在闭包里配置异常报告或渲染逻辑，Laravel 会在异常处理器被解析后应用这些配置。

## create

`create()` 很简单：返回 builder 里的 `$app`。

到这里，应用对象已经准备好，但还没真正 bootstrap。真正的 bootstrap 发生在 HTTP Kernel 处理请求时。
