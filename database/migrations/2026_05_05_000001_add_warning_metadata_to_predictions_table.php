<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('predictions', 'model_version')) {
            return;
        }

        Schema::table('predictions', function (Blueprint $table) {
            $table->string('raw_readiness_level', 50)->nullable()->after('readiness_level');
            $table->float('raw_hri_value')->nullable()->after('hri_value');
            $table->string('model_version', 120)->nullable()->after('confidence_score');
            $table->string('warning_state', 20)->nullable()->after('model_version');
            $table->string('guardrail_action', 20)->nullable()->after('warning_state');
            $table->string('threshold_warning_level', 20)->nullable()->after('guardrail_action');
            $table->boolean('out_of_distribution')->default(false)->after('threshold_warning_level');
            $table->json('out_of_distribution_features')->nullable()->after('out_of_distribution');
            $table->text('prediction_warning')->nullable()->after('out_of_distribution_features');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('predictions', 'model_version')) {
            return;
        }

        Schema::table('predictions', function (Blueprint $table) {
            $table->dropColumn([
                'raw_readiness_level',
                'raw_hri_value',
                'model_version',
                'warning_state',
                'guardrail_action',
                'threshold_warning_level',
                'out_of_distribution',
                'out_of_distribution_features',
                'prediction_warning',
            ]);
        });
    }
};
