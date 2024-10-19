import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';

import { transform, fromLonLat } from 'ol/proj';
import * as olSphere from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { PointsService } from './points.service';

@Injectable({
  providedIn: 'root',
})
export class LocalDB {
  DB;

  constructor(private http: HttpClient) {}

  haveDB(){}
  getAll(){}
  update(){}
}
