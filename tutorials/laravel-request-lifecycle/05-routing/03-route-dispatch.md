# Router 如何匹配并执行路由

入口来自 HTTP Kernel 的 `dispatchToRouter()`：

```text
$router->dispatch($request)
```

文件：`vendor/laravel/framework/src/Illuminate/Routing/Router.php`

## Router::dispatch

执行两步：

1. `$this->currentRequest = $request` 保存当前请求。
2. `return $this->dispatchToRoute($request)`。

## dispatchToRoute

```text
runRoute($request, findRoute($request))
```

也就是先找路由，再运行路由。

## findRoute

`findRoute($request)` 做这些事：

1. 派发 `Routing` 事件。
2. `$this->routes->match($request)` 从路由集合中找匹配项。
3. 把匹配到的 route 存到 `$this->current`。
4. 给 route 设置容器。
5. 把 `Illuminate\Routing\Route::class` 实例放入容器。
6. 返回 route。

## RouteCollection::match

文件：`Illuminate\Routing\RouteCollection`

`match` 的逻辑：

1. 根据请求方法取候选路由，例如 GET 请求取 GET 路由表。
2. `matchAgainstRoutes` 遍历候选路由，调用 `$route->matches($request)`。
3. 找到匹配路由后，`handleMatchedRoute` 调用 `$route->bind($request)`。
4. 如果当前方法没有匹配，但其他 HTTP 方法匹配同一路径，则抛 Method Not Allowed。
5. 如果完全没匹配，抛 Not Found。

对于 `GET /`，它会匹配 `routes/web.php` 注册的 `/` 路由。

## runRoute

找到 route 后，`runRoute($request, $route)` 做：

1. 给 Request 设置 route resolver。之后 `$request->route()` 可以拿到当前 route。
2. 派发 `RouteMatched` 事件。
3. 调用 `runRouteWithinStack($route, $request)`。
4. 把结果交给 `prepareResponse` 转成标准 Response。

## runRouteWithinStack

这里是路由中间件管道：

1. 判断是否禁用中间件。
2. 收集当前 route 的中间件。当前 `/` 路由来自 `web` 组。
3. 创建 `Illuminate\Routing\Pipeline`。
4. 请求穿过路由中间件。
5. 最后执行 `$route->run()`。

## Route::run

文件：`Illuminate\Routing\Route`

当前路由 action 是闭包，不是控制器，所以：

```text
runCallable()
```

`runCallable()` 会取出保存的闭包，然后通过容器里的 `CallableDispatcher` 执行。

## CallableDispatcher::dispatch

文件：`Illuminate\Routing\CallableDispatcher`

它会：

1. 根据闭包参数和路由参数解析依赖。
2. 调用闭包。

当前闭包没有参数，所以直接执行：

```php
return view('welcome');
```

下一章进入视图：[view('welcome') 到 HTML](../06-response/01-view-to-response.md)
