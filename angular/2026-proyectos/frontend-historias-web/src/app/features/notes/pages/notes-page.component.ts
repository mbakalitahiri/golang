import { Component } from '@angular/core';
import { CalendarComponent } from '../components/calendar.compnent';
import { NotesEditorComponent } from '../components/notes-editor.component';
import { NotesListComponent } from '../components/notes-list.component';

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [NotesListComponent, NotesEditorComponent, CalendarComponent],
  templateUrl: './notes-page.component.html',
})
export class NotesPageComponent {}
