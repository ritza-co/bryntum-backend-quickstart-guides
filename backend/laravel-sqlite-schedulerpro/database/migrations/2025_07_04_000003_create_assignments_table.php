<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eventId');
            $table->unsignedBigInteger('resourceId');
            
            $table->foreign('eventId')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('resourceId')->references('id')->on('resources')->onDelete('cascade');
            
            $table->index(['eventId']);
            $table->index(['resourceId']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};