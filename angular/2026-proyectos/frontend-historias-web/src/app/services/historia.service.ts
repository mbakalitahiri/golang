import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Historia } from '../models/historia.model';

@Injectable({
  providedIn: 'root',
})
export class HistoriaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/historias';

  // Estado interno nativo mediante un Signal privado
  private historiasState = signal<Historia[]>([]);
  // Exponemos el Signal como solo lectura para proteger los datos
  public historias = this.historiasState.asReadonly();

  // Obtener la lista del backend Express
  public cargarHistorias(): Observable<Historia[]> {
    return this.http
      .get<Historia[]>(this.apiUrl)
      .pipe(tap((data) => this.historiasState.set(data)));
  }

  // Guardar o actualizar un registro en el servidor
  public guardarHistoria(historia: Historia): Observable<Historia> {
    return this.http.post<Historia>(this.apiUrl, historia).pipe(
      tap(() => this.cargarHistorias().subscribe()), // Refresca la lista automáticamente al guardar
    );
  }
}
