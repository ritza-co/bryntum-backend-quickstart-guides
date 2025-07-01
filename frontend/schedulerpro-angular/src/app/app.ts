import { Component, ViewChild } from '@angular/core';
import { BryntumSchedulerProComponent } from '@bryntum/schedulerpro-angular';
import { schedulerProConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    schedulerProConfig = schedulerProConfig;

  @ViewChild('app') schedulerProComponent!: BryntumSchedulerProComponent;
}
