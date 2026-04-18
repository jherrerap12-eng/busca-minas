import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuscaMinasApi } from '../servicios/busca-minas-api';

interface Cuadro {
  fila: number;
  columna: number;
  levantado: boolean;
  esMina: boolean;
  numero: number | null;
}

@Component({
  selector: 'app-busca-minas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscaMinas.html',
  styleUrls: ['./buscaMinas.scss']
})
export class BuscaMinasComponent implements OnInit {
  private api = inject(BuscaMinasApi);
  private platformId = inject(PLATFORM_ID);

  titulo = 'Busca Minas';
  subtitulo = 'Tablero 10x10';

  filas = 10;
  columnas = 10;
  totalMinas = 10;

  juegoTerminado = false;
  mensajeEstado = 'Inicializando tablero...';
  totalLevantados = 0;

  tablero: Cuadro[][] = [];

  dialogoVisible = false;
  cuadroPendiente: Cuadro | null = null;
  cuadroActual: Cuadro | null = null;

  opcionElegida: 'mina' | 'numero' | '' = '';
  numeroEscrito = '';
  errorDialogo = '';

  ngOnInit(): void {
    this.armarTablero();

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.iniciarJuego();
      }, 0);
    }
  }

  iniciarJuego(): void {
    this.juegoTerminado = false;
    this.totalLevantados = 0;
    this.cuadroActual = null;
    this.limpiarDialogo();
    this.armarTablero();

    this.mensajeEstado = `Creando tablero con IA (${this.totalMinas} minas)...`;

    this.api.crearTablero(this.totalMinas).subscribe({
      next: () => {
        this.mensajeEstado = 'Tablero creado. Solicitando primera jugada...';

        setTimeout(() => {
          this.pedirSiguienteJugada();
        }, 250);
      },
      error: (error: unknown) => {
        this.mensajeEstado = 'No se pudo crear el tablero.';
        console.error('Error al crear tablero:', error);
      }
    });
  }

  pedirSiguienteJugada(): void {
    if (this.juegoTerminado) {
      return;
    }

    this.api.siguienteJugada().subscribe({
      next: (respuesta: unknown) => {
        console.log('Respuesta siguiente jugada:', respuesta);

        const jugada = this.extraerFilaYColumna(respuesta);

        if (!jugada) {
          this.mensajeEstado = 'La IA devolvió una jugada con formato no esperado.';
          console.error('Formato inesperado de siguiente-jugada:', respuesta);
          return;
        }

        const { fila, columna } = jugada;

        if (
          fila < 0 ||
          fila >= this.filas ||
          columna < 0 ||
          columna >= this.columnas
        ) {
          this.mensajeEstado = 'La IA devolvió una posición inválida.';
          return;
        }

        const cuadro = this.tablero[fila]?.[columna];

        if (!cuadro) {
          this.mensajeEstado = 'No se pudo ubicar el cuadro indicado por la IA.';
          return;
        }

        if (cuadro.levantado) {
          this.mensajeEstado = 'La IA intentó seleccionar un cuadro ya levantado.';
          return;
        }

        this.cuadroPendiente = cuadro;
        this.cuadroActual = cuadro;
        this.dialogoVisible = true;
        this.opcionElegida = '';
        this.numeroEscrito = '';
        this.errorDialogo = '';

        this.mensajeEstado = `IA seleccionó fila ${fila + 1}, columna ${columna + 1}.`;
      },
      error: (error: unknown) => {
        this.mensajeEstado = 'No se pudo obtener la siguiente jugada.';
        console.error('Error al pedir siguiente jugada:', error);
      }
    });
  }

  extraerFilaYColumna(respuesta: unknown): { fila: number; columna: number } | null {
    if (!respuesta || typeof respuesta !== 'object') {
      return null;
    }

    const data = respuesta as Record<string, unknown>;

    if (
      typeof data['fila'] === 'number' &&
      typeof data['columna'] === 'number'
    ) {
      return {
        fila: data['fila'],
        columna: data['columna']
      };
    }

    if (data['jugada'] && typeof data['jugada'] === 'object') {
      const jugada = data['jugada'] as Record<string, unknown>;

      if (
        typeof jugada['fila'] === 'number' &&
        typeof jugada['columna'] === 'number'
      ) {
        return {
          fila: jugada['fila'],
          columna: jugada['columna']
        };
      }
    }

    if (
      typeof data['x'] === 'number' &&
      typeof data['y'] === 'number'
    ) {
      return {
        fila: data['x'],
        columna: data['y']
      };
    }

    return null;
  }

  armarTablero(): void {
    this.tablero = [];

    for (let fila = 0; fila < this.filas; fila++) {
      const filaNueva: Cuadro[] = [];

      for (let columna = 0; columna < this.columnas; columna++) {
        filaNueva.push({
          fila,
          columna,
          levantado: false,
          esMina: false,
          numero: null
        });
      }

      this.tablero.push(filaNueva);
    }
  }

  elegirMina(): void {
    this.opcionElegida = 'mina';
    this.numeroEscrito = '';
    this.errorDialogo = '';
  }

  elegirNumero(): void {
    this.opcionElegida = 'numero';
    this.errorDialogo = '';
  }

  marcarNumeroAutomaticamente(): void {
    const numeroLimpio = this.numeroEscrito.trim();

    if (/^[1-8]$/.test(numeroLimpio)) {
      this.opcionElegida = 'numero';
      this.errorDialogo = '';
    }
  }

  puedeConfirmar(): boolean {
    if (!this.cuadroPendiente || this.juegoTerminado) {
      return false;
    }

    if (this.opcionElegida === 'mina') {
      return true;
    }

    if (this.opcionElegida === 'numero') {
      return /^[1-8]$/.test(this.numeroEscrito.trim());
    }

    return false;
  }

  confirmarJugada(): void {
    if (!this.cuadroPendiente) {
      return;
    }

    if (this.opcionElegida === '') {
      this.errorDialogo = 'Debes elegir mina o número.';
      return;
    }

    if (this.opcionElegida === 'mina') {
      this.cuadroPendiente.levantado = true;
      this.cuadroPendiente.esMina = true;
      this.cuadroPendiente.numero = null;

      this.totalLevantados++;
      this.juegoTerminado = true;
      this.mensajeEstado = `Juego terminado. Mina en fila ${this.cuadroPendiente.fila + 1}, columna ${this.cuadroPendiente.columna + 1}.`;

      this.limpiarDialogo();
      return;
    }

    const numeroLimpio = this.numeroEscrito.trim();

    if (!/^[1-8]$/.test(numeroLimpio)) {
      this.errorDialogo = 'Solo puedes escribir un número del 1 al 8.';
      return;
    }

    const minasAlrededor = Number(numeroLimpio);
    const fila = this.cuadroPendiente.fila;
    const columna = this.cuadroPendiente.columna;

    this.api.registrarResultado({
      fila,
      columna,
      minasAlrededor
    }).subscribe({
      next: () => {
        if (!this.cuadroPendiente) {
          return;
        }

        this.cuadroPendiente.levantado = true;
        this.cuadroPendiente.esMina = false;
        this.cuadroPendiente.numero = minasAlrededor;

        this.totalLevantados++;
        this.mensajeEstado = `Resultado registrado en fila ${fila + 1}, columna ${columna + 1}.`;

        this.limpiarDialogo();

        setTimeout(() => {
          this.pedirSiguienteJugada();
        }, 500);
      },
      error: (error: any) => {
        this.mensajeEstado = 'No se pudo registrar el resultado en el backend.';
        console.error('Error al registrar resultado:', error);
        console.error('Respuesta del backend:', error?.error);
      }
    });
  }

  cancelarJugada(): void {
    this.dialogoVisible = false;
    this.opcionElegida = '';
    this.numeroEscrito = '';
    this.errorDialogo = '';
    this.mensajeEstado = 'Jugada cancelada.';
  }

  reiniciarJuego(): void {
    this.api.reiniciarTablero().subscribe({
      next: () => {
        this.mensajeEstado = 'Tablero reiniciado. Creando uno nuevo...';

        setTimeout(() => {
          this.iniciarJuego();
        }, 250);
      },
      error: (error: unknown) => {
        this.mensajeEstado = 'No se pudo reiniciar el tablero.';
        console.error('Error al reiniciar tablero:', error);
      }
    });
  }

  limpiarDialogo(): void {
    this.dialogoVisible = false;
    this.cuadroPendiente = null;
    this.opcionElegida = '';
    this.numeroEscrito = '';
    this.errorDialogo = '';
  }

  obtenerTextoCuadro(cuadro: Cuadro): string {
    if (!cuadro.levantado) {
      return '';
    }

    if (cuadro.esMina) {
      return '✹';
    }

    if (cuadro.numero !== null) {
      return String(cuadro.numero);
    }

    return '';
  }

  obtenerClaseNumero(cuadro: Cuadro): string {
    if (!cuadro.levantado || cuadro.numero === null) {
      return '';
    }

    return `numero-${cuadro.numero}`;
  }

  esCuadroActual(cuadro: Cuadro): boolean {
    if (!this.cuadroActual) {
      return false;
    }

    return (
      cuadro.fila === this.cuadroActual.fila &&
      cuadro.columna === this.cuadroActual.columna
    );
  }
}