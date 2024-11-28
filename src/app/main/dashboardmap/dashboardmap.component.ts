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
declare var $: any;
let maxPointDistance = 20;

//https://github.com/kamilfurtak/ng-openlayers/blob/master/apps/demo-ng-openlayers/src/app/select-interaction/select-interaction.component.ts
@Component({
	selector: 'app-dashboardmap',
	//standalone: true,
	//imports: [PanelFloatNavComponent],
	templateUrl: './dashboardmap.component.html',
	styleUrl: './dashboardmap.component.css'
})
export class DashboardmapComponent implements OnInit {
	@ViewChild('map') map: MapComponent;
	constructor(private socket: SocketOne,
		private http: HttpClient,
		private personalService: PersonalService,
		private personaltypeService: PersonaltypeService,
		private routesService: RoutesService,
		private imagesService: ImagesService,
		private suggestionsService: SuggestionsService,
		private tracksService: TracksService,
		private wsapiService: WSapiService,
		private modalService: BsModalService
	) { }
	tabs: any = ['Dispositivos', 'Routes', 'Sugerencias'];
	//@ViewChild('markersLayer', { static: true }) markersLayer: LayerVectorComponent;
	@ViewChild('markersLayer') markersLayer: LayerVectorComponent;
	isMarkerLayer = (layer: OlLayer) => {
		//console.log("layer",layer['ol_uid']);
		//console.log("this.markersLayer",this.markersLayer);
		return layer === this.markersLayer?.instance;
	}

	ratio = 1;
	speed = 1;
	tracklatency = 5000;
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
	zoom: number = 18;
	personal = [];
	styleLineDash: number[] = [10.0, 10.0];
	public graticuleStyle = new Stroke({
		color: 'rgba(255,120,0,0.9)',
		width: 2,
		lineDash: [0.5, 4],
	});
	lineString = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: [
				[-68.0688635, -16.5319308],
				[-68.0698635, -16.5311108],
				[-68.0692635, -16.5311108],
			],
		},
	};
	lineString2 = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: [
				[-68.0688635, -16.5319308],
				[-68.0698635, -16.5311108],
			],
		},
	};

	marker = {
		lat: -16.5319308,
		lon: -68.0698635,
		id: '0',
		img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg'
	};
	marker2 = {
		lat: -16.5319308,
		lon: -68.0698635,
		id: '0',
		img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg'
	};

	tooltip = {
		lat: -16.5319308,
		lon: -68.0688635,
		text: 'Lorem ipsum dolor sit amet',
	};
	devices: any = Array();
	suggestions: any = Array();
	updateTimes = [
		{
			name: "suggestions",
			interval: 6000,
			last: 0,
			task: () => { this.loadSuggestions() }
		}
	];
	routes = [];
	selectedRoute: any;
	selectedLineString: any;
	selectedRoutes = [];
	maxdevices = 20;
	layerMap = 'osm';
	opacityMap = 1;
	multipleDevice = false;
	updateOpacity() {

	}
	updateTimesx() {
		this.http.get(`http://172.20.50.123:7676/adjust?ratio=${this.ratio}&speed=${this.speed}&tracklatency=${this.tracklatency}`).subscribe(res => {
			console.log("res", res);
		});
		console.log("updating with", "ratio:" + this.ratio, "speed:" + this.speed);
	}
	botStart() {
		this.http.get(`http://172.20.50.123:7676/start?maxdevices=${this.maxdevices}`).subscribe(res => {
			console.log("res", res);
		});
	}
	botReset() {
		this.http.get(`http://172.20.50.123:7676/reset?maxdevices=${this.maxdevices}`).subscribe(res => {
			console.log("res", res);
		});
	}
	routeToString(route: any): any {
		let coordinates = [];

		let LineString = {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [],
			},
		};
		route.points.forEach(point => {
			coordinates.push([point.lon, point.lat]);
		});
		LineString.geometry.coordinates = coordinates;
		console.log(LineString);
		return LineString;
	}

	selectRoute(route: any) {
		if (!this.selectedRoutes.includes(route))
			this.selectedRoutes.push(route);
		this.selectedRoute = route;

		console.log("this.selectedRoute", this.selectedRoute);
		const extent = this.selectedRoute.extend;
		const corner1 = transform([extent[0], extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2], extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0], corner1[1], corner2[0], corner2[1]];
		/*
		this.map.instance.getView().fit(extent3857, {
			padding: [100, 100, 100, 100],
			maxZoom: 23,
			duration: 300
		});	*/
		setTimeout(() => {
			if (route !== undefined) route.controls.show = true;

		}, 200);

	}
	cargarRoutes(callback) {
		this.routesService.getAll(200, 1, 'id', false, '').subscribe((result: any) => {
			let routes = result.content;
			routes.forEach((route: any) => {
				route['controls'] = this.createRouteControls();
			});
			console.log("cargarRoutes.routes", routes);
			this.routes = routes;
			if (callback != null) callback();
		});
	}
	loadSuggestions() {
		this.suggestionsService.getAll(100, 1, 'id', false, '').subscribe((result: any) => {
			if (this.suggestions.length == result.content.length) return;
			this.suggestions = result.content;
			this.suggestions.forEach((s: any) => this.suggestions['viewImage'] = false);
			this.tabs[2] = `Sugerencias(${this.suggestions.length})`
		});
	}
	loadImages(suggestion: any) {
		suggestion.viewImage = !suggestion.viewImage;
		console.log("loading images", suggestion.images);
		suggestion.images.forEach((image: any) => {
			console.log("typeof", typeof (image['image']));
			if (typeof (image['image']) === 'undefined') {
				console.log("loading image");
				this.imagesService.find(image.image_id).subscribe(
					(result: any) => {
						image['image'] = result.content[0];
						console.log("image['image']", image);
					}
				);
			}
		});
	}
	calcMs(time: number) {
		return Math.abs(new Date().getTime() - time);

	}
	updateConnection() {
		var milliseconds = new Date().getTime();
		//console.log(milliseconds);
		//console.log("this.devices", this.devices);
		//if (milliseconds-this.updateTimes[0].last > this.updateTimes[0].interval ) this.updateTimes[0].task();
		this.devices.forEach((device: any, index: number) => {
			if (device == undefined) return;
			//console.log(device);
			//console.log(device.last.t, milliseconds, device.last.t - milliseconds);
			if ((milliseconds - device.last.t) > 15000) {
				device.marker.img = device.marker.img.replaceAll('c1', 'c0');

			} else {
				device.marker.img = device.marker.img.replaceAll('c0', 'c1');
			}
		});
	}
	updateDevices() {
		this.devices.forEach((device: any, index: number) => {
			/*
			this.marker.lat = device.last.lat;
			this.marker.lon = device.last.lon;
			this.marker.id = device.id;
*/

			this.updateDeviceMarker(device);
		});
		this.tabs[0] = `Dispositivos(${this.devices.length})`;
	}
	updateDeviceMarker(device) {
		let bat = 'b0';
		let imgTmp = device.marker.img;
		if (device.last.bat > 0) bat = 'b0';
		if (device.last.bat > 10) bat = 'b1';
		if (device.last.bat > 30) bat = 'b2';
		if (device.last.bat > 85) bat = 'b3';
		imgTmp = imgTmp.replaceAll(/b[0-9]/g, bat);

		if (device.states?.IS_EMERGENCY == "1")
			imgTmp = imgTmp.replaceAll("e0", "e1");
		else
			imgTmp = imgTmp.replaceAll("e1", "e0");

		device.marker.img = imgTmp;

	}

	cargarPersonal(callback) {
		this.personalService.getSync().subscribe((result: any) => {
			this.personal = result.content;
			this.personal.forEach(persona => {
				persona['personal_type'] = this.personalType.find(pt => pt.id == persona.personal_type_id);
			});

			console.log("personal", this.personal);
			if (callback != null) callback();
		});
	}
	tracks = [];
	async loadTracks() {
		this.tracksService.getAll(1, 1, 'id', false, '').subscribe(async (res: any) => {
			this.tracks = res.content;
		});
	}
	localPosition = [-68.0698635, -16.5319308];
	templocalPosition = [-68.0698635, -16.5319308];
	isLocation = false;
	
	getLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((pos)=>{
			  //this.localPosition = pos;
			});
		  } else {
			
		  }
	 }
	updatePosition() {
		this.localPosition = this.templocalPosition;
	}
	setPost(coordinate) {
		console.log("setPost",coordinate);
		this.templocalPosition = coordinate;
		if (this.isLocation) {
			this.localPosition = this.templocalPosition;
		}
	}

	loadLocation() {
		//this.getLocation();
		let me = this;
		const geolocation = new Geolocation({
			projection: 'EPSG:4326',
			trackingOptions: {
				enableHighAccuracy: true
			},
			tracking: true
		});
		geolocation.setTracking(true);
		geolocation.on('change', function (evt) {
			me.setPost(geolocation.getPosition());
		});
		geolocation.on('error', function (evt) {
			window.console.log(evt.message);
		});
	}
	ngOnInit() {
		this.loadPersonalType(() => {
			this.cargarPersonal(() => {
				this.cargarRoutes(() => {
					//this.loadSuggestions();
					//this.loadTracks();
					setInterval(() => {
						this.updateConnection();
					}, 2000);
					setTimeout(() => {
						this.socketComm();
						this.loadLocation();
					}, 1000);
				});
			});
		});
	}
	personalType = [];
	loadPersonalType(callback) {
		this.personaltypeService.getAll().subscribe((res: any) => {
			this.personalType = res.content;
			console.log("this.personalType", this.personalType);
			if (callback != null) callback();
		});
	}
	splitPerZoom(array) {
		if (array.length < 100) return array;
		let zoom = (160 - Math.round(this.map.instance.getView().getZoom() * 5));
		console.log("zoom", zoom);
		let temp_array = [];
		for (let i = 0; i < array.length; i++) {
			if (i % zoom == 0)
				temp_array.push(array[i]);
		}
		return temp_array;
	}
	smoothSections(route) {
		this.routesService.smoothSections(route);
	}
	realized(coords) {
		return coords.map(s => s[2]);
	}
	gotoDevice(device) {
		this.devices.forEach(device => {
			device.controls.show = false;
			device.controls.showTrack = false;
			device.controls.showChecks = false;
			device.controls.showStops = false;
		});
		this.map.instance.getView().setCenter(transform([device.last.lon, device.last.lat], 'EPSG:4326', 'EPSG:3857'));
		this.map.instance.getView().setZoom(16);
		device.controls.show = true;
		//device.controls.showArea = true;
		device.controls.showTrack = true;
		device.controls.showChecks = true;
		device.controls.showStops = false;
		this.selectedDevice = device;
		this.loadAllRoute(device);
	}
	loadAllRoute(device) {
		//if (device['tracks'] !=undefined) return;
		if (device.states['ON_ROUTE'] == "1" && !device.controls.historic) {
			this.wsapiService.getTracks(device.id).subscribe((res: any) => {
				device['tracks'] = res.tracks;
				device['stops'] = this.routesService.getStops(device['tracks']);
				device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
				if (device.routeSelected != undefined) {
					device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
					console.log("device.routeSelected", device.routeSelected);
					console.log("completed:" + device.routeSelected['completed']);
				}
				device['isReady'] = true;

			}, (err: any) => console.log("err", err));
		} else {
			if(device.states['LAST_TRACK_ID']=="0"){
				this.wsapiService.getHistoryTracks(device.id).subscribe((res: any) => {
					device['tracks'] = res.tracks;
					device['stops'] = this.routesService.getStops(device['tracks']);
					device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
					if (device.routeSelected != undefined) {
						device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
						console.log("device.routeSelected", device.routeSelected);
						console.log("completed:" + device.routeSelected['completed']);
					}
					if( res.tracks.length==0 ){
						this.wsapiService.getTracks(device.id).subscribe((res: any) => {
							device['tracks'] = res.tracks;
							device['stops'] = this.routesService.getStops(device['tracks']);
							device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
							if (device.routeSelected != undefined) {
								device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
								console.log("device.routeSelected", device.routeSelected);
								console.log("completed:" + device.routeSelected['completed']);
							}
							device['isReady'] = true;
			
						}, (err: any) => console.log("err", err));
					}else
					device['isReady'] = true;

				}, (err: any) => console.log("err", err));
			}else{
				this.tracksService.find(device.states['LAST_TRACK_ID']).subscribe((res:any) => {
					console.log("LAST_TRACK_ID",res);
					if (res.content.length>0){
						device['tracks'] = res.content[0].trackb64;
						device['stops'] = this.routesService.getStops(device['tracks']);
						device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
						if (device.routeSelected != undefined) {
							device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
							console.log("device.routeSelected", device.routeSelected);
							console.log("completed:" + device.routeSelected['completed']);
						}
						
						device['isReady'] = true;
				}
			}, (err: any) => console.log("err", err));
			}
		}
	}
	createControls() {
		return {
			selected: false,
			show: false,
			showTrack: false,
			showPlayer: false,
			showChecks: false,
			showStops: false,
			tracksIn: false,
			tracksOut: false,
		};
	}
	createRouteControls() {
		return {
			selected: false,
			show: false,
			showSplit: false,
			showTrack: false,
			showArea: false,
		};
	}
	personal_filtrado = [];
	deviceList = [];

	conectar_persona() {
		this.personal_filtrado.forEach(p => {
			this.devices.forEach(device => {
				if (device.state["ID_USER"] == p.id) {
					p['device'] = device;
				}
			});
		});
	}
	toSeconds(duration) {
		let s = Math.round(duration / 1000);
		let m = s > 60 ? (s - s % 60) / 60 : -1;
		let h = m > 60 ? (m - m % 60) / 60 : -1;
		if (m == -1) return s + "s";
		if (h == -1) return m + "m";
		return h + 'h';
	}
	isDownloaded = false;

	countDownloads = 0;
	selectedDevice = null;
	modalRef?: BsModalRef;
	showReport(device, template) {
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-lg ',
		});
	}
	showPlayer(selectedDevice) {
		console.log("selectedDevice", selectedDevice);
		selectedDevice['selectedTrack'] = {
			trackb64: JSON.parse(JSON.stringify(selectedDevice.tracks.map(track => {
				return {
					't': parseInt(track.t),
					'lat': parseFloat(track.lat),
					'lon': parseFloat(track.lon),
					'bat': parseInt(track.bat),
					'acc': parseInt(track.acc),
				};
			}
			))),
			controls: {
				isPlayer: false
			}

		};
		//selectedDevice.controls['isPlayer'] = false;
		selectedDevice.selectedTrack['coords'] = selectedDevice.selectedTrack.trackb64.map(t => [t.lon, t.lat]);
		selectedDevice.selectedTrack['coordsPast'] = selectedDevice.selectedTrack.trackb64.map(t => [t.lon, t.lat]);
		selectedDevice.selectedTrack['route'] = selectedDevice.routeSelected;
		selectedDevice.selectedTrack['selectedRoute'] = selectedDevice.routeSelected;
		selectedDevice.controls.showPlayer = true;

	}
	closeModal() {
		this.modalRef.hide();
	}
	exportGeojson(device) {
		if (device.personal == null) throw ("no existe una persona asignada");
		if (device.tracks == null) throw ("trayecto no definidio");
		if (device.tracks.length == 0) throw ("no existe una trayectos");

		let geojson = this.routesService.tracksToGeojson(device.tracks, 'Ruta de ' + device.personal.name);
		let geojsonStr = JSON.stringify(geojson)

		const blob = new Blob([geojsonStr], { type: 'application/json' });
		const url = window.URL.createObjectURL(blob);
		var a = document.createElement("a");
		a.href = url;
		a.download = "tracks.geojson";
		a.click();
		URL.revokeObjectURL(url);
	}

	formatDevice(device, callback) {
		device['marker'] = { img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg' };
		device['msl'] = new Date().getTime();

		//device['routeSelected'] =  Object.assign({}, this.routes.find(r => r.id==device.states['ID_ROUTE'])); //{... this.routes.find(r => r.id==device.states['ID_ROUTE'])};
		device['routeSelected'] = this.routes.find(r => r.id == device.states['ID_ROUTE']);
		if (device['routeSelected'] != undefined) device['routeSelected'] = JSON.parse(JSON.stringify(device['routeSelected']));
		device['controls'] = this.createControls();
		device.ms = (new Date().getTime() - device.msl);
		device['personal'] = this.personal.find(p => p.id == device.states['ID_USER']);
		console.log("--formatDevice device.states['ID_USER'] :-- ", device.states['ID_USER']);
		if (callback != null) callback(device);
	}
	removeDevice(deviceData) {
		console.log("removeDevice",deviceData);

		let device = this.deviceList.find(d => d.id == deviceData.id);
		if (device != null)
			this.deviceList.splice(this.deviceList.indexOf(device), 1);

		let device1 = this.devices.find(d => d.id == deviceData.id);
		if (device1 != null)
			this.devices.splice(this.devices.indexOf(device1), 1);

		//this.filterDevices();
	}
	addDevice(deviceData) {
		let device = this.deviceList.find(d => d.id == deviceData.id);
		if (device == undefined) {
			device = deviceData;
			this.deviceList.push(device);
			this.formatDevice(device, null);
		}
		return device;
	}
	filterPersonalTypes = [9, 14];
	filterBattery = 1;
	filterEmergency = false;
	filterDevices() {
		//this.devices = this.deviceList;
		this.socket.emit("device.unsubscribe.all", '');
		console.log(this.filterPersonalTypes);
		let filterDevices = this.deviceList.filter(device => {
			//filtro por tipo
			return this.filterDevice(device);
		});

		let idsArray = filterDevices.map(d => d.id);
		this.devices = filterDevices;
		this.socket.emit("device.subscribe", idsArray);

		this.updateDevices();
	}
	verifyFilter(device) {
		console.log("verifyFilter. filterDevice :  ", device);
		if (this.filterDevice(device)) {
			let deviceExist = this.devices.find(d => d.id == device.id);
			if (deviceExist == null)
				this.devices.push(device);
			return true;
		}else{			
			let deviceExist = this.devices.find(d => d.id == device.id);
			if (deviceExist != null)
				this.devices.splice(this.devices.indexOf(deviceExist,1));
		}
		return false;
	}
	filterDevice(device) {
		let isValid = true;
		if (device.personal != null) {
			if (!this.filterPersonalTypes.includes(device.personal.personal_type_id))
				isValid = false;
		} else
			isValid = false;
		//filtro por bateria
		if (Object.keys(device.last).length == 0)
			isValid = false;

		/*if ((device.last['bat'] < this.filterBattery))
			isValid = false;*/
		//filtro por estado:emergencia
		if (!(device.states['IS_EMERGENCY'] == this.filterEmergency))
			isValid = false;
		return isValid;
	}
	tasks = [];
	taskLength = 0;
	taskCompleted = 0;
	taskState = 'stopped';

	addTask(task) {
		this.tasks.push(task);
		this.nextTask();
	}
	nextTask() {

		if (this.taskState == "stopped") {
			this.taskState = "running";
			this.tasks[this.taskLength](() => {
				this.taskCompleted++;
				if (this.taskCompleted < this.tasks.length) {
					this.taskState = "stopped";
					this.nextTask();
				}
			});
		}

	}
	socketComm() {
		this.socket.emit('message', "enviando");
		this.socket.on('message', (msg: any) => {
			console.log('mensaje:', msg);
		});
		this.socket.on('devices', (devicesData: any) => {
			console.log('devices:', devicesData);
			this.deviceList = devicesData;
			this.deviceList.forEach((device: any, index: number) => {
				this.formatDevice(device, null);
			});
			this.filterDevices();
		});

		this.socket.on('device.session.start', (deviceData: any) => {
			console.log('device.session.start', deviceData);
			this.addDevice(deviceData);
		});
		this.socket.on('device.new', (deviceData: any) => {
			console.log('device.new ', deviceData);
			this.addDevice(deviceData);
		});

		this.socket.on('device.session.end', (deviceData: any) => {//disconnected
			console.log('device.session.end', deviceData);
			this.removeDevice(deviceData);
		});
		this.socket.on('server.suggestion.new', (suggestionData: any) => {
			console.log('server.suggestion.new', suggestionData);
		/*	this.suggestions.find(suggestionData.id).subscribe((suggestion)=>{
				if (suggestion.content.audio.length>0)
					suggestion.content.session.device_id
			});*/
		});
		this.socket.on('server.claim.new', (claimData: any) => {
			console.log('server.claim.new', claimData);
		});
		this.socket.on('server.emergency.new', (emergencyData: any) => {
			console.log('server.emergency.new', emergencyData);
		});
		this.socket.on('device.emergency', (deviceData: any) => {
			console.log('server.emergency', deviceData);
		});

		this.socket.on('device', (deviceData) => {
			console.log('device.new ', deviceData);
			let device = this.addDevice(deviceData);
			this.formatDevice(device, (deviceFormated) => {
				console.log('device.session.start formatDevice', deviceFormated);
				if (this.verifyFilter(deviceFormated)) {
					this.socket.emit("device.subscribe", [deviceFormated.id]);
				}
			});
			/*
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				device = data;
				this.devices.push(device);
			}
			device.marker = { img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg' };
			device['msl'] = new Date().getTime();
			device['routeSelected'] = this.routes.find(r => r.id == device.states['ID_ROUTE']);
			if (device['routeSelected'] != undefined) device['routeSelected'] = JSON.parse(JSON.stringify(device['routeSelected']));
			device['tracksCoord'] = [];
			device['controls'] = this.createControls();
			device.ms = (new Date().getTime() - device.msl);
			device['personal'] = this.personal.find(p => p.id == device.states['ID_USER']);
*/
		});

		this.socket.on('device.state', (data: any) => {
			console.log('device.state', data);

			let device = this.deviceList.find((d: any) => d.id == data.id);

			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}

			if (device.states['ID_USER'] != data.states['ID_USER']) 
				device['personal'] = this.personal.find(p => p.id == data.states['ID_USER']);
			if (device.states['ID_ROUTE'] != data.states['ID_ROUTE']) {
				Object.keys(data.states).forEach(k => device.states[k] = data.states[k]);
				device['routeSelected'] = this.routes.find(r => r.id == device.states['ID_ROUTE']);
				if (device['routeSelected'] != undefined) {
					device['routeSelected'] = JSON.parse(JSON.stringify(device['routeSelected']));
					device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
				}
			} else
				Object.keys(data.states).forEach(k => device.states[k] = data.states[k]);
			//this.formatDevice(device, null);
			this.updateDeviceMarker(device);
			this.verifyFilter(device);
		});
		this.socket.on('device.config', (data: any) => {
			console.log('device.config', data);
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}
			Object.keys(data.config).forEach(k => device.config[k] = data.config[k]);
		});
		this.socket.on('device.setup', (data: any) => {
			console.log('device.setup', data);
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}
			device.setup = data.setup;
		});
		this.socket.on('device.tracks', (data: any) => {
			console.log('device.tracks', data);
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}
			device.tracks = data.tracks;
			device['stops'] = this.routesService.getStops(device['tracks']);
			device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
			if (device.routeSelected != null) {
				device['routeSelected'] = this.routes.find(r => r.id == device.states['ID_ROUTE']);
				if (device['routeSelected'] != undefined) device['routeSelected'] = JSON.parse(JSON.stringify(device['routeSelected']));
				device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
				device['isReady'] = true;
			}
		});
		this.socket.on('device.pause', (data: any) => {
			console.log('device.pause', data.id);
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}
			device.last = data.last;
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();

			this.updateDeviceMarker(device);

		});
		this.socket.on('device.last', (data: any) => {
			let device = this.deviceList.find((d: any) => d.id == data.id);
			if (device == null) {
				this.socket.emit("device", data.id);
				return;
			}
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();
			device.last = data.last;
			if (!device['isReady']) return;
			this.updateDeviceMarker(device);
			if (device.states?.ON_ROUTE == "0") return;
			device['tracks'].push(data.last);
			device['stops'] = this.routesService.getStops(device['tracks']);
			device['tracksCoord'] = device['tracks'].map(t => [t.lon, t.lat]);
			if (device['routeSelected'] != null) {
				device.routeSelected['completed'] = this.routesService.checkPointLast(device['routeSelected'], data.last, maxPointDistance);
			} else {
				device['routeSelected'] = this.routes.find(r => r.id == device.states['ID_ROUTE']);
				if (device['routeSelected']!=null)
					device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'], device['tracks'], maxPointDistance);
			}
		});

	}

	select($event: SelectEvent) {
		console.log($event);
	}
}