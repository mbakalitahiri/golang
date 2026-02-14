import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccountRequestService } from '../../services/account-request.service';
import { AccountRequest, RequestStatus, AccountStatus, ErrorType } from '../../models/account-request.model';

@Component({
  selector: 'app-request-status',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  templateUrl: './request-status.html',
  styleUrl: './request-status.scss',
})
export class RequestStatus implements OnInit {
  requests = computed(() => this.accountRequestService.requests());
  loading = computed(() => this.accountRequestService.loading());
  
  searchTerm = signal<string>('');
  
  filteredRequests = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.requests();
    
    return this.requests().filter(req => 
      req.id?.toLowerCase().includes(term) ||
      req.accountNumbers.some(acc => acc.includes(term))
    );
  });

  RequestStatus = RequestStatus;
  AccountStatus = AccountStatus;

  constructor(
    public accountRequestService: AccountRequestService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    setInterval(() => {
      const pendingRequests = this.requests().filter(
        req => req.status === RequestStatus.PENDING || req.status === RequestStatus.PROCESSING
      );
      
      pendingRequests.forEach(req => {
        if (req.id) {
          this.accountRequestService.refreshRequest(req.id);
        }
      });
    }, 5000);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  getStatusSeverity(status: RequestStatus): string {
    const severityMap: Record<RequestStatus, string> = {
      [RequestStatus.PENDING]: 'info',
      [RequestStatus.PROCESSING]: 'warning',
      [RequestStatus.SUCCESS]: 'success',
      [RequestStatus.PARTIAL_SUCCESS]: 'warning',
      [RequestStatus.FAILED]: 'danger'
    };
    return severityMap[status] || 'info';
  }

  getAccountStatusSeverity(status: AccountStatus): string {
    return status === AccountStatus.SUCCESS ? 'success' : 'danger';
  }

  canDownload(request: AccountRequest): boolean {
    return request.status === RequestStatus.SUCCESS || 
           request.status === RequestStatus.PARTIAL_SUCCESS;
  }

  hasErrors(request: AccountRequest): boolean {
    return request.results?.some(r => r.status === AccountStatus.FAILED) || false;
  }

  confirmDownload(request: AccountRequest, accountNumber?: string): void {
    const message = accountNumber 
      ? `¿Desea descargar el archivo ZIP para la cuenta ${accountNumber}?`
      : '¿Desea descargar el archivo ZIP con los resultados?';

    this.confirmationService.confirm({
      message,
      header: 'Confirmar Descarga',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, descargar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.downloadZip(request, accountNumber);
      }
    });
  }

  downloadZip(request: AccountRequest, accountNumber?: string): void {
    if (!request.id) return;

    const downloadObservable = accountNumber
      ? this.accountRequestService.downloadPartialZip(request.id, accountNumber)
      : this.accountRequestService.downloadZip(request.id);

    downloadObservable.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = accountNumber 
          ? `cuenta_${accountNumber}_${request.id}.zip`
          : `solicitud_${request.id}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Descarga exitosa',
          detail: 'El archivo se ha descargado correctamente'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al descargar el archivo'
        });
      }
    });
  }

  getErrorTypeLabel(errorType?: ErrorType): string {
    if (!errorType) return '';
    return this.accountRequestService.getErrorTypeLabel(errorType);
  }

  refreshData(): void {
    this.accountRequestService.loadRequests();
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizando',
      detail: 'Cargando solicitudes...'
    });
  }
}

