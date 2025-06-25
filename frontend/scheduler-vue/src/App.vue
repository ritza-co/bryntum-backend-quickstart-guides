<script setup lang="ts">
import { BryntumScheduler } from '@bryntum/scheduler-vue-3';
import { schedulerConfig } from './schedulerConfig.ts';
</script>

<template>
    <bryntum-scheduler
        v-bind="schedulerConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
