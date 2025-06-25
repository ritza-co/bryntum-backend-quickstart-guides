import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { BryntumSchedulerModule } from '@bryntum/scheduler-angular';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        AppRoutingModule,
        BryntumSchedulerModule
    ],
    providers : [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection()
    ],
    bootstrap : [App]
})
export class AppModule { }
