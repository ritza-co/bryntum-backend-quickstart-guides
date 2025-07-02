<script setup lang="ts">
import { BryntumTaskBoard } from '@bryntum/taskboard-vue-3';
import { taskboardConfig } from './taskboardConfig.ts';
</script>

<template>
    <bryntum-task-board
        v-bind="taskboardConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
