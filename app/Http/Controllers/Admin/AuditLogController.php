<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = AuditLog::with('user')
            ->when($request->event, fn ($q) => $q->where('event', $request->event))
            ->when($request->model, fn ($q) => $q->where('auditable_type', $request->model))
            ->when($request->date, fn ($q) => $q->whereDate('created_at', $request->date))
            ->latest('created_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('admin/audit-logs/index', [
            'logs'    => $logs,
            'filters' => $request->only(['event', 'model', 'date']),
        ]);
    }
}
