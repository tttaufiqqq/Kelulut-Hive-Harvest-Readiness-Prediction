<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('harvests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hive_id')->constrained()->cascadeOnDelete();
            $table->foreignId('beekeeper_id')->constrained('users')->cascadeOnDelete();
            $table->date('harvest_date');
            $table->float('weight');
            $table->string('productivity_level', 50)->nullable();
            $table->foreignId('color_id')->nullable()->constrained('master_honey_colors')->nullOnDelete();
            $table->foreignId('flavor_id')->nullable()->constrained('master_honey_flavors')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('harvests');
    }
};
