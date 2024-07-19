import { Component, OnInit,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'zone.js';
import { OlmapComponent } from '../../tools/olmap/olmap.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,OlmapComponent ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  @ViewChild('map') map: any;
  constructor() {}

  feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-2.3565673828124996, 46.92588289494367],
          [-2.1148681640624996, 46.92588289494367],
          [-2.1148681640624996, 47.04954010021555],
          [-2.3565673828124996, 47.04954010021555],
          [-2.3565673828124996, 46.92588289494367],
        ],
      ],
    },
  };

  marker = {
    lon: -2.264184,
    lat: 46.996207,
  };

  ngOnInit() {
    
  }
}
