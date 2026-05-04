<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('hri_records');
    }

    public function down(): void
    {
        // hri_records was superseded by ML classification — no restore needed
    }
};
