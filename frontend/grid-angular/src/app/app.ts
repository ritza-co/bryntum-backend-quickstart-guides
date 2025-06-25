import { Component, ViewChild } from '@angular/core';
import { BryntumGridComponent } from '@bryntum/grid-angular';
import { gridConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    gridConfig = gridConfig;

  @ViewChild('app') gridComponent!: BryntumGridComponent;
}
