import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { BryntumGridModule } from '@bryntum/grid-angular';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        AppRoutingModule,
        BryntumGridModule
    ],
    providers : [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection()
    ],
    bootstrap : [App]
})
export class AppModule { }
