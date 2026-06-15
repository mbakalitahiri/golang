import { Component } from '@angular/core';
import { NotesEditorComponent } from './notes-editor.component';
import { NotesListComponent } from './notes-list.component';
@Component({
  selector: 'app-notes-page',
  standalone: true,
  template: `
    <div class="layout">
      <div class="sidebar">
        <app-notes-list />
      </div>

      <div class="content">
        <app-note-editor />
      </div>
    </div>
  `,
  imports: [NotesListComponent, NotesEditorComponent],
})
export class NotesPageComponent {}
