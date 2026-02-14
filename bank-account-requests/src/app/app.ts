import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RequestForm } from './components/request-form/request-form';
import { RequestStatus } from './components/request-status/request-status';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TabViewModule,
    ToastModule,
    RequestForm,
    RequestStatus
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Gestión de Solicitudes de Cuentas Bancarias');
  activeTabIndex = signal<number>(0);
}
