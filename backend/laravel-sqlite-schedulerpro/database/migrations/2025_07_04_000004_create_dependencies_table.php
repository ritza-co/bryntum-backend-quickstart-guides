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
        Schema::create('dependencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('from')->nullable();
            $table->unsignedBigInteger('to')->nullable();
            $table->string('fromSide')->default('right');
            $table->string('toSide')->default('left');
            $table->string('cls')->nullable();
            $table->float('lag')->default(0);
            $table->string('lagUnit')->default('day');
            
            $table->foreign('from')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('to')->references('id')->on('events')->onDelete('cascade');
            
            $table->index(['from']);
            $table->index(['to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dependencies');
    }
};