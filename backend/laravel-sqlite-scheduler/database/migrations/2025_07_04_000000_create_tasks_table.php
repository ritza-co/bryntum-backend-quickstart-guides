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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('startDate');
            $table->date('endDate')->nullable();
            $table->integer('duration')->nullable();
            $table->integer('percentDone')->default(0);
            $table->unsignedBigInteger('parentId')->nullable();
            $table->boolean('expanded')->default(false);
            $table->boolean('rollup')->default(false);
            $table->boolean('manuallyScheduled')->default(false);
            
            $table->foreign('parentId')->references('id')->on('tasks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};