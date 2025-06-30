import { Component, ViewChild } from '@angular/core';
import { BryntumCalendarComponent } from '@bryntum/calendar-angular';
import { calendarConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    calendarConfig = calendarConfig;

  @ViewChild('app') calendarComponent!: BryntumCalendarComponent;
}