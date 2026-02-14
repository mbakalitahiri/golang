import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  AccountRequest,
  AccountRequestPayload,
  ApiResponse,
  RequestStatus,
  AccountStatus,
  ErrorType
} from '../models/account-request.model';

@Injectable({
  providedIn: 'root'
})
export class AccountRequestService {
  private readonly apiUrl = 'http://localhost:8080/api/account-requests';

  private requestsSignal = signal<AccountRequest[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  requests = this.requestsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  pendingRequests = computed(() => 
    this.requestsSignal().filter(req => req.status === RequestStatus.PENDING || req.status === RequestStatus.PROCESSING)
  );

  completedRequests = computed(() => 
    this.requestsSignal().filter(req => 
      req.status === RequestStatus.SUCCESS || 
      req.status === RequestStatus.PARTIAL_SUCCESS || 
      req.status === RequestStatus.FAILED
    )
  );

  constructor(private http: HttpClient) {
    this.loadRequests();
  }

  createRequest(payload: AccountRequestPayload): Observable<ApiResponse<AccountRequest>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<ApiResponse<AccountRequest>>(this.apiUrl, payload).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.requestsSignal.update(requests => [...requests, response.data!]);
        } else {
          this.errorSignal.set(response.error || 'Error al crear la solicitud');
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Error de conexión con el servidor');
        this.loadingSignal.set(false);
        return of({ success: false, error: error.message });
      })
    );
  }

  loadRequests(): void {
    this.loadingSignal.set(true);
    
    this.http.get<ApiResponse<AccountRequest[]>>(this.apiUrl).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.requestsSignal.set(response.data);
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Error al cargar las solicitudes');
        this.loadingSignal.set(false);
        return of({ success: false, data: [] });
      })
    ).subscribe();
  }

  getRequestById(id: string): Observable<ApiResponse<AccountRequest>> {
    return this.http.get<ApiResponse<AccountRequest>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.requestsSignal.update(requests => 
            requests.map(req => req.id === id ? response.data! : req)
          );
        }
      }),
      catchError(error => {
        return of({ success: false, error: error.message });
      })
    );
  }

  downloadZip(requestId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${requestId}/download`, {
      responseType: 'blob'
    });
  }

  downloadPartialZip(requestId: string, accountNumber: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${requestId}/download/${accountNumber}`, {
      responseType: 'blob'
    });
  }

  refreshRequest(id: string): void {
    this.getRequestById(id).subscribe();
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  getErrorTypeLabel(errorType: ErrorType): string {
    const labels: Record<ErrorType, string> = {
      [ErrorType.EXCESSIVE_MOVEMENTS]: 'Movimientos excesivos (>3M)',
      [ErrorType.PROCESSING_ERROR]: 'Error de procesamiento',
      [ErrorType.TIMEOUT]: 'Tiempo de espera agotado',
      [ErrorType.INVALID_ACCOUNT]: 'Cuenta inválida'
    };
    return labels[errorType] || 'Error desconocido';
  }

  getStatusLabel(status: RequestStatus): string {
    const labels: Record<RequestStatus, string> = {
      [RequestStatus.PENDING]: 'Pendiente',
      [RequestStatus.PROCESSING]: 'Procesando',
      [RequestStatus.SUCCESS]: 'Exitoso',
      [RequestStatus.PARTIAL_SUCCESS]: 'Parcialmente exitoso',
      [RequestStatus.FAILED]: 'Fallido'
    };
    return labels[status] || 'Desconocido';
  }
}
