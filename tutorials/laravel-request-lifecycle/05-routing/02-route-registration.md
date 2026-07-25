# routes/web.php 如何注册 GET /

文件：`routes/web.php`

当前内容很短：

```php
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
```

## use Route

```php
use Illuminate\Support\Facades\Route;
```

引入 Route Facade 的短类名。这个 Facade 会把静态调用转发给容器里的 `router`。

## Route::get('/', ...)

调用链：

```text
Route::__callStatic('get', ['/', $closure])
  getFacadeRoot() => app('router')
  Router::get('/', $closure)
```

`Router::get($uri, $action)` 会调用：

```text
addRoute(['GET', 'HEAD'], $uri, $action)
```

所以一个 GET 路由也会自动响应 HEAD 请求。

## Router::addRoute

`addRoute($methods, $uri, $action)` 做两步：

1. `createRoute($methods, $uri, $action)` 创建 `Route` 对象。
2. `$this->routes->add($route)` 把它放进路由集合。

## Router::createRoute

当前 action 是闭包，不是控制器字符串，所以不会走控制器转换。

然后 Laravel 创建新路由：

```text
new Route(['GET', 'HEAD'], '/', $closure)
```

因为这个路由是在 `Route::middleware('web')->group(...)` 里加载的，所以还会把 group 属性合并进 route：它会带上 `web` 中间件组。

## RouteCollection::add

路由集合会把 route 放入几个结构：

- 按 HTTP method 分组的路由表。
- 扁平的所有路由表。
- 路由名查找表，如果有 name。
- 控制器 action 查找表，如果是控制器。

当前 `/` 路由没有名字，也不是控制器，所以主要进入 GET/HEAD 路由表。

## 闭包此时不会执行

`function () { return view('welcome'); }` 在路由注册阶段只是被保存起来。它要等浏览器请求真正匹配到 `/` 时才执行。

下一章：[Router 如何匹配并执行路由](03-route-dispatch.md)
