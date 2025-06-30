<script setup lang="ts">
import { BryntumCalendar } from '@bryntum/calendar-vue-3';
import { calendarConfig } from './calendarConfig.ts';
</script>

<template>
    <bryntum-calendar
        v-bind="calendarConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>