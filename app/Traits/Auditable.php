<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    protected static array $auditExcluded = ['created_at', 'updated_at', 'image_path'];

    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->recordAudit('created', null, $model->getAuditSnapshot($model->getAttributes()));
        });

        static::updated(function ($model) {
            $dirty = array_diff_key($model->getDirty(), array_flip(static::$auditExcluded));

            if (empty($dirty)) {
                return;
            }

            $old = array_intersect_key($model->getOriginal(), $dirty);
            $new = array_intersect_key($model->getAttributes(), $dirty);

            $model->recordAudit('updated', $old, $new);
        });

        static::deleted(function ($model) {
            $model->recordAudit('deleted', $model->getAuditSnapshot($model->getOriginal()), null);
        });
    }

    protected function getAuditSnapshot(array $attributes): array
    {
        return array_diff_key($attributes, array_flip(static::$auditExcluded));
    }

    protected function recordAudit(string $event, ?array $old, ?array $new): void
    {
        AuditLog::create([
            'user_id'        => Auth::id(),
            'event'          => $event,
            'auditable_type' => class_basename($this),
            'auditable_id'   => $this->getKey(),
            'old_values'     => $old,
            'new_values'     => $new,
        ]);
    }
}
