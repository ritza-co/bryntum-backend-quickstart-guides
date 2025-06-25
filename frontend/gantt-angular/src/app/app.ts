import { Component, ViewChild } from '@angular/core';
import { BryntumGanttComponent } from '@bryntum/gantt-angular';
import { ganttConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    ganttConfig = ganttConfig;

  @ViewChild('app') ganttComponent!: BryntumGanttComponent;
}
