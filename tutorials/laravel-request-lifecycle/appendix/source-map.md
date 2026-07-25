# 源码地图与继续阅读路线

这一页列出本文追踪过的关键文件，方便继续打开源码对照阅读。

## 项目入口和配置

- `public/index.php`：Web 请求入口。
- `bootstrap/app.php`：创建并配置 Application。
- `bootstrap/providers.php`：项目自有服务提供者列表。
- `routes/web.php`：Web 路由定义。
- `resources/views/welcome.blade.php`：默认欢迎页模板。

## Composer 自动加载

- `vendor/autoload.php`：Composer 自动加载入口。
- `vendor/composer/autoload_real.php`：创建并注册 ClassLoader。
- `vendor/composer/autoload_static.php`：Composer 生成的 files、classmap、PSR-4 映射。
- `vendor/composer/ClassLoader.php`：真正根据类名找文件的 loader。

## Laravel 应用和容器

- `vendor/laravel/framework/src/Illuminate/Foundation/Application.php`：Laravel 应用对象与容器。
- `vendor/laravel/framework/src/Illuminate/Container/Container.php`：服务容器解析核心。
- `vendor/laravel/framework/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php`：链式应用配置器。

## HTTP 请求和 Kernel

- `vendor/laravel/framework/src/Illuminate/Http/Request.php`：Laravel Request。
- `vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php`：HTTP 请求调度器。
- `vendor/laravel/framework/src/Illuminate/Routing/Pipeline.php`：路由中间件管道。

## bootstrapper

- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/LoadEnvironmentVariables.php`
- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php`
- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php`
- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/RegisterFacades.php`
- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/RegisterProviders.php`
- `vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/BootProviders.php`

## 路由

- `vendor/laravel/framework/src/Illuminate/Routing/RoutingServiceProvider.php`：注册 router、url、response 等服务。
- `vendor/laravel/framework/src/Illuminate/Foundation/Support/Providers/RouteServiceProvider.php`：加载项目路由。
- `vendor/laravel/framework/src/Illuminate/Support/Facades/Route.php`：Route Facade。
- `vendor/laravel/framework/src/Illuminate/Support/Facades/Facade.php`：Facade 静态调用转发。
- `vendor/laravel/framework/src/Illuminate/Routing/Router.php`：注册、匹配、执行路由。
- `vendor/laravel/framework/src/Illuminate/Routing/RouteCollection.php`：路由集合。
- `vendor/laravel/framework/src/Illuminate/Routing/AbstractRouteCollection.php`：匹配失败和备用方法处理。
- `vendor/laravel/framework/src/Illuminate/Routing/Route.php`：单条路由对象。
- `vendor/laravel/framework/src/Illuminate/Routing/CallableDispatcher.php`：执行闭包路由。

## 视图和响应

- `vendor/laravel/framework/src/Illuminate/Foundation/helpers.php`：`app()`、`view()`、`config()` 等辅助函数。
- `vendor/laravel/framework/src/Illuminate/View/Factory.php`：创建 View 实例。
- `vendor/laravel/framework/src/Illuminate/View/View.php`：渲染视图。
- `vendor/symfony/http-foundation/Response.php`：发送 HTTP header 和 body。

## 建议下一轮深入

如果已经读完主线，下一步可以按兴趣继续：

1. 深入服务容器：从 `Application::make` 追到 `Container::resolve` 和 `build`。
2. 深入中间件：打开 `Illuminate\Foundation\Configuration\Middleware`，看默认 web/api 组怎么组成。
3. 深入 Blade：从 `View::getContents` 追到 Blade 编译器和缓存文件。
4. 深入异常：从 `Http\Kernel::handle` 的 catch 追到 `Exceptions\Handler::render`。
5. 深入配置缓存：执行 `php artisan config:cache` 后再比较 bootstrapper 路径。

下面把这五条展开成更具体的继续阅读路线。

### 1. 服务容器：make 如何变成对象

建议从一个已经熟悉的调用开始，例如 `view()` 辅助函数里的：

```text
app(ViewFactory::class)
```

这会进入 `Application::make`，再进入 `Container::make`。

主线可以这样追：

1. `Illuminate\Foundation\Application::make`：先检查要解析的服务是不是 deferred service。如果是，会先加载对应的 deferred provider。
2. `Illuminate\Container\Container::make`：只是把工作交给 `resolve`。
3. `Container::resolve`：处理别名、上下文绑定、已有 singleton 实例、具体实现、扩展器和 resolving 回调。
4. `Container::getConcrete`：如果容器里没有显式绑定，就把类名本身当作 concrete，尝试自动构建。
5. `Container::isBuildable`：判断当前 concrete 是不是可以直接 `build`，否则递归 `make` 另一个 abstract。
6. `Container::build`：用反射读取构造函数参数，递归解析依赖，最后 `new $concrete(...$instances)`。

读这一段时，重点看三个分岔：

- 已经有 `$this->instances[$abstract]`：直接返回 singleton。
- 有 binding：用 binding 里的 `concrete`。
- 没有 binding：靠反射自动创建类。

可以用 `app('router')`、`app('view')`、`app(\Illuminate\Contracts\View\Factory::class)` 分别对照。字符串服务名通常依赖 provider 提前绑定；具体类名则更容易走到反射自动构建。

### 2. 中间件：默认 web/api 组从哪里来

入口在 `bootstrap/app.php`：

```php
->withMiddleware(function (Middleware $middleware): void {
    //
})
```

这里传进来的 `Middleware` 是 `Illuminate\Foundation\Configuration\Middleware`，它不是实际执行请求的管道，而是一个配置收集器。

继续追 `ApplicationBuilder::withMiddleware`：

1. 注册一个 `afterResolving(HttpKernel::class, ...)` 回调。
2. 当 HTTP Kernel 被容器解析出来后，创建新的 `Middleware` 配置对象。
3. 执行用户在 `bootstrap/app.php` 里传入的回调。
4. 调用 `$kernel->setGlobalMiddleware(...)`。
5. 调用 `$kernel->setMiddlewareGroups(...)`。
6. 调用 `$kernel->setMiddlewareAliases(...)`。
7. 最后由 `Http\Kernel::syncMiddlewareToRouter` 把组和别名同步到 Router。

默认组在 `Middleware::getMiddlewareGroups` 里生成。

`web` 组默认包含：

1. `EncryptCookies`
2. `AddQueuedCookiesToResponse`
3. `StartSession`
4. `ShareErrorsFromSession`
5. `PreventRequestForgery`
6. `SubstituteBindings`
7. 可选的 `auth.session`

`api` 组默认包含：

1. 可选的 Sanctum stateful middleware
2. 可选的 `throttle:...`
3. `SubstituteBindings`

所以项目里 `routes/web.php` 被 `Route::middleware('web')->group(...)` 包起来后，请求执行路由闭包之前，会先经过这些中间件。

如果要看自定义如何合并，重点读 `Middleware::web`、`Middleware::api`、`modifyGroup`、`getGlobalMiddleware`、`getMiddlewareAliases`。`append`、`prepend`、`remove`、`replace` 最后都是在这些 getter 里合并成最终数组。

### 3. Blade：模板如何变成缓存 PHP

主线已经追到 `View::getContents`：

```text
$this->engine->get($this->path, $this->gatherData())
```

对 `.blade.php` 文件来说，这里的 engine 是 `Illuminate\View\Engines\CompilerEngine`。

继续追：

1. `ViewServiceProvider::registerBladeCompiler`：注册容器服务 `blade.compiler`，实际对象是 `BladeCompiler`。
2. `ViewServiceProvider::registerBladeEngine`：注册 `blade` 引擎，实际对象是 `CompilerEngine`。
3. `CompilerEngine::get`：判断模板是否过期，必要时调用 `$this->compiler->compile($path)`。
4. `Compiler::isExpired`：比较原始 Blade 文件和编译后缓存文件的修改时间。
5. `BladeCompiler::compile`：读取 Blade 文件，调用 `compileString` 编译成 PHP 字符串，再写入缓存文件。
6. `Compiler::getCompiledPath`：根据原始模板路径算出缓存文件名。
7. `PhpEngine::evaluatePath`：`require` 编译后的 PHP 文件，用输出缓冲拿到 HTML。

这里最值得看的是 `BladeCompiler::compileString`。它大致按这个顺序处理：

1. 暂存不该编译的原始块。
2. 编译 Blade 注释和组件标签。
3. 执行预编译器。
4. 用 `token_get_all` 分词。
5. 遇到 HTML token 时继续编译 echo、条件、循环、section、include 等 Blade 语法。
6. 把 footer 片段追加回去。

实际缓存文件通常落在：

```text
storage/framework/views
```

可以先访问一次 `/`，再打开这个目录里的缓存 PHP 文件，对照 `resources/views/welcome.blade.php` 看 `@vite`、`@auth`、`{{ ... }}` 分别被编译成什么 PHP。

### 4. 异常：catch 之后如何变成响应

入口在 `Illuminate\Foundation\Http\Kernel::handle`：

```text
try {
    $response = $this->sendRequestThroughRouter($request);
} catch (Throwable $e) {
    $this->reportException($e);
    $response = $this->renderException($request, $e);
}
```

继续追：

1. `Kernel::reportException`：调用容器里的 `ExceptionHandler::class`，执行 `report($e)`。
2. `Exceptions\Handler::report`：先 `mapException`，再检查 `shouldntReport`，最后交给 logger。
3. `Kernel::renderException`：调用 `ExceptionHandler::render($request, $e)`。
4. `Handler::render`：优先尝试异常自己的 `render` 方法、`Responsable`、用户注册的 render 回调。
5. `Handler::prepareException`：把一些框架异常转换成 HTTP 异常，例如 model not found 变成 404。
6. `Handler::renderExceptionResponse`：判断返回 JSON 还是 HTML。
7. `Handler::prepareResponse`：在 debug 模式下生成详细错误页；非 debug 或 HTTP 异常则生成对应状态码响应。

Laravel 13 的异常配置入口也在 `bootstrap/app.php`：

```php
->withExceptions(function (Exceptions $exceptions): void {
    //
})
```

这个 `Exceptions` 配置对象会把 `report`、`render`、`respond` 等回调注册到底层 `Handler`。所以如果你想理解“项目自定义异常处理为什么生效”，可以从 `ApplicationBuilder::withExceptions` 继续追到 `Illuminate\Foundation\Configuration\Exceptions`。

一个好验证方法是临时在 `routes/web.php` 里让 `/` 抛出异常，然后分别观察：

1. `APP_DEBUG=true` 时的错误页。
2. `APP_DEBUG=false` 时的 500 页面。
3. 请求头包含 `Accept: application/json` 时的 JSON 响应。

### 5. 配置缓存：bootstrapper 路径如何改变

先看没有缓存时的路径：

1. `LoadEnvironmentVariables::bootstrap` 读取 `.env`。
2. `LoadConfiguration::bootstrap` 读取 `config/*.php`。
3. 创建 `Illuminate\Config\Repository`，绑定为容器里的 `config`。
4. 后续代码通过 `config('app.name')` 从 repository 取值。

执行：

```bash
php artisan config:cache
```

会进入 `Illuminate\Foundation\Console\ConfigCacheCommand::handle`：

1. 先调用 `config:clear` 删除旧缓存。
2. `getFreshConfiguration` 重新加载一份干净的应用。
3. 让 Console Kernel 执行 bootstrap，得到完整配置数组。
4. 把数组用 `var_export` 写入 `bootstrap/cache/config.php`。
5. 立刻 `require` 一次缓存文件，验证配置能被 PHP 正常加载。

有缓存后，请求启动会发生两个明显变化：

1. `LoadEnvironmentVariables::bootstrap` 发现 `configurationIsCached()` 为 true，直接返回，不再加载 `.env`。
2. `LoadConfiguration::bootstrap` 直接 `require bootstrap/cache/config.php`，不再逐个读取 `config/*.php`。

这也是为什么配置缓存后，不应该在业务代码里直接依赖 `env()`。缓存生成时，`.env` 的结果已经被写进配置数组；请求运行时 `.env` 不一定会再次加载。

读完后记得执行：

```bash
php artisan config:clear
```

把 `bootstrap/cache/config.php` 清掉，避免后续阅读时被缓存状态影响。
