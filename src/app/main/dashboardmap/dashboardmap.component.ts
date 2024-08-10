import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularOpenlayersModule, FeatureComponent,MapComponent } from 'ng-openlayers';

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
		private personalService: PersonalService,
		private routesService: RoutesService,
		private imagesService: ImagesService,
		private suggestionsService: SuggestionsService,
		private tracksService: TracksService,
		private wsapiService: WSapiService
	) { }
	tabs:any = ['Dispositivos','Routes','Sugerencias'];
	//@ViewChild('markersLayer', { static: true }) markersLayer: LayerVectorComponent;
	@ViewChild('markersLayer') markersLayer: LayerVectorComponent;
	isMarkerLayer = (layer: OlLayer) => {
		//console.log("layer",layer['ol_uid']);
		//console.log("this.markersLayer",this.markersLayer);
		return layer === this.markersLayer?.instance;
	}

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
	updateTimes= [
		{
			name:"suggestions", 
			interval: 6000,
			last: 0,
			task: ()=> {this.loadSuggestions()}
		}
	];
	routes = [];
	selectedRoute:any;
	selectedLineString:any;
	selectedRoutes = [];

	routeToString(route:any):any{
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
	
	selectRoute (route:any){
		if (!this.selectedRoutes.includes(route))
			this.selectedRoutes.push(route);
		this.selectedRoute = route;
				
		console.log("this.selectedRoute",this.selectedRoute);
		const extent = this.selectedRoute.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];
		
		this.map.instance.getView().fit(extent3857, {
			padding: [100, 100, 100, 100],
			maxZoom: 23,
			duration: 300
		});	
		setTimeout(() => {
			if (route!== undefined) route.controls.show = true;
		}, 200);
	}
	cargarRoutes(callback) {
		this.routesService.getAll(200, 1, 'id',false,'').subscribe((result: any) => {
			let routes = result.content;
			routes.forEach( (route:any)=>{				
				route['controls'] = this.createRouteControls();				
			});
			console.log("cargarRoutes.routes" , routes);
			this.routes = routes;
			if (callback!=null) callback();
		});
	}
	loadSuggestions(){
		this.suggestionsService.getAll(100, 1, 'id',false,'').subscribe((result: any) => {
			if (this.suggestions.length == result.content.length) return;
			this.suggestions = result.content;
			this.suggestions.forEach((s:any) =>this.suggestions['viewImage']=false );
			this.tabs[2] = `Sugerencias(${this.suggestions.length})`
		});
	}
	loadImages(suggestion:any){
		suggestion.viewImage=!suggestion.viewImage;
		console.log("loading images",suggestion.images);
		suggestion.images.forEach((image:any) => {
			console.log("typeof", typeof(image['image']));
			if (typeof(image['image']) ===  'undefined'){
				console.log("loading image");
				this.imagesService.find(image.image_id).subscribe(
					(result:any)=>{
						image['image'] = result.content[0];
						console.log("image['image']",image);
					}
				);
			}
		});
	}
	calcMs(time:number){
		return Math.abs(new Date().getTime() - time);

	}
	updateConnection() {
		var milliseconds = new Date().getTime();
		//console.log(milliseconds);
		//console.log("this.devices", this.devices);
		//if (milliseconds-this.updateTimes[0].last > this.updateTimes[0].interval ) this.updateTimes[0].task();
		this.devices.forEach((device: any, index: number) => {
			if (device==undefined) return;
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
	updateDeviceMarker(device){
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
	
	cargarPersonal(callback){
		this.personalService.getSync().subscribe((result: any) => {
			this.personal = result.content;
			console.log("personal",this.personal);
			if (callback!=null) callback();
		});
	}
	tracks = [];
	async loadTracks(){
		this.tracksService.getAll(1,1,'id',false,'').subscribe(async (res:any)=>{
			this.tracks = res.content;
		});
	}
	ngOnInit() {
		this.cargarPersonal(()=>{
			this.cargarRoutes(()=>{
				//this.loadSuggestions();
				//this.loadTracks();
				setInterval(() => {
					this.updateConnection();
					
				}, 2000);
				setTimeout(() => {
					this.socketComm();
				}, 1000);
			});
		});
	}
	gotoDevice(device){
		this.map.instance.getView().setCenter(transform([device.last.lon, device.last.lat], 'EPSG:4326', 'EPSG:3857'));
		this.map.instance.getView().setZoom(16);
		device.controls.show = true;
		device.controls.showTrack = true;
	}
	createControls(){
		return {
			selected:false,
			show:false,
			showTrack:false,
		};
	}
	createRouteControls(){
		return {
			selected:false,
			show:false,
			showSplit:false,
			showTrack:false,
		};
	}
	personal_filtrado = [];

	conectar_persona(){
		this.personal_filtrado.forEach( p=>{
			this.devices.forEach(device => {
				if (device.state["ID_USER"] == p.id){
					p['device'] = device;
				}
			});
		});
	}

	socketComm(){
		this.socket.emit('message', "enviando");
		this.socket.on('message', (msg: any) => {
			console.log('mensaje:', msg);
		});
		this.socket.on('devices', (data: any) => {			
			console.log('devices:', data);
			this.devices = data;
			this.devices.forEach((device: any, index: number) => {
				device.marker = {img:'assets/ic_device/ic_device_l0_e0_c0_b0.svg'};
				device['msl'] = new Date().getTime();
			
				device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
				
				device['controls'] = this.createControls();
				device.ms = (new Date().getTime() - device.msl);
				device['personal'] = this.personal.find(p => p.id == device.states['ID_USER']);
				

				this.wsapiService.getTracks(device.id).subscribe( (res:any)=>{
					device['tracks'] = res.tracks;
					device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'] , device['tracks'],10);

					/*console.log("this.wsapiService",res);
					let tracksCoord = [];
					device['tracks'] = res.tracks;
					res.tracks.forEach(track => {						
						tracksCoord.push([track.lon, track.lat]);
					});
					device['tracksCoord'] = tracksCoord;					
					console.log("this.calculating");	
					device['tracksPolyline'] = [];
					device['PolyRouteTrack'] = [];
					if (device['routeSelected'] !=null){						
						device['PolyRouteTrack'] = this.routesService.createPolyRouteTrack(device['routeSelected']);
						device.routeSelected['completed'] = this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10);				
						device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
						//device.routeSelected['completed'] = Math.round(device['routeSelected']['sections'].reduce((ac, sec)=> ac+sec.splitCoords.reduce((addsc, sc)=> addsc+1,0 ) ,0) / device['splitPointsCoordsCheck'].length);
					}*/
				},(err:any)=>console.log("err",err));
				
			});
			this.updateDevices();
		});
		this.socket.on('device', (data)=>{	//nuevo dispositivo
			console.log('device',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null)
				device = data;
			this.devices.push(device);
			
			device.marker = {img:'assets/ic_device/ic_device_l0_e0_c0_b0.svg'};
			device['msl'] = new Date().getTime();
			//if (device.states['ID_ROUTE'] != data.states['ID_ROUTE'])
			device['routeSelected'] = {... this.routes.find(r => r.id==device.states['ID_ROUTE'])};
			//device['tracksCoord'] = [];
			device['controls'] = this.createControls();
			device.ms = (new Date().getTime() - device.msl);
			device['personal'] = this.personal.find(p => p.id == device.states['ID_USER']);
			this.wsapiService.getTracks(device.id).subscribe( (res:any)=>{
				//console.log("this.wsapiService",res);
				//let tracksCoord = [];
				device['tracks'] = res.tracks;
				/*res.tracks.forEach(track => {						
					tracksCoord.push([track.lon, track.lat]);
				});*/
				//device['tracksCoord'] = tracksCoord;					
				//console.log("this.calculating");	
				//device['tracksPolyline'] = [];
				//device['PolyRouteTrack'] = [];
								
				device.routeSelected['completed'] = this.routesService.checkPoints(device['routeSelected'] , device['tracks'],10);
					//device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
					//device.routeSelected['completed'] = device['PolyRouteTrack'].splitPointTracks.length / device['splitPointsCoordsCheck'].length;
					
					/*
					this.routesService.calcAdvance(device['routeSelected'].splitPoints,device['tracks'],device['tracksPolyline'],"AREA",10);				
					device['splitPointsCoordsCheck'] = this.routesService.toCoord(device['routeSelected'].splitPoints.filter( s => s.check));
					device.routeSelected['completed'] =  Math.round((device['splitPointsCoordsCheck'].length / device['routeSelected'].splitPoints.length) *10000)/100 + "%";
					*/
			//	}
			},(err:any)=>console.log("err",err));
				
		});
		this.socket.on('device.state', (data: any) => {
			console.log('device.state',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.states = data.states;
			device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
			
			this.updateDeviceMarker(device);
		});
		this.socket.on('device.config', (data: any) => {
			console.log('device.config',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.config = data.config;
		});
		this.socket.on('device.setup', (data: any) => {
			console.log('device.setup',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.setup = data.setup;
		});
		this.socket.on('device.tracks', (data: any) => {
			console.log('device.tracks',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.tracks = data.tracks;
		});
		this.socket.on('device.pause', (data: any) => {
			console.log('device.pause',data.id);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			
			device.last = data.last;
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();
			
			this.updateDeviceMarker(device);
			
		});
		this.socket.on('device.last', (data: any) => {
			//console.log('device.last',data.id);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();
			device.last = data.last;
			this.updateDeviceMarker(device);
			if (device.states?.ON_ROUTE == "0") return;
			device.tracksCoord.push([data.last.lon, data.last.lat]);
			if (device['routeSelected']!=null){
				
				device.routeSelected['completed'] = this.routesService.checkPointLast(device['routeSelected'] , data.last,10);
				//device.routeSelected['completed'] = this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10);
				//device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
			}
		});
		this.socket.on('deviceUpdate', (data: any) => {
			//console.log('device:', data.id);
			console.log('device:', data);
			let device = this.devices.find((d: any) => d.id == data.id);
			
			if (device == null) {
				device = data;
				device['marker'] = {img:'assets/ic_device/ic_device_l0_e0_c0_b0.svg'}
				device['msl'] = new Date().getTime();
				device['tracksCoord'] = [];
				this.wsapiService.getTracks(device.id).subscribe( (res:any)=>{
					console.log("this.wsapiService",res);
					let tracksCoord = [];
					device['tracks'] = res.tracks;
					res.tracks.forEach(track => {						
						tracksCoord.push([track.lon, track.lat]);
					});
					device['tracksCoord'] = tracksCoord;					
				},(err:any)=>console.log("err",err));
				device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
				//device['personal'] = this.personal.find(data.states['ID_USER'])
				console.log("data.states['ID_USER']",data.states['ID_USER']);
				device['personal'] = this.personal.find(p => p.id == data.states['ID_USER']);
				
				this.devices.push(device);
			} else {
				device.config = data.config;
				device.states = data.states;
				
				device.ms = (new Date().getTime() - device.msl);
				device.msl = new Date().getTime();				
				
				device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
				device['personal'] = this.personal.find(p => p.id == data.states['ID_USER']);
				device.last = data.last;
				device.tracks.push(data.last);
				device.tracksCoord.push([data.last.lon, data.last.lat]);
				if (device['routeSelected']!=null){
					
					this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10);				
					device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
					/*this.routesService.calcAdvance(device['routeSelected'].splitPoints,device['tracks'],device['tracksPolyline'],"AREA",10);				
					device['splitPointsCoordsCheck'] = this.routesService.toCoord(device['routeSelected'].splitPoints.filter( s => s.check));
					device.routeSelected['completed'] =  Math.round((device['splitPointsCoordsCheck'].length / device['routeSelected'].splitPoints.length) *10000)/100 + "%";*/
				}

			}
			//device.last = 
			//let index = this.devices.indexOf(device);
			//this.devices.splice(index,1);
			this.updateDevices();
		});

		/*
		this.socket.fromEvent('message').pipe( map((data:any) =>{
			console.log(data);
		}));*/
		/*this.socket.on('connected', function (socket:any){
			console.log(msg);
		});*/
	}
	socketCommClean(){
		this.socket.emit('message', "enviando");
		this.socket.on('devices', (data: any) => {			
			this.devices = data;
			this.devices.forEach((device: any, index: number) => {				
				device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
				device['tracksCoord'] = [];
				this.wsapiService.getTracks(device.id).subscribe( (res:any)=>{
					let tracksCoord = [];
					device['tracks'] = res.tracks;
					res.tracks.forEach(track => {						
						tracksCoord.push([track.lon, track.lat]);
					});
					device['tracksCoord'] = tracksCoord;	
					device['tracksPolyline'] = [];
					device['PolyRouteTrack'] = [];
					if (device['routeSelected'] !=null){						
						device['PolyRouteTrack'] = this.routesService.createPolyRouteTrack(device['routeSelected']);	//PolyRouteTrack contiene los puntos particionados por cada tramo de una ruta
						this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10); //AREA es para calcular en tramso, 10 son los metros de proximidad
						device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));  //s[0] = lat , s[1] = lon  , s[2] = check si pasó cerca del punto, crea un conjunto de coordenadas donde si acercó el trayecto
						device.routeSelected['completed']=0;
					}
				},(err:any)=>console.log("err",err));
				
			});
			this.updateDevices();
		});
		this.socket.on('device', (data)=>{	//cuando un nuevo dispositivo se conecta despues del devices			
			let device = data;
			this.devices.push(device);
			
			device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);
			device['tracksCoord'] = [];
			this.wsapiService.getTracks(device.id).subscribe( (res:any)=>{
				console.log("this.wsapiService",res);
				let tracksCoord = [];		//para dibujar coordendas
				device['tracks'] = res.tracks;
				res.tracks.forEach(track => {						
					tracksCoord.push([track.lon, track.lat]);
				});
				device['tracksCoord'] = tracksCoord;					
				console.log("this.calculating");	
				device['tracksPolyline'] = [];
				device['PolyRouteTrack'] = [];
				if (device['routeSelected'] !=null){					
					device['PolyRouteTrack'] = this.routesService.createPolyRouteTrack(device['routeSelected']);
					this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10);				
					device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
					device.routeSelected['completed']=0;
				}
			},(err:any)=>console.log("err",err));				
		});
		this.socket.on('device.state', (data: any) => {
			console.log('device.state',data);			
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.states = data.states;
			//solo en state se puede saber si cambió de ruta
			device['routeSelected'] = this.routes.find(r => r.id==device.states['ID_ROUTE']);			
		});
		this.socket.on('device.config', (data: any) => {
			console.log('device.config',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.config = data.config;
		});
		this.socket.on('device.setup', (data: any) => {
			console.log('device.setup',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.setup = data.setup;
		});
		this.socket.on('device.tracks', (data: any) => {
			console.log('device.tracks',data);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.tracks = data.tracks;
		});
		this.socket.on('device.pause', (data: any) => {
			console.log('device.pause',data.id);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.last = data.last;
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();
			
		});
		this.socket.on('device.last', (data: any) => {
			console.log('device.last',data.id);
			let device = this.devices.find((d: any) => d.id == data.id);
			if (device == null){
				this.socket.emit("device",data.id);
				return;
			}
			device.ms = (new Date().getTime() - device.msl);
			device.msl = new Date().getTime();
			device.last = data.last;	//last contiene la última posición enviada [ t=timestamp, bat=bateria, lat,lon, acc=accuracy]
			if (device.states?.ON_ROUTE == "0") return;
			device.tracksCoord.push([data.last.lon, data.last.lat]);
			if (device['routeSelected']!=null){
				this.routesService.calcAdvance(device['PolyRouteTrack'] ,device['tracks'],device['tracksPolyline'],"AREA",10);				
				device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));
			}
		});
	}
	select($event: SelectEvent) {
		console.log($event);
	}
}