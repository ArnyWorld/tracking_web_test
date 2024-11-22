import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';

import * as olSphere from 'ol/sphere';
import { transform, fromLonLat } from 'ol/proj';
import { MapComponent } from 'ng-openlayers';
import { PersonalService } from '../../api/personal.service';
import { SessionsService } from '../../api/sessions.service';
import { PersonaltypeService } from '../../api/jobroutes.services';
import { RoutesService } from '../../api/routes.service';
import { WSapiService } from '../../api/wsapi.service';
import { DevicesService } from '../../api/devices.service';
import { ScheduleService } from '../../api/schedule.service';
import { TracksService } from '../../api/tracks.service';
import { ImagesService } from '../../api/images.service';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-trackplayer',
  templateUrl: './trackplayer.component.html',
  styleUrl: './trackplayer.component.css'
})
export class TrackplayerComponent {
	@ViewChild('map') map: MapComponent;
	@Output() onClose = new EventEmitter();
	
	@Input() trackData ;
	/*
	@Output()
	change: EventEmitter<number> = new EventEmitter<number>();
*/
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
	interpolate = false;
	//tracksData;
	currentTrack;
	constructor(
		private personalApi: PersonalService,
		private sessionsService: SessionsService,
		private personaltypeService: PersonaltypeService,
		private routesService: RoutesService,
		private modalService: BsModalService,
		private imagesService: ImagesService,
		private tracksService: TracksService,
		private scheduleService: ScheduleService,
		private deviceService: DevicesService,
		private wsapiService: WSapiService
	){}
	ngOnInit(): void {
		this.load();
		console.log("tracks",this.trackData);
		this.loadTrack(this.trackData);
	}
	close(){
		console.log("cerrando");
		this.onClose.emit();
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
		speed: 5,
		thread: null,
	}
	updatePlayer() {
		this.selectedTrack['coordsPast'] = this.selectedTrack['coords'].filter((c, i) => i <= this.player.currentTime);
		this.selectedTrack['track'] = this.selectedTrack['trackb64'][this.selectedTrack['coordsPast'].length - 1];
		
		this.player.currentRealTime = this.selectedTrack['trackb64'][this.selectedTrack['coordsPast'].length - 1].t;
	}
	updatePlayerRealTime() {
		//console.log("this.selectedTrack['trackb64']",this.selectedTrack['trackb64']);		
		this.selectedTrack['coordsPast'] = this.selectedTrack['trackb64'].filter((track, i) => track.t <= this.player.currentRealTime).map(t => [t.lon, t.lat]);
		this.player.currentTime = this.selectedTrack['coordsPast'].length - 1;
		this.selectedTrack['track'] = this.selectedTrack['trackb64'][this.selectedTrack['coordsPast'].length - 1];

		const a = this.selectedTrack['coords'][this.selectedTrack['coordsPast'].length - 1];
		if (this.interpolate){
			const b = this.selectedTrack['coords'][this.selectedTrack['coordsPast'].length];
			const iLon = a[0] + (b[0] - a[0])/2;
			const iLat = a[1] + (b[1] - a[1])/2;
			console.log("iLon iLat" ,iLon,iLat)
			//this.map.instance.getView().setCenter(transform([iLon, iLat], 'EPSG:4326', 'EPSG:3857'));
		}else{			
			//this.map.instance.getView().setCenter(transform([a[0], a[1]], 'EPSG:4326', 'EPSG:3857'));
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
		/*this.routesService.find(assignment.route.id).subscribe(routeResponse=>{			
			if (routeResponse.content.length>0){
				assignment.route = routeResponse.content[0];
				this.routesService.setupSections(assignment.route);
				this.selectedRoute = routeResponse.content[0];				
				this.selectedRoute = assignment.route;
				console.log("loadRoute.selectedRoute",this.selectedRoute);
			}
		});*/
	}
	loadTrack(trackData) {
		this.selectedTrack = trackData;
		this.tracksService.getExtend(this.selectedTrack);
		this.selectedTrack['player'] = this.player;
		this.player.currentTime = 0;//this.selectedTrack.coords.length - 1;
		this.player.length = this.selectedTrack.coords.length - 1;
		this.player.min = 1;
		this.player.startRealTime = this.selectedTrack.trackb64[0].t;
		this.player.currentRealTime = this.player.startRealTime;
		this.player.step = 1;
		this.player.isPlaying = false;
		this.updatePlayer();
			
	}
	startPlayer() {
		console.log("this.selectedTrack['trackb64']",this.selectedTrack['trackb64']);
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
	}
}
