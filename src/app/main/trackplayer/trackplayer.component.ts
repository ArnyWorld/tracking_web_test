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

	selectedTracks = [];
	selectedRoutes: any;

	//selectedTrack: any;
	selectedRoute: any;
	routes: any[];
	personals: any[];
	personalType: any[];
	personalFiltred: any[];
	sessions: any[];
	dbDevices: any[];
	noDevices = [];
	devices: any[];
	devicesFilter: any[];
	interpolate = false;
	constructor(
		private tracksService: TracksService,
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
		step: 60000,
		min: 1,
		endRealTime: 1000,
		timeout: 100,
		isPlaying: false,
		speed: 5,
		thread: null,
	}
	updatePlayer() {
		console.log("this.player.currentRealTime",this.player.currentRealTime);
		this.selectedTracks.forEach( selectedTrack =>{
			selectedTrack.player.currentRealTime = this.player.currentRealTime;
		});
		this.updatePlayerRealTime();
	}
	updatePlayerRealTime() {
		this.selectedTracks.forEach( selectedTrack =>{
			selectedTrack['coordsPast'] = selectedTrack['trackb64'].filter((track, i) => track.t <= this.player.currentRealTime).map(t => [t.lon, t.lat]);
			selectedTrack.player.currentTime = selectedTrack['coordsPast'].length - 1;
			selectedTrack['track'] = selectedTrack['trackb64'][selectedTrack['coordsPast'].length - 1];
	
			const a = selectedTrack['coords'][selectedTrack['coordsPast'].length - 1];
			
		});
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
	loadTrack(trackData) {
		let size = -1;
		let startRealTime = 4131377580000;
		let endRealTime = -1;
		trackData.forEach( selectedTrack=>{
			let player = {
				length: 0,
				currentTime: 0,
				currentRealTime: 0,
				startRealTime: 0,
				endRealTime: 0,
				step: 1,
				min: 1,
				timeout: 10,
				isPlaying: false,
				speed: 5,
				thread: null};
			player.currentTime = 0;
			player.length = selectedTrack.coords.length - 1;
			player.min = 1;
			if (selectedTrack.trackb64.length>0){
				player.startRealTime = selectedTrack.trackb64[0].t;
				player.endRealTime = selectedTrack.trackb64[selectedTrack.trackb64.length-1].t
				player.currentRealTime = player.startRealTime;
			}
			player.step = 1;
			player.isPlaying = false;
			selectedTrack.player = player;
			this.tracksService.getExtend(selectedTrack);			
			this.selectedTracks.push(selectedTrack);	
			if (player.length > size)
				size = player.length;
			if (player.startRealTime < startRealTime)
				startRealTime = player.startRealTime
			if (player.endRealTime > endRealTime)
				endRealTime = player.endRealTime;
		});
		
		this.player.currentTime = 0;//this.selectedTrack.coords.length - 1;
		this.player.length = size;
		this.player.min = 1;
		this.player.startRealTime = startRealTime;
		this.player.endRealTime = endRealTime;
		this.player.currentRealTime = this.player.startRealTime;
		this.player.step = 1;
		this.player.isPlaying = false;
		this.updatePlayer();
			
	}
	startPlayer() {		
		this.player.isPlaying = true;
		this.playing();
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
				if (this.player.currentTime+this.player.speed * this.player.timeout>=this.player.endRealTime){ this.player.isPlaying=false ; return;}
				this.player.currentRealTime += this.player.speed * this.player.timeout;		
				this.selectedTracks.forEach(selectedTrack => {
					selectedTrack.player.currentRealTime = this.player.currentRealTime;					
				});			
				this.updatePlayerRealTime();			
				this.playing();

			}, this.player.timeout);
		}
	}
	load() {

	}
}
