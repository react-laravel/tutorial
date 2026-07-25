# Application::configure 做了什么

文件：`vendor/laravel/framework/src/Illuminate/Foundation/Application.php`

`bootstrap/app.php` 里第一步是：

```php
Application::configure(basePath: dirname(__DIR__))
```

## configure 的执行顺序

`configure` 的主线可以拆成两段。

第一段确定根路径：

- 如果传入了字符串 `basePath`，直接使用。
- 如果没传，则调用 `inferBasePath()` 从 Composer 注册的 loader 推断项目根路径。

当前项目传入了 `dirname(__DIR__)`，所以不会走推断逻辑。

第二段创建应用并套上默认配置：

```text
new Application($basePath)
ApplicationBuilder(...)
  ->withKernels()
  ->withEvents()
  ->withCommands()
  ->withProviders()
```

返回值是 `ApplicationBuilder`。

## new Application($basePath)

进入构造方法后，Laravel 做四类基础工作。

### 1. setBasePath

如果传入了 `$basePath`，先调用 `setBasePath($basePath)`。

它会：

- 去掉路径末尾的斜杠。
- 调用 `bindPathsInContainer()`。

`bindPathsInContainer()` 会把常用路径放入容器：

- `path`：`app/`
- `path.base`：项目根目录
- `path.config`：`config/`
- `path.database`：`database/`
- `path.public`：`public/`
- `path.resources`：`resources/`
- `path.storage`：`storage/`
- `path.bootstrap`：`bootstrap/`
- `path.lang`：语言目录

这就是后面 `app()->basePath()`、`config_path()`、`storage_path()` 能工作的基础。

### 2. registerBaseBindings

这一段把最基础的对象绑定进服务容器：

- `Container::setInstance($this)` 设置全局容器实例。
- 绑定 `'app' => $this`。
- 绑定 `Container::class => $this`。
- 注册 `Mix` 单例。
- 注册 `PackageManifest` 单例，用来读取 Composer 包发现信息。

从这里开始，`app()` 辅助函数可以拿到这个应用容器。

### 3. registerBaseServiceProviders

Laravel 先注册几个非常基础的服务提供者：

- `EventServiceProvider`
- `LogServiceProvider`
- `ContextServiceProvider`
- `RoutingServiceProvider`

其中 `RoutingServiceProvider` 会注册 `router`、`url`、`redirect`、`response`、`CallableDispatcher` 等路由相关服务。后面 `Route` Facade 和 Router 分发都依赖它。

### 4. registerCoreContainerAliases

这个方法给很多核心服务设置别名。例如某个契约、字符串别名和具体类可以指向同一个容器绑定。这样你可以用不同写法解析同一个服务。

### 5. registerLaravelCloudServices

如果运行在 Laravel Cloud 环境，会注册一些云环境相关监听器。普通本地项目里通常直接返回。

## configure 返回的不是 Application

`Application::configure(...)` 最后返回：

```text
ApplicationBuilder(new Application($basePath))
```

也就是说，`bootstrap/app.php` 后续的 `withRouting`、`withMiddleware`、`withExceptions` 都是在配置这个 builder。最后 `create()` 才把 builder 里的 `$app` 取出来。
