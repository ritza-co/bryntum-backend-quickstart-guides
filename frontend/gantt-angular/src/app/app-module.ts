import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { BryntumGanttModule } from '@bryntum/gantt-angular';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        AppRoutingModule,
        BryntumGanttModule
    ],
    providers : [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection()
    ],
    bootstrap : [App]
})
export class AppModule { }
