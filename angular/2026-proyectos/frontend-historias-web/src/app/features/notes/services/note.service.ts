import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from '../models/note.model';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private http = inject(HttpClient);

  private api = 'http://localhost:3000/api/notes';

  getAll(): Observable<Note[]> {
    return this.http.get<Note[]>(this.api);
  }

  getById(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.api}/${id}`);
  }

  create(note: Note): Observable<Note> {
    return this.http.post<Note>(this.api, note);
  }

  update(note: Note): Observable<Note> {
    return this.http.put<Note>(`${this.api}/${note.id}`, note);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  search(text: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.api}/search?q=${text}`);
  }
}
