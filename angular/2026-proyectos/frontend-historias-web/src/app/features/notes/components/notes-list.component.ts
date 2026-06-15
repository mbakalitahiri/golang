import { Component, inject, signal } from '@angular/core';
import { Note } from '../models/note.model';
import { NotesService } from '../services/note.service';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  template: `
    <div>
      <button (click)="load()">Refrescar</button>

      @for (note of notes(); track note.id) {
        <div class="card">
          <h3>{{ note.title }}</h3>

          <small>
            {{ note.date }}
          </small>
        </div>
      }
    </div>
  `,
})
export class NotesListComponent {
  private service = inject(NotesService);

  notes = signal<Note[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe((notes) => {
      this.notes.set(notes);
    });
  }
}
