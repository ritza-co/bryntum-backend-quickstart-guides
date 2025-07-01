<script setup lang="ts">
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-vue-3';
import { schedulerProConfig } from './schedulerproConfig.ts';
</script>

<template>
    <bryntum-scheduler-pro
        v-bind="schedulerProConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
