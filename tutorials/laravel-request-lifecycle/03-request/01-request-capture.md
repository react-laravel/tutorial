# Request::capture 捕获 HTTP 请求

入口来自 `public/index.php`：

```php
$app->handleRequest(Request::capture());
```

PHP 会先执行参数里的 `Request::capture()`。

文件：`vendor/laravel/framework/src/Illuminate/Http/Request.php`

## capture 方法

`capture()` 做两步：

1. `static::enableHttpMethodParameterOverride()`
2. `static::createFromBase(SymfonyRequest::createFromGlobals())`

## enableHttpMethodParameterOverride

HTML 表单原生只支持 `GET` 和 `POST`。Laravel 常见写法是在表单里加 `_method=PUT` 或 `_method=DELETE`。这一行允许 Symfony Request 识别这种方法覆盖。

注意：这只是允许覆盖，真正的请求方法仍要从请求数据里判断。

## SymfonyRequest::createFromGlobals

这一行进入 Symfony HTTP Foundation。它会读取 PHP 全局变量：

- `$_GET`：query string
- `$_POST`：表单 body
- `$_COOKIE`
- `$_FILES`
- `$_SERVER`：请求方法、路径、Host、Header 等

得到的是 `Symfony\Component\HttpFoundation\Request`。

## Illuminate Request::createFromBase

Laravel 不直接使用 Symfony Request，而是把它包装成 `Illuminate\Http\Request`。Laravel 的 Request 继承自 Symfony Request，并增加了很多 Laravel 习惯用法，例如：

- `path()`
- `url()`
- `fullUrl()`
- `route()`
- `user()`
- `expectsJson()`
- 表单验证相关宏

## capture 的返回值

返回值是一个 Laravel Request 对象，代表当前浏览器请求。

随后入口文件继续：

```php
$app->handleRequest($request);
```

下一章：[Application::handleRequest 接管请求](02-application-handle-request.md)
