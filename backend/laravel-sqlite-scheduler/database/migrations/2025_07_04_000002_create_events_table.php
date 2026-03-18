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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->datetime('startDate')->nullable();
            $table->datetime('endDate')->nullable();
            $table->boolean('allDay')->default(false);
            $table->string('eventColor')->nullable();
            $table->boolean('readOnly')->default(false);
            $table->string('timeZone')->nullable();
            $table->boolean('draggable')->default(true);
            $table->string('resizable')->default('true');
            $table->string('children')->nullable();
            $table->double('duration')->nullable();
            $table->string('durationUnit')->default('day');
            $table->json('exceptionDates')->nullable();
            $table->string('recurrenceRule')->nullable();
            $table->string('cls')->nullable();
            $table->string('eventStyle')->nullable();
            $table->string('iconCls')->nullable();
            $table->string('style')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
