<?php

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsBeekeeper;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\AppErrorReporter;
use App\Support\UserFacingError;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(AssignRequestId::class);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'beekeeper' => EnsureUserIsBeekeeper::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (AppException $e) {
            AppErrorReporter::reportAppException($e);

            return false;
        });

        $exceptions->report(function (Throwable $e) {
            if ($e instanceof ValidationException || $e instanceof AppException) {
                return false;
            }

            if ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500) {
                return false;
            }

            AppErrorReporter::report(
                $e,
                AppErrorCode::UnexpectedError,
                context: [
                    'http_status' => $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500,
                ],
            );

            return false;
        });

        $exceptions->render(function (AppException $e, Request $request) {
            $requestId = (string) $request->attributes->get(AssignRequestId::ATTRIBUTE, '');
            $payload = UserFacingError::fromAppException($e);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => [
                        'code' => $payload['code']->value,
                        'message' => $payload['message'],
                        'reason' => $payload['reason'],
                    ],
                    'meta' => [
                        'request_id' => $requestId,
                    ],
                ], $e->status)->header(AssignRequestId::HEADER, $requestId);
            }

            if ($request->inertia() && ! $request->isMethod('GET')) {
                return back(status: 303)
                    ->with(
                        $e->logLevel === 'warning' ? 'warning' : 'error',
                        UserFacingError::sessionPayload($payload['message'], $payload['reason']),
                    );
            }

            if ($request->inertia()) {
                return Inertia::render('error/index', [
                    'status' => $e->status,
                    'title' => $payload['title'],
                    'message' => $payload['message'],
                    'reason' => $payload['reason'],
                    'requestId' => $requestId,
                ])->toResponse($request)
                    ->setStatusCode($e->status)
                    ->header(AssignRequestId::HEADER, $requestId);
            }

            return response($e->userMessage, $e->status)
                ->header(AssignRequestId::HEADER, $requestId);
        });

        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $requestId = (string) $request->attributes->get(AssignRequestId::ATTRIBUTE, '');
            $status = $response->getStatusCode();
            $response->headers->set(AssignRequestId::HEADER, $requestId);

            if ($e instanceof AppException) {
                return $response;
            }

            if (($request->expectsJson() || $request->is('api/*')) && ! $e instanceof ValidationException) {
                $error = UserFacingError::fromStatus($status);

                return response()->json([
                    'error' => [
                        'code' => $error['code']->value,
                        'message' => $error['message'],
                        'reason' => $error['reason'],
                    ],
                    'meta' => [
                        'request_id' => $requestId,
                    ],
                ], $status)->header(AssignRequestId::HEADER, $requestId);
            }

            if (! $request->inertia()) {
                return $response;
            }

            if ($request->isMethod('GET') && in_array($status, [403, 404, 419, 429, 500, 503], true)) {
                $error = UserFacingError::fromStatus($status);

                return Inertia::render('error/index', [
                    'status' => $status,
                    'title' => $error['title'],
                    'message' => $error['message'],
                    'reason' => $error['reason'],
                    'requestId' => $requestId,
                ])
                    ->toResponse($request)
                    ->setStatusCode($status)
                    ->header(AssignRequestId::HEADER, $requestId);
            }

            if (! $request->isMethod('GET') && in_array($status, [419, 429, 500, 503], true)) {
                $error = UserFacingError::fromStatus($status);
                $flashLevel = in_array($status, [419, 429], true) ? 'warning' : 'error';

                return back(status: 303)->with(
                    $flashLevel,
                    UserFacingError::sessionPayload($error['message'], $error['reason']),
                );
            }

            return $response;
        });
    })->create();
