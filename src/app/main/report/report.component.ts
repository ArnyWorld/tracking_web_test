import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularOpenlayersModule, FeatureComponent, MapComponent } from 'ng-openlayers';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { SocketOne } from '../main.module';
import { Layer as OlLayer } from 'ol/layer';
import { map } from 'rxjs/operators';
import { transform, fromLonLat } from 'ol/proj';
import { Stroke } from 'ol/style';
import { SelectEvent } from 'ol/interaction/Select';
import { LayerVectorComponent } from 'ng-openlayers';
import { PanelFloatNavComponent } from '../../panel-float-nav/panel-float-nav.component';
import { PersonalService } from '../../api/personal.service';
import { RoutesService } from '../../api/routes.service';
import { WSapiService } from '../../api/wsapi.service';
import { SuggestionsService } from '../../api/suggestions.service';
import { ImagesService } from '../../api/images.service';
import { TracksService } from '../../api/tracks.service';
import { HttpClient } from '@angular/common/http';
import { identifierName } from '@angular/compiler';
import { PersonaltypeService } from '../../api/jobroutes.services';
import Geolocation from 'ol/Geolocation.js';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
	layerMap = "osm";
	opacityMap = 1;
	zoom = 18;

	ngOnInit() {
		console.log("created map");
		
	}
	
}
