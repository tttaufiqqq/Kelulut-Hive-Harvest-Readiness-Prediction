<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use App\Http\Controllers\Controller;
use App\Support\AppErrorReporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ThesisController extends Controller
{
    private const APP_MAX_UPLOAD_KILOBYTES = 51200;

    public function index(): Response
    {
        $exists = Storage::disk('public')->exists('thesis/thesis.pdf');
        $url = $exists ? route('thesis.pdf') : null;
        $uploadedAt = $exists
            ? date('d M Y, H:i', Storage::disk('public')->lastModified('thesis/thesis.pdf'))
            : null;

        return Inertia::render('admin/thesis', [
            'thesisUrl' => $url,
            'uploadedAt' => $uploadedAt,
            'maxUploadBytes' => $this->maxUploadKilobytes() * 1024,
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $maxUploadKilobytes = $this->maxUploadKilobytes();
        $maxUploadLabel = $this->formatKilobytes($maxUploadKilobytes);

        $request->validate([
            'thesis' => ['required', 'file', 'mimes:pdf', "max:{$maxUploadKilobytes}"],
        ], [
            'thesis.required' => 'Please choose a thesis PDF to upload.',
            'thesis.file' => 'The selected thesis upload is invalid.',
            'thesis.uploaded' => "The uploaded thesis PDF exceeded the current server upload limit of {$maxUploadLabel}. Please try a smaller PDF.",
            'thesis.mimes' => 'Please upload a PDF file for the thesis.',
            'thesis.max' => "The thesis PDF must be {$maxUploadLabel} or smaller.",
        ]);

        try {
            $disk = Storage::disk('public');
            $thesisPath = 'thesis/thesis.pdf';

            if (! $disk->exists('thesis') && ! $disk->makeDirectory('thesis')) {
                throw new AppException(
                    AppErrorCode::FileStorageFailed,
                    503,
                    'We could not prepare storage for the thesis PDF. Please try again.',
                    'error',
                );
            }

            // Overwrite in place so replacing a live PDF does not depend on a
            // separate delete step that can fail on Windows when the file is open.
            $storedPath = $disk->putFileAs(
                'thesis',
                $request->file('thesis'),
                'thesis.pdf',
            );

            if ($storedPath === false) {
                throw new AppException(
                    AppErrorCode::FileStorageFailed,
                    503,
                    'We could not save the thesis PDF right now. Please try again.',
                    'error',
                );
            }
        } catch (AppException $e) {
            throw $e;
        } catch (Throwable $e) {
            AppErrorReporter::report(
                $e,
                AppErrorCode::FileStorageFailed,
                context: [
                    'filename' => $request->file('thesis')?->getClientOriginalName(),
                    'size' => $request->file('thesis')?->getSize(),
                ],
            );

            throw new AppException(
                AppErrorCode::FileStorageFailed,
                503,
                'We could not save the thesis PDF right now. Please try again.',
                'error',
                previous: $e,
            );
        }

        return redirect()->route('admin.thesis')
            ->with('success', 'Thesis uploaded successfully.');
    }

    public function destroy(): RedirectResponse
    {
        try {
            $disk = Storage::disk('public');

            if ($disk->exists('thesis/thesis.pdf') && ! $disk->delete('thesis/thesis.pdf')) {
                throw new AppException(
                    AppErrorCode::FileStorageFailed,
                    503,
                    'We could not remove the thesis PDF right now. Please try again.',
                    'error',
                );
            }
        } catch (AppException $e) {
            throw $e;
        } catch (Throwable $e) {
            AppErrorReporter::report(
                $e,
                AppErrorCode::FileStorageFailed,
                context: ['path' => 'thesis/thesis.pdf'],
            );

            throw new AppException(
                AppErrorCode::FileStorageFailed,
                503,
                'We could not remove the thesis PDF right now. Please try again.',
                'error',
                previous: $e,
            );
        }

        return redirect()->route('admin.thesis')
            ->with('success', 'Thesis removed.');
    }

    private function maxUploadKilobytes(): int
    {
        $limits = array_filter([
            self::APP_MAX_UPLOAD_KILOBYTES,
            $this->iniSizeToKilobytes(ini_get('upload_max_filesize')),
            $this->iniSizeToKilobytes(ini_get('post_max_size')),
        ], static fn (?int $value): bool => $value !== null && $value > 0);

        return max(1, min($limits));
    }

    private function iniSizeToKilobytes(string|false $value): ?int
    {
        if ($value === false) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $unit = strtolower(substr($value, -1));
        $number = is_numeric($unit) ? (float) $value : (float) substr($value, 0, -1);

        $bytes = match ($unit) {
            'g' => $number * 1024 * 1024 * 1024,
            'm' => $number * 1024 * 1024,
            'k' => $number * 1024,
            default => (float) $value,
        };

        return (int) max(1, floor($bytes / 1024));
    }

    private function formatKilobytes(int $kilobytes): string
    {
        $megabytes = $kilobytes / 1024;

        if (fmod($megabytes, 1.0) === 0.0) {
            return sprintf('%.0f MB', $megabytes);
        }

        return sprintf('%.1f MB', $megabytes);
    }
}
