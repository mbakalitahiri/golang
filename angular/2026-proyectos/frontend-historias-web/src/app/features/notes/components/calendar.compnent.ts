import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  template: ` <input type="date" class="border rounded p-2 w-full" /> `,
})
export class CalendarComponent {}
