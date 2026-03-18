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
            $table->unsignedBigInteger('fromEvent')->nullable();
            $table->unsignedBigInteger('toEvent')->nullable();
            $table->integer('type')->default(2);
            $table->string('cls')->nullable();
            $table->float('lag')->default(0);
            $table->string('lagUnit')->default('day');
            $table->boolean('active')->default(true);
            $table->string('fromSide')->nullable();
            $table->string('toSide')->nullable();

            $table->index('fromEvent');
            $table->index('toEvent');
            $table->foreign('fromEvent')->references('id')->on('tasks')->onDelete('cascade');
            $table->foreign('toEvent')->references('id')->on('tasks')->onDelete('cascade');
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
