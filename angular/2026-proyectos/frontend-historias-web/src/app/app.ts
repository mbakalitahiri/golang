import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HistoriaService } from './services/historia.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private service = inject(HistoriaService);

  public tiposGmudDisponibles = ['Estera', 'Motor'];

  // Signals de control de UI
  public textoBusqueda = signal<string>('');
  public seleccionada = signal<any | null>(null);

  // Paginación
  public paginaActual = signal<number>(1);
  public elementosPorPagina = 8;
  public filtroEstado = signal<string>('activas');

  public historiasFiltradas = computed(() => {
    const lista = this.service.historias();
    const filtroTexto = this.textoBusqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return lista.filter((h) => {
      const coincideTexto =
        filtroTexto === '' ||
        h.id.toLowerCase().includes(filtroTexto) ||
        h.descripcion.toLowerCase().includes(filtroTexto);

      let coincideEstado = true;
      if (estado === 'activas') coincideEstado = h.activo === true;
      if (estado === 'inactivas') coincideEstado = h.activo === false;

      return coincideTexto && coincideEstado;
    });
  });

  public historiasPaginadas = computed(() => {
    const lista = this.historiasFiltradas();
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return lista.slice(inicio, inicio + this.elementosPorPagina);
  });

  public totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.historiasFiltradas().length / this.elementosPorPagina));
  });

  public tipoGmudSeleccionado = computed(() => {
    return (this.seleccionada()?.tipoGmud || '').toUpperCase();
  });

  ngOnInit(): void {
    this.service.cargarHistorias().subscribe();
  }

  public alCambiarFiltro(nuevoTexto: string): void {
    this.textoBusqueda.set(nuevoTexto);
    this.paginaActual.set(1);
  }

  public cambiarFiltroEstado(nuevoEstado: string): void {
    this.filtroEstado.set(nuevoEstado);
    this.paginaActual.set(1);
  }

  public seleccionar(h: any): void {
    this.seleccionada.set({
      ...h,
      testesMutantes: h.testesMutantes || '',
      testesIuquali: h.testesIuquali || '',
      figmaLink: h.figmaLink || '',
      accesibilidad: h.accesibilidad || '',
      fechaCreacion: h.fechaCreacion || '',
      fechaDocker: h.fechaDocker || '',
      fechaPiloto: h.fechaPiloto || '',
      fechaGmud: h.fechaGmud || '',
      fechaHomologacion: h.fechaHomologacion || '',
      fechaProduccion: h.fechaProduccion || '',
    });
  }

  public crearNueva(): void {
    this.seleccionada.set({
      id: 'HIS-2026-',
      descripcion: '',
      gmud: '',
      tipoGmud: '',
      activo: true,
      notas: '',
      testesMutantes: '',
      testesIuquali: '',
      figmaLink: '',
      accesibilidad: '',
      fechaCreacion: '',
      fechaDocker: '',
      fechaPiloto: '',
      fechaGmud: '',
      fechaHomologacion: '',
      fechaProduccion: '',
    });
  }

  // LÓGICA CORREGIDA: Mantiene el registro activo en pantalla tras guardar
  public guardar(): void {
    const data = this.seleccionada();
    if (!data || !data.id.trim()) return;

    this.service.guardarHistoria(data).subscribe({
      next: (registroSincronizado) => {
        // 1. Opcional: Si tu backend retorna el objeto actualizado/guardado con cambios del servidor, úsalo.
        // Si no, mantenemos el objeto actual que el usuario editó.
        const registroActualizado = registroSincronizado || data;

        // 2. Volvemos a setear el registro activo con los nuevos datos (así no se cierra el panel)
        this.seleccionada.set({ ...registroActualizado });

        // 3. Notificación discreta de éxito en lugar de un alert molesto que rompe el flujo
        console.log(`Registro ${registroActualizado.id} guardado con éxito.`);
      },
      error: (err) => {
        alert('Error al sincronizar el registro técnico.');
        console.error(err);
      },
    });
  }

  public eliminar(): void {
    const data = this.seleccionada();
    if (!data || !data.id) return;
    if (confirm(`¿Eliminar la historia ${data.id}?`)) {
      this.seleccionada.set(null);
    }
  }
}
