import { Component, ViewChild } from '@angular/core';
import { BryntumTaskBoardComponent } from '@bryntum/taskboard-angular';
import { taskboardConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    taskboardConfig = taskboardConfig;

  @ViewChild('app') taskboardComponent!: BryntumTaskBoardComponent;
}
