# bootstrap/app.php 返回 Application

文件：`bootstrap/app.php`

这个文件的任务是构建并配置 Laravel 应用对象，然后把它返回给入口文件。

## use 行

```php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
```

这三行引入短类名：

- `Application`：应用对象，也是服务容器。
- `Exceptions`：异常处理配置包装器。
- `Middleware`：中间件配置包装器。

## return Application::configure(...)

```php
return Application::configure(basePath: dirname(__DIR__))
```

`dirname(__DIR__)` 在这里得到项目根目录。因为当前文件位于 `bootstrap/`，`__DIR__` 是 `项目根目录/bootstrap`，上一层就是项目根目录。

`basePath` 对 Laravel 很重要。后面 `app_path()`、`config_path()`、`storage_path()`、`public_path()` 等路径都是从它推出来的。

`Application::configure(...)` 不直接返回 `Application`，而是返回 `ApplicationBuilder`。所以后面才能继续链式调用。

下一章会进入：[Application::configure 做了什么](02-application-configure.md)

## ->withRouting(...)

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

这里告诉 Laravel：

- Web 路由文件是 `routes/web.php`。
- Artisan 命令路由文件是 `routes/console.php`。
- 健康检查路由是 `/up`。

这一步不会立刻 `require routes/web.php`。它先把“如何加载路由”的闭包保存起来，等应用真正 boot 时再执行。

## ->withMiddleware(...)

```php
->withMiddleware(function (Middleware $middleware): void {
    //
})
```

当前闭包为空，表示使用 Laravel 默认中间件配置，不额外添加或修改。

底层会注册一个 `afterResolving(HttpKernel::class, ...)` 回调：当 HTTP Kernel 被容器解析出来后，把全局中间件、中间件组、别名和优先级设置到 Kernel 上。

## ->withExceptions(...)

```php
->withExceptions(function (Exceptions $exceptions): void {
    //
})
```

当前闭包为空，表示使用默认异常处理配置。

底层会把异常处理契约 `Illuminate\Contracts\Debug\ExceptionHandler` 绑定到 `Illuminate\Foundation\Exceptions\Handler`。

## ->create()

```php
)->create();
```

`create()` 返回真正的 `Application` 实例。到这里，`bootstrap/app.php` 执行完毕，`public/index.php` 里的 `$app` 就拿到了这个对象。

下一步入口文件会执行：

```php
$app->handleRequest(Request::capture());
```
