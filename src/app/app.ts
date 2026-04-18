import { Component } from '@angular/core';
import { BuscaMinasComponent } from './buscaMinas/buscaMinas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BuscaMinasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}