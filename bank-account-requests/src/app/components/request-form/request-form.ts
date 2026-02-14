import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AccountRequestService } from '../../services/account-request.service';
import { AccountRequestPayload } from '../../models/account-request.model';

@Component({
  selector: 'app-request-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CalendarModule,
    InputTextModule,
    ButtonModule,
    ChipsModule,
    MessageModule
  ],
  templateUrl: './request-form.html',
  styleUrl: './request-form.scss',
})
export class RequestForm {
  requestForm: FormGroup;
  submitting = signal<boolean>(false);
  minDate = signal<Date>(new Date(2020, 0, 1));
  maxDate = signal<Date>(new Date());

  constructor(
    private fb: FormBuilder,
    private accountRequestService: AccountRequestService,
    private messageService: MessageService
  ) {
    this.requestForm = this.fb.group({
      accountNumbers: [[], [Validators.required, Validators.minLength(1)]],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(group: FormGroup) {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (start > end) {
      return { dateRange: 'La fecha inicial debe ser menor a la fecha final' };
    }

    if (daysDiff > 365) {
      return { dateRange: 'El rango de fechas no puede ser mayor a 1 año' };
    }

    return null;
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.markFormGroupTouched(this.requestForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, complete todos los campos correctamente'
      });
      return;
    }

    this.submitting.set(true);

    const formValue = this.requestForm.value;
    const payload: AccountRequestPayload = {
      accountNumbers: formValue.accountNumbers,
      startDate: this.formatDate(formValue.startDate),
      endDate: this.formatDate(formValue.endDate)
    };

    this.accountRequestService.createRequest(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Solicitud creada exitosamente'
          });
          this.requestForm.reset();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.error || 'Error al crear la solicitud'
          });
        }
        this.submitting.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error de conexión con el servidor'
        });
        this.submitting.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get accountNumbersControl() {
    return this.requestForm.get('accountNumbers');
  }

  get startDateControl() {
    return this.requestForm.get('startDate');
  }

  get endDateControl() {
    return this.requestForm.get('endDate');
  }

  get dateRangeError() {
    return this.requestForm.errors?.['dateRange'];
  }
}
