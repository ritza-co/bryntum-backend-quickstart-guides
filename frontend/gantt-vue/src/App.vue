<script setup lang="ts">
import { BryntumGantt } from '@bryntum/gantt-vue-3';
import { ganttConfig } from './ganttConfig.ts';
</script>

<template>
    <bryntum-gantt
        v-bind="ganttConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
