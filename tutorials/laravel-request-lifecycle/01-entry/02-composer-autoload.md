# Composer 自动加载

入口来自 `public/index.php`：

```php
require __DIR__.'/../vendor/autoload.php';
```

## vendor/autoload.php

这个文件是 Composer 生成的，核心步骤很短。

### PHP 版本检查

文件先检查 `PHP_VERSION_ID`。如果 PHP 版本太低，直接返回 500 或在 CLI 输出错误，然后抛出异常。当前项目能跑 Laravel 13，说明这一步会通过。

### require autoload_real.php

```php
require_once __DIR__ . '/composer/autoload_real.php';
```

这里进入 Composer 真正的自动加载初始化类。

### 返回 ClassLoader

```php
return ComposerAutoloaderInit...::getLoader();
```

`getLoader()` 返回 `Composer\Autoload\ClassLoader` 实例。这个 loader 会注册到 PHP 的 SPL 自动加载栈中。

## vendor/composer/autoload_real.php

`getLoader()` 的主线如下：

1. 如果 loader 已经创建过，直接返回缓存的 `self::$loader`。
2. `require platform_check.php`，检查 Composer 依赖声明的 PHP 版本和扩展要求。
3. 临时注册 `loadClassLoader`，用来加载 `Composer\Autoload\ClassLoader`。
4. `new ClassLoader(...)` 创建自动加载器。
5. 取消临时自动加载函数。
6. `require autoload_static.php`，读取 Composer 生成的类映射、PSR-4 前缀、files 自动加载列表。
7. 调用静态初始化器，把映射数据塞进 `$loader`。
8. `$loader->register(true)` 注册正式自动加载器。
9. 遍历 `$filesToLoad`，把 Composer `files` 类型的文件全部 `require` 一遍。
10. 返回 `$loader`。

## autoload_static.php 里最重要的两类数据

### files

`$files` 里包含很多必须立即加载的函数文件。当前项目里能看到这些 Laravel 文件：

- `laravel/framework/src/Illuminate/Foundation/helpers.php`
- `laravel/framework/src/Illuminate/Collections/helpers.php`
- `laravel/framework/src/Illuminate/Support/helpers.php`
- `laravel/framework/src/Illuminate/Filesystem/functions.php`

这解释了为什么后面可以直接调用 `app()`、`view()`、`config()`、`public_path()` 等全局辅助函数。

### PSR-4 前缀

`$prefixDirsPsr4` 告诉 Composer：类名前缀对应哪个目录。例如：

- `App\` 指向项目 `app/`
- `Illuminate\` 指向 `vendor/laravel/framework/src/Illuminate/`
- `Symfony\Component\HttpFoundation\` 指向 Symfony HTTP Foundation 包

所以当代码第一次使用 `Illuminate\Http\Request` 时，Composer 会按 PSR-4 规则找到：

```text
vendor/laravel/framework/src/Illuminate/Http/Request.php
```

## ClassLoader::loadClass

自动加载器最终靠 `ClassLoader::loadClass($class)` 工作：

1. `findFile($class)` 先查 classmap。
2. 如果 classmap 没有，就按 PSR-4 前缀把类名转换成路径。
3. 找到文件后通过内部 include 函数加载。
4. 找不到就返回 `null`，PHP 会继续尝试其他自动加载器。

## 回到 public/index.php

Composer 自动加载完成后，入口文件继续执行：

```php
$app = require_once __DIR__.'/../bootstrap/app.php';
```

下一章：[bootstrap/app.php 返回 Application](../02-application/01-bootstrap-app.md)
