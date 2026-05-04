<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ThesisController extends Controller
{
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
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $request->validate([
            'thesis' => ['required', 'file', 'mimes:pdf', 'max:51200'],
        ]);

        Storage::disk('public')->makeDirectory('thesis');
        Storage::disk('public')->putFileAs('thesis', $request->file('thesis'), 'thesis.pdf');

        return redirect()->route('admin.thesis')
            ->with('success', 'Thesis uploaded successfully.');
    }

    public function destroy(): RedirectResponse
    {
        Storage::disk('public')->delete('thesis/thesis.pdf');

        return redirect()->route('admin.thesis')
            ->with('success', 'Thesis removed.');
    }
}
