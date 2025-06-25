<script setup lang="ts">
import { BryntumGrid } from '@bryntum/grid-vue-3';
import { gridConfig } from './gridConfig.ts';
</script>

<template>
    <bryntum-grid
        v-bind="gridConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
