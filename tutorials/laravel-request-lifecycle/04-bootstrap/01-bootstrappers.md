# 六个 bootstrapper

HTTP Kernel 在第一次处理请求时执行：

```text
$app->bootstrapWith($this->bootstrappers())
```

文件：`vendor/laravel/framework/src/Illuminate/Foundation/Application.php`

`bootstrapWith` 会遍历每个 bootstrapper：

1. 派发 `bootstrapping: 类名` 事件。
2. `$this->make($bootstrapper)->bootstrap($this)`。
3. 派发 `bootstrapped: 类名` 事件。

下面按执行顺序看。

## 1. LoadEnvironmentVariables

文件：`Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables`

它负责加载 `.env`。

执行逻辑：

1. 如果配置已经缓存，直接返回。因为缓存配置里已经包含环境变量读取结果。
2. 检查是否有特定环境文件，例如 `.env.local` 或命令行 `--env` 指定的文件。
3. 创建 Dotenv 实例。
4. `safeLoad()` 安全加载环境变量。
5. 如果 `.env` 格式无效，输出错误并结束。

这一步之后，`env('APP_NAME')`、`env('DB_HOST')` 等才有来源。

## 2. LoadConfiguration

文件：`Illuminate\Foundation\Bootstrap\LoadConfiguration`

它负责构建 `config` 仓库。

执行逻辑：

1. 如果存在配置缓存文件，直接 `require` 缓存。
2. 把 `config_loaded_from_cache` 标记放入容器。
3. 创建 `Illuminate\Config\Repository` 并绑定为 `config`。
4. 如果没有走缓存，就读取 `config/*.php`。
5. 合并 Laravel 框架默认配置和项目配置。
6. 根据 `config('app.env')` 检测当前环境。
7. 设置 PHP 默认时区。
8. 设置内部编码为 UTF-8。

这一步之后，`config('app.name')`、`config('database.default')` 等可用。

## 3. HandleExceptions

文件：`Illuminate\Foundation\Bootstrap\HandleExceptions`

它负责接管 PHP 错误和异常。

执行逻辑：

1. 预留一小块内存，避免内存耗尽时完全无法渲染错误。
2. 保存当前 `$app`。
3. `error_reporting(-1)` 开启错误报告。
4. 注册 PHP error handler，把普通错误转为 `ErrorException`。
5. 注册 exception handler，处理未捕获异常。
6. 注册 shutdown function，处理 fatal error。
7. 非 testing 环境关闭 `display_errors`。

所以 Laravel 的异常页面、日志报告、JSON 错误响应，都从这里开始接管。

## 4. RegisterFacades

文件：`Illuminate\Foundation\Bootstrap\RegisterFacades`

它负责让 `Route::get()`、`View::make()`、`Config::get()` 这类 Facade 可用。

执行逻辑：

1. 清空 Facade 已解析实例缓存。
2. 把当前 `$app` 设置为 Facade 的应用容器。
3. 注册类别名加载器。别名来自 `config('app.aliases')` 和 Composer 包 manifest。

这一步之后，`Illuminate\Support\Facades\Route` 可以把静态调用转发到容器里的 `router` 服务。

## 5. RegisterProviders

文件：`Illuminate\Foundation\Bootstrap\RegisterProviders`

它负责注册服务提供者。

执行逻辑：

1. 如果配置不是从缓存加载的，合并额外 providers。
2. 读取 `bootstrap/providers.php`，当前包含 `App\Providers\AppServiceProvider`。
3. 合并 Laravel 默认 providers、额外 providers、包发现 providers。
4. 调用 `$app->registerConfiguredProviders()`。

`Application::registerConfiguredProviders()` 会使用 `ProviderRepository` 加载 provider。Laravel 默认 providers 包括缓存、数据库、队列、Session、Validation、View 等常用服务。

## 6. BootProviders

文件：`Illuminate\Foundation\Bootstrap\BootProviders`

这个 bootstrapper 很短，只做一件事：

```text
$app->boot()
```

`Application::boot()` 会：

1. 如果已经 boot，直接返回。
2. 执行 booting 回调。
3. 遍历所有 service provider，调用它们的 `boot()`。
4. 标记 `$booted = true`。
5. 执行 booted 回调。

路由加载就是在这一阶段发生的：`ApplicationBuilder::withRouting()` 注册过 booting 回调，强制注册 `RouteServiceProvider`；`RouteServiceProvider` 又在 booted 回调中加载 `routes/web.php`。
