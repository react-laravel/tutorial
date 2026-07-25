# view('welcome') 到 HTML

入口来自 `routes/web.php` 的路由闭包：

```php
return view('welcome');
```

## view 辅助函数

文件：`vendor/laravel/framework/src/Illuminate/Foundation/helpers.php`

`view($view = null, $data = [], $mergeData = [])` 的主线：

1. `$factory = app(ViewFactory::class)` 从容器解析视图工厂。
2. 如果没传参数，返回视图工厂。
3. 如果传了视图名，调用 `$factory->make($view, $data, $mergeData)`。

当前调用 `view('welcome')`，所以会进入 `Factory::make`。

## View Factory::make

文件：`vendor/laravel/framework/src/Illuminate/View/Factory.php`

`make('welcome')` 做：

1. 规范化视图名。
2. 通过 view finder 找到模板路径。
3. 合并传入数据。
4. 创建 `Illuminate\View\View` 实例。
5. 调用 view creator 回调，如果有。
6. 返回 View 对象。

`welcome` 对应的文件是：

```text
resources/views/welcome.blade.php
```

## 闭包返回的是 View，不是字符串

路由闭包返回 `View` 对象后，控制权回到 Router：

```text
Router::prepareResponse($request, $response)
```

这里的 `$response` 现在是 `Illuminate\View\View`。

## Router::toResponse

文件：`vendor/laravel/framework/src/Illuminate/Routing/Router.php`

`toResponse` 会根据返回值类型做转换：

- 如果是 `Responsable`，调用 `toResponse()`。
- 如果是 PSR response，转成 Symfony response。
- 如果是新创建的 Model，转 JSON 201。
- 如果是 `Stringable`，转 HTML Response。
- 如果是数组、Jsonable、Arrayable 等，转 JSON Response。
- 如果还不是 Symfony Response，转普通 HTML Response。

`Illuminate\View\View` 实现了字符串转换能力，所以会被渲染成 HTML 内容，再包进 `Illuminate\Http\Response`。

## View::__toString 与 render

文件：`vendor/laravel/framework/src/Illuminate/View/View.php`

当 View 需要变成字符串时，会调用：

```text
__toString() => render()
```

`render()` 主线：

1. 调用 `renderContents()` 得到模板内容。
2. 如果传了回调，执行回调。
3. 渲染完成后清理 section / stack 等视图状态。
4. 返回字符串内容。

`renderContents()` 会：

1. 增加渲染计数。
2. 执行 view composer。
3. 调用 `getContents()`。
4. 减少渲染计数。

`getContents()` 最终调用视图引擎：

```text
$this->engine->get($this->path, $this->gatherData())
```

对 Blade 文件来说，引擎会把 Blade 编译为 PHP，再执行 PHP 得到 HTML。

## welcome.blade.php 里会发生什么

当前模板里有几个典型 Blade / Laravel 调用：

- `app()->getLocale()`：从应用取当前 locale。
- `config('app.name', 'Laravel')`：读取配置作为 title。
- `@fonts`：Blade 指令。
- `@vite(...)`：如果有 Vite 构建文件或热更新文件，加载前端资源。
- `Route::has('login')`：判断是否有登录路由。
- `@auth` / `@else`：认证状态分支。
- `app()->version()`：输出 Laravel 版本。

当前基础项目没有登录注册路由，所以模板里的登录注册链接分支通常不会显示。

## 回到 Router::prepareResponse

View 被渲染并包装成 Response 后，`prepareResponse` 会调用 Response 的 `prepare($request)`，根据请求方法、协议、header 等修正响应。

最后 Response 回到 HTTP Kernel，再回到 `Application::handleRequest` 的 `->send()`。
