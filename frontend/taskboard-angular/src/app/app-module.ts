import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { BryntumTaskBoardModule } from '@bryntum/taskboard-angular';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        AppRoutingModule,
        BryntumTaskBoardModule
    ],
    providers : [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection()
    ],
    bootstrap : [App]
})
export class AppModule { }
