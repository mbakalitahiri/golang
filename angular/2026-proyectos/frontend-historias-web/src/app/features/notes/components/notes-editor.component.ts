import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Título" />

      <input type="date" formControlName="date" />

      <textarea rows="20" formControlName="text"> </textarea>

      <button type="button">Guardar</button>
    </form>
  `,
})
export class NotesEditorComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    title: '',
    date: '',
    text: '',
  });
}
