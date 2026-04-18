import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface CrearTableroRequest {
  totalMinas: number;
}

interface ResultadoJugadaRequest {
  fila: number;
  columna: number;
  minasAlrededor: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuscaMinasApi {
  private http = inject(HttpClient);
  private urlBase = 'http://localhost:3000/ia';

  crearTablero(totalMinas: number): Observable<unknown> {
    const data: CrearTableroRequest = { totalMinas };
    return this.http.post(`${this.urlBase}/crear-tablero`, data);
  }

  siguienteJugada(): Observable<unknown> {
    return this.http.post(`${this.urlBase}/siguiente-jugada`, {});
  }

  registrarResultado(data: ResultadoJugadaRequest): Observable<unknown> {
    return this.http.post(`${this.urlBase}/registrar-resultado`, data);
  }

  reiniciarTablero(): Observable<unknown> {
    return this.http.post(`${this.urlBase}/reiniciar-tablero`, {});
  }

  verTablero(): Observable<unknown> {
    return this.http.get(`${this.urlBase}/ver-tablero`);
  }
}