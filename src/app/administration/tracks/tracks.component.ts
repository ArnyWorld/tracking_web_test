import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonalService } from '../../api/personal.service';
import { RoutesService } from '../../api/routes.service';
import { AssignmentsService } from '../../api/assignments.service';
import { QrCodeModule } from 'ng-qrcode';
import { ImagesService } from '../../api/images.service';
import { environment } from '../../../environments/environment';
import { ScheduleService } from '../../api/schedule.service';
import { PersonaltypeService } from '../../api/jobroutes.services';
import { SessionsService } from '../../api/sessions.service';
import { WSapiService } from '../../api/wsapi.service';
import { DevicesService } from '../../api/devices.service';
import { TracksService } from '../../api/tracks.service';


import { AngularOpenlayersModule, FeatureComponent, MapComponent } from 'ng-openlayers';

import { Layer as OlLayer } from 'ol/layer';
import { elementAt, map } from 'rxjs/operators';
import { transform, fromLonLat } from 'ol/proj';
import { Stroke } from 'ol/style';
import { SelectEvent } from 'ol/interaction/Select';
import { LayerVectorComponent } from 'ng-openlayers';
import { PanelFloatNavComponent } from '../../panel-float-nav/panel-float-nav.component';
import { SuggestionsService } from '../../api/suggestions.service';
import { HttpClient } from '@angular/common/http';
import { identifierName } from '@angular/compiler';
import * as olSphere from 'ol/sphere';


@Component({
	selector: 'app-tracks',
	standalone: true,
	providers: [BsModalService],
	imports: [AngularOpenlayersModule, CommonModule, FormsModule, ReactiveFormsModule, QrCodeModule],
	templateUrl: './tracks.component.html',
	styleUrl: './tracks.component.css',
})
//TREBOL-15 Para verificación servicio de control de sesiones
export class TracksComponent implements OnInit {
	@ViewChild('map') map: MapComponent;

	modalRef?: BsModalRef;
	constructor(
		private personalApi: PersonalService,
		private sessionsService: SessionsService,
		private personaltypeService: PersonaltypeService,
		private AssignmentsService: AssignmentsService,
		private assignmentsPersonalService: AssignmentsService,
		private routesService: RoutesService,
		private modalService: BsModalService,
		private imagesService: ImagesService,
		private tracksService: TracksService,
		private scheduleService: ScheduleService,
		private deviceService: DevicesService,
		private wsapiService: WSapiService
	) { }
	serverApi = environment.apiserver;
	personal = {
		id: '',
		name: '',
		code: '',
		image_id: '',
		image: null,
		personal_type_id: '',
		schedule_id: 1,
	};
	Schedules = [];
	Assignments = [];

	keyword = '';
	countSession = 0;

	selectedTrack: any;
	selectedRoute: any;
	routes: any[];
	personals: any[];
	personalType: any[];
	personalFiltred: any[];
	sessions: any[];
	sessionsFiltred;
	dbDevices: any[];
	noDevices = [];
	devices: any[];
	devicesFilter: any[];
	interpolate = true;

	ngOnInit(): void {
		this.load();
	}
	filtrar() {
		if (this.keyword == '') {
			this.personalFiltred = this.personals;
			return;
		}
		if (this.keyword.length < 3) return;
		this.personalFiltred = this.personals.filter((p: any) => {
			return p.name.toLowerCase().includes(this.keyword.toLowerCase());
		});
	}
	keys(obj) {
		return Object.keys(obj);
	}

	createControls() {
		return {
			isPlayer: false,
		};
	}
	player = {
		length: 0,
		currentTime: 0,
		currentRealTime: 0,
		startRealTime: 0,
		step: 1,
		min: 1,
		timeout: 10,
		isPlaying: false,
		speed: 1,
		thread: null,
	}

	updatePlayer() {
		this.selectedTrack['coordsPast'] = this.selectedTrack['coords'].filter((c, i) => i <= this.player.currentTime);
		this.player.currentRealTime = this.selectedTrack['trackb64'][this.selectedTrack['coordsPast'].length - 1].t;
	}

	updatePlayerRealTime() {
		this.selectedTrack['coordsPast'] = this.selectedTrack['trackb64'].filter((track, i) => track.t <= this.player.currentRealTime).map(t => [t.lon, t.lat]);
		this.player.currentTime = this.selectedTrack['coordsPast'].length - 1;

		const a = this.selectedTrack['coords'][this.selectedTrack['coordsPast'].length - 1];
		if (this.interpolate){
			const b = this.selectedTrack['coords'][this.selectedTrack['coordsPast'].length];
			const iLon = a[0] + (b[0] - a[0])/2;
			const iLat = a[1] + (b[1] - a[1])/2;
			console.log("iLon iLat" ,iLon,iLat)
			
			this.map.instance.getView().setCenter(transform([iLon, iLat], 'EPSG:4326', 'EPSG:3857'));
		}else{			
			this.map.instance.getView().setCenter(transform([a[0], a[1]], 'EPSG:4326', 'EPSG:3857'));
		}
	}
	round(v) {
		return Math.round(v * 100) / 100;
	}
	calcSpeed(track, time) {
		const a = track.trackb64[time];
		const b = track.trackb64[time - 1];
		const t = (a.t - b.t) / 1000;
		const d = olSphere.getDistance([a.lon, a.lat], [b.lon, b.lat]);
		const v = d / t;
		if (v > 2)
			return this.round(v * 3600 / 1000) + 'km/h';
		else
			return this.round(v) + 'm/s';
	}
	setBattery(track, time) {
		return track.trackb64[time].bat+'%';
	}
	setAccuracy(track, time){
		const acc = track.trackb64[time].acc;
		if (acc<12) return `buena (${acc}mts)`;
		if (acc<24) return `regular (${acc}mts)`;
		return `mala (${acc}mts)`;
	}
	loadRoute(assignment){
		this.routesService.find(assignment.route.id).subscribe(routeResponse=>{			
			if (routeResponse.content.length>0){
				assignment.route = routeResponse.content[0];
				this.routesService.setupSections(assignment.route);
				this.selectedRoute = routeResponse.content[0];				
				this.selectedRoute = assignment.route;
				console.log("loadRoute.selectedRoute",this.selectedRoute);
			}
		});
	}
	loadTrack(track,assignment) {
		this.tracksService.find(track.id).subscribe((trackResult: any) => {
			if (trackResult.content != null) {
				if (trackResult.content.length > 0) {
					this.loadRoute(assignment);

					track = trackResult.content[0];
					track['controls'] = this.createControls();
					console.log("track", track);
					this.tracksService.getExtend(track);
					this.map.instance.getView().fit(track.extend_3857, {
						padding: [100, 100, 100, 100],
						maxZoom: 18,
						duration: 300
					});
					this.player.currentTime = track.coords.length - 1;
					this.player.length = track.coords.length - 1;
					this.player.min = 1;
					this.player.startRealTime = track.trackb64[0].t;
					this.player.currentRealTime = this.player.startRealTime;
					this.player.step = 1;
					this.player.isPlaying = false;
					track['coordsPast'] = track.coords;
					this.selectedTrack = track;
					
				}
			}
		});
	}
	startPlayer() {
		if (!this.player.isPlaying) {
			this.player.isPlaying = true;
			this.playing();
		}
	}
	stopPlayer() {
		this.player.isPlaying = false;
		this.updatePlayer();
	}
	rewindPlayer() {
		this.player.currentTime = 1;
		this.updatePlayer();
	}
	forwardPlayer() {
		this.player.currentTime = this.player.length;
		this.updatePlayer();
	}
	rewindPlayerOne() {
		this.player.currentTime -= 1;
		this.updatePlayer();
	}
	forwardPlayerOne() {
		this.player.currentTime += 1;
		this.updatePlayer();
	}
	playing() {
		if (this.player.isPlaying) {
			setTimeout(() => {
				//if (this.player.currentTime+1>=this.player.length){ this.player.isPlaying=false ; return;}
				this.player.currentRealTime += this.player.speed * this.player.timeout;
				this.updatePlayerRealTime();
				this.playing();

			}, this.player.timeout);
		}
	}
	load() {
		this.routesService.getList().subscribe((res: any) => {
			this.routes = res.content;
			console.log("----this.routes",this.routes)
			this.personalApi.getAll2().subscribe((res: any) => {
				this.personals = res.content;
				this.personalFiltred = this.personals;
				this.personals.forEach((personal: any) => {
					this.assignmentsPersonalService.findByPersonal(personal.id).subscribe((assignment: any) => {
						personal['assignments'] = assignment.content;
						personal['assignments'].forEach((assignment => {
							assignment['route'] = this.routes.find(r => r.id == assignment.route_id);
							this.tracksService.findByAssignment(assignment.id).subscribe((tracks: any) => {
								assignment['tracks'] = tracks.content;
							});
						}));
					});
				});

			});
			console.log('this.personalType', this.personalType);
		});
		this.personaltypeService.getAll().subscribe((res: any) => {
			this.personalType = res.content;
			console.log('this.personalType', this.personalType);
		});
		this.scheduleService.getAll().subscribe((res: any) => {
			this.Schedules = res.content;
			console.log('this.Schedules', this.Schedules);
		});
	}
}
