# 总览：一次请求的调用栈

这里先给完整路线图，后面章节逐段解释。

## 主线调用栈

```text
public/index.php
  define('LARAVEL_START', microtime(true))
  file_exists(storage/framework/maintenance.php)
  require vendor/autoload.php
    vendor/composer/autoload_real.php
      require platform_check.php
      require ClassLoader.php
      require autoload_static.php
      $loader->register(true)
      require Composer files，包括 Illuminate/Foundation/helpers.php
  require_once bootstrap/app.php
    Application::configure(basePath: dirname(__DIR__))
      new Application($basePath)
        setBasePath
        registerBaseBindings
        registerBaseServiceProviders
        registerCoreContainerAliases
      ApplicationBuilder::withKernels
      ApplicationBuilder::withEvents
      ApplicationBuilder::withCommands
      ApplicationBuilder::withProviders
    ->withRouting(...)
    ->withMiddleware(...)
    ->withExceptions(...)
    ->create()
  $app->handleRequest(Request::capture())
    Request::capture()
      SymfonyRequest::createFromGlobals()
      Illuminate Request::createFromBase(...)
    Application::handleRequest($request)
      $kernel = $app->make(HttpKernelContract::class)
      $response = $kernel->handle($request)->send()
        Http\Kernel::handle
          sendRequestThroughRouter
            bind request
            bootstrap app
              LoadEnvironmentVariables
              LoadConfiguration
              HandleExceptions
              RegisterFacades
              RegisterProviders
              BootProviders
            global middleware pipeline
            Router::dispatch
              findRoute
              runRoute
              route middleware pipeline
              Route::run
                CallableDispatcher::dispatch
                  routes/web.php 的闭包
                    view('welcome')
              Router::prepareResponse
        Symfony\Response::send
          sendHeaders
          sendContent
      $kernel->terminate($request, $response)
```

## 这次请求为什么会命中 welcome 页面

当前 `routes/web.php` 只有一个核心路由：`GET /` 返回 `view('welcome')`。所以普通浏览器访问站点根路径时，路由匹配会找到这个闭包，闭包返回一个 `Illuminate\View\View` 对象，Laravel 再把它转成 `Illuminate\Http\Response`。

## 几个关键词

- `Application`：Laravel 的服务容器，也是整个应用对象。
- `ApplicationBuilder`：Laravel 11 之后默认骨架里的链式配置器，负责把路由、中间件、异常处理等配置挂到应用上。
- `Kernel`：HTTP 请求的总调度器，负责 bootstrap、全局中间件、路由分发和终止逻辑。
- `bootstrapper`：Kernel 启动时按顺序执行的一组类，用来加载环境变量、配置、异常处理、Facade、服务提供者等。
- `Router`：根据请求方法和路径匹配路由，并执行路由动作。
- `Response`：最终向浏览器发送 header 和 body 的对象。
