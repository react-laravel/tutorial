# 服务提供者和路由加载

路由不是在 `bootstrap/app.php` 里立刻加载的，而是在应用 boot 过程中加载。

## withRouting 先保存路由加载闭包

`ApplicationBuilder::withRouting()` 调用：

```text
RouteServiceProvider::loadRoutesUsing($using)
```

这会把 `$using` 闭包保存在 `RouteServiceProvider` 的静态属性 `alwaysLoadRoutesUsing` 上。

当前闭包的核心动作是：

```text
Route::middleware('web')->group(routes/web.php)
```

它表示：加载 `routes/web.php`，并给里面的路由套上 `web` 中间件组。

## withRouting 还注册 booting 回调

`withRouting()` 还做了：

```text
$app->booting(function () {
    $app->register(RouteServiceProvider::class, force: true)
})
```

意思是：应用 boot 的时候，强制注册 Laravel 的 RouteServiceProvider。

## RouteServiceProvider::register

文件：`Illuminate\Foundation\Support\Providers\RouteServiceProvider`

它的 `register()` 方法不是立即加载路由，而是注册一个 `booted` 回调：

1. 设置根控制器命名空间。
2. 如果路由已缓存，加载缓存路由文件。
3. 否则调用 `loadRoutes()`。
4. 再注册一个 app booted 回调刷新路由 name/action 查找表。

## loadRoutes

`loadRoutes()` 会执行两个可能来源：

- 静态的 `alwaysLoadRoutesUsing`，也就是 `ApplicationBuilder::withRouting()` 保存的闭包。
- 实例上的 `loadRoutesUsing`，用于传统 provider 写法。

当前项目走第一种。

## Route Facade 如何转到 Router

`Route` Facade 文件在 `Illuminate\Support\Facades\Route`。

它的 `getFacadeAccessor()` 返回字符串：

```text
router
```

Facade 的 `__callStatic()` 会把静态调用转给容器里的 `router` 实例。

所以：

```php
Route::get('/', $closure)
```

实际效果接近：

```php
app('router')->get('/', $closure)
```

而 `router` 单例来自 `RoutingServiceProvider::registerRouter()`：

```text
new Router($app['events'], $app)
```

下一章进入 `routes/web.php` 的路由注册。
