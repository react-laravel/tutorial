# 入口文件：public/index.php

文件：`public/index.php`

这是 Web 请求进入 Laravel 的第一段 PHP 代码。Web 服务器，例如 Nginx、Apache 或 `php artisan serve`，会把请求转到这个文件。

## 第 1 行：PHP 开始标签

```php
<?php
```

告诉 PHP 解释器：下面是 PHP 代码。

## 第 3-4 行：导入类名

```php
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
```

这两行只是给后面代码使用短类名。`Application` 用于类型提示，`Request` 用于捕获当前 HTTP 请求。

注意：`use` 本身不会加载类文件。真正的类文件加载依赖后面的 Composer autoload。

## 第 6 行：记录启动时间

```php
define('LARAVEL_START', microtime(true));
```

`microtime(true)` 返回当前 Unix 时间戳，单位是秒，带小数。Laravel 用常量 `LARAVEL_START` 记录请求开始时刻，后面可以用于计算启动耗时、调试信息或日志。

## 第 9-11 行：维护模式检查

```php
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}
```

这一段同时做了三件事：

1. `__DIR__` 是当前文件所在目录，也就是 `public`。
2. `__DIR__.'/../storage/framework/maintenance.php'` 指向项目的维护模式文件。
3. `file_exists(...)` 如果发现这个文件，就 `require` 它。

当执行 `php artisan down` 时，Laravel 会生成维护模式相关文件。这里提前检查，是为了在完整框架启动前就能快速返回维护页面。

## 第 14 行：注册 Composer 自动加载器

```php
require __DIR__.'/../vendor/autoload.php';
```

这是第一个重要跳转点。进入 `vendor/autoload.php` 后，Composer 会注册一个自动加载器。之后代码里第一次使用 `Illuminate\Foundation\Application`、`Illuminate\Http\Request` 等类时，PHP 才知道去哪里找对应文件。

下一章：[Composer 自动加载](02-composer-autoload.md)

## 第 18 行：加载 bootstrap/app.php

```php
$app = require_once __DIR__.'/../bootstrap/app.php';
```

`bootstrap/app.php` 返回一个 `Application` 实例。这里的 `require_once` 会执行该文件，并把文件的 `return` 值赋给 `$app`。

这个文件不会立刻处理 HTTP 请求，它只是把应用对象构建好，并把路由、中间件、异常处理等配置挂上去。

对应章节：[bootstrap/app.php 返回 Application](../02-application/01-bootstrap-app.md)

## 第 20 行：捕获请求并交给 Laravel

```php
$app->handleRequest(Request::capture());
```

执行顺序是先算参数，再调用方法：

1. `Request::capture()` 从 PHP 全局变量，例如 `$_GET`、`$_POST`、`$_SERVER`、`$_FILES`，创建 Laravel 请求对象。
2. `$app->handleRequest(...)` 把请求交给 Laravel 应用。
3. Laravel 通过 HTTP Kernel 匹配路由、执行控制器或闭包、生成响应、发送给浏览器。

对应章节：[Request::capture 捕获 HTTP 请求](../03-request/01-request-capture.md) 与 [Application::handleRequest 接管请求](../03-request/02-application-handle-request.md)
