import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularOpenlayersModule, FeatureComponent, MapComponent } from 'ng-openlayers';
import { SocketOne } from '../main.module';
import { Layer as OlLayer } from 'ol/layer';
import Source from 'ol/source/Source.js';
/*import { map } from 'rxjs/operators';*/
import { Feature } from 'ol';
import { createBox } from 'ol/interaction/Draw';
import Projection from 'ol/proj/Projection';
import { fromExtent } from 'ol/geom/Polygon';
import { Stroke } from 'ol/style';
import { SelectEvent } from 'ol/interaction/Select';
import { LayerVectorComponent } from 'ng-openlayers';
import { transform, fromLonLat } from 'ol/proj';
import { PanelFloatNavComponent } from '../../panel-float-nav/panel-float-nav.component';
import { HostListener } from '@angular/core';
import { Geometry, Point, LineString, SimpleGeometry } from 'ol/geom';
import * as olSphere from 'ol/sphere';
import olMapScreenshot from 'ol-map-screenshot';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { UsuariosService } from '../../api/users.service';
import { PersonalService } from '../../api/personal.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

enum StatesEnum {
	ROUTE_VIEWER = 1,
	ROUTE_EDITOR = 2,
	ROUTE_CREATOR = 3,
}

//https://github.com/kamilfurtak/ng-openlayers/blob/master/apps/demo-ng-openlayers/src/app/select-interaction/select-interaction.component.ts
@Component({
	selector: 'app-dashboardmappoly',
	templateUrl: './dashboardmappoly.component.html',
	styleUrl: './dashboardmappoly.component.css',
})
export class DashboardmappolyComponent implements OnInit {
	constructor(
		private routesService: RoutesService,
		private pointsService: PointsService,
		private personalService: PersonalService,
		private modalService: BsModalService,
	) { }

	//@ViewChild('map', { static: true })
	@ViewChild('map') map: MapComponent;
	@ViewChild('featureString') featureString: FeatureComponent;


	public StatesEnum: typeof StatesEnum = StatesEnum;
	//@ViewChild('markersLayer', { static: true }) markersLayer: LayerVectorComponent;
	@ViewChild('markersLayer') markersLayer: LayerVectorComponent;
	isMarkerLayer = (layer: OlLayer) => {
		//console.log("layer",layer['ol_uid']);
		//console.log("this.markersLayer",this.markersLayer);
		return layer === this.markersLayer?.instance;
	};

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

	mode: StatesEnum = StatesEnum.ROUTE_VIEWER;
	zoom: number = 18;
	opacityTile: number = 1;
	graticuleOn: boolean = true;
	distance: number = 0;
	styleLineDash: number[] = [10.0, 10.0];
	public graticuleStyle = new Stroke({
		color: 'rgba(120,120,120,0.9)',
		width: 2,
		lineDash: [0.5, 4],
	});



	key: any;
	@HostListener('document:keypress', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		this.key = event.key;
		console.log(this.key);
	}
	@HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
		event: KeyboardEvent
	) {
		console.log(event);
	}

	keyPress(event) {
		console.log(event);
	}

	onClick(event) {
		//console.log(event);
		const coordinates = event.coordinate;
		this.lon = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[0];
		this.lat = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[1];
		//  console.log([this.lon, this.lat]);
		this.lineString3.geometry.coordinates.push([this.lon, this.lat]);
		//this.lineString2 = Object.assign({}, this.lineString3);
	}
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
			coordinates: [],
		},
	};
	selectedLineString:any;
	/*selectedLineString = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: [],
		},
	};*/

	marker = {
		lat: -16.5319308,
		lon: -68.0698635,
		id: '0',
		img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg',
	};
	marker2 = {
		lat: -16.5319308,
		lon: -68.0698635,
		id: '0',
		img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg',
	};

	tooltip = {
		lat: -16.5319308,
		lon: -68.0688635,
		text: 'Lorem ipsum dolor sit amet',
	};
	selectedRoute = null;
	selectRoute (route:any){
		this.selectedRoute = route;
		this.selectedLineString = this.routeToString(route);
	}

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
	devices: any = Array();
	updateConnection() {
		var milliseconds = new Date().getTime();
		//console.log(milliseconds);
		console.log('this.devices', this.devices);
		this.devices.forEach((device: any, index: number) => {
			if (device == undefined) return;
			console.log(device);
			console.log(device.last.t, milliseconds, device.last.t - milliseconds);
			if (milliseconds - device.last.t > 5000) {
				device.marker.img = device.marker.img.replaceAll('c1', 'c0');
				/*
				if (index == 0)
				  this.marker.img = this.marker.img.replaceAll('c1', 'c0');
				if (index == 1)
				  this.marker2.img = this.marker2.img.replaceAll('c1', 'c0');*/
			} else {
				device.marker.img = device.marker.img.replaceAll('c0', 'c1');
				/*
						if (index == 0)
						  this.marker.img = this.marker.img.replaceAll('c0', 'c1');
						if (index == 1)
						  this.marker2.img = this.marker2.img.replaceAll('c0', 'c1');*/
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
			let bat = 'b0';
			let imgTmp = device.marker.img;
			if (device.last.bat > 0) bat = 'b0';
			if (device.last.bat > 10) bat = 'b1';
			if (device.last.bat > 30) bat = 'b2';
			if (device.last.bat > 85) bat = 'b3';
			imgTmp = imgTmp.replaceAll(/b[0-9]/g, bat);
			device.marker.img = imgTmp;

			//console.log(device);
			/*if (index == 0) {
			  this.marker.lat = device.last.lat;
			  this.marker.lon = device.last.lon;
			  this.marker.id = device.id;
	  
			  let bat = 'b0';
			  if (device.last.bat > 0) bat = 'b0';
			  if (device.last.bat > 10) bat = 'b1';
			  if (device.last.bat > 30) bat = 'b2';
			  if (device.last.bat > 85) bat = 'b3';
			  this.marker.img = this.marker.img.replaceAll(/b[0-9]/g, bat);
			  console.log(device);
			}
			if (index == 1) {
			  this.marker2.lat = device.last.lat;
			  this.marker2.lon = device.last.lon;
			  this.marker2.id = device.id;
			  let bat = 'b0';
			  if (device.last.bat > 0) bat = 'b0';
			  if (device.last.bat > 10) bat = 'b1';
			  if (device.last.bat > 30) bat = 'b2';
			  if (device.last.bat > 85) bat = 'b3';
			  this.marker2.img = this.marker2.img.replaceAll(/b[0-9]/g, bat);
			  console.log(device);
			}
	  */
		});
	}
	routes: any = [];

	modalRef?: BsModalRef;
	openModal(template: TemplateRef<void>, data?:any) {
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-lg ',			
		});
	}
	closeModal(){
		this.modalRef.hide();
	}

	ngOnInit() {
		this.loadRoutes();
	}
	loadRoutes() {
		this.routesService.getAll(100, 1, 'id',false,'').subscribe((result: any) => {
			this.routes = result.content;
			
			console.log("routes",this.routes);
		});
	}
	select($event: SelectEvent) {
		console.log($event);
	}
	coodinates = [];

	drawBoxGeometryFunction = createBox();

	feature2;
	featureNew = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'Polygon',
			coordinates: [],
		},
	};

	lineString3 = {
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

	lastCoord: any = undefined;
	dispatchCursor(event): void {
		const coordinates = event.coordinate;
		this.lon = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[0];
		this.lat = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[1];

		//const line = new LineString(p1, p2);
		//const d = line.getGeodesicLength();

		//this.coodinates.push(coordinates);
		//this.lineString3.geometry.coordinates.push([this.lon, this.lat]);
		//this.featureNew.geometry.coordinates.push([this.lon, this.lat]);
	}
	startDraw(feature2: Feature) {
		this.lineString3 = {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [],
			},
		};
	}
	lineString4;
	thumbRoute: any;
	route = {
		id: '',
		name: '',
		image: null,
		min_split_mt: '5',
		max_split_mt: '10',
		distance: 0,
	}
	saveRoute() {
		
		this.route.image = this.thumbRoute;
		this.route.distance = this.distance;
		console.log('route', this.route);
		this.routesService.register(this.route).subscribe((result: any) => {
			console.log("result", result);

			if ( result.content instanceof Array)
				this.savePoints(result.content[0],()=>{	this.loadRoutes(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[]});
			else
				this.savePoints(result.content,()=>{ this.loadRoutes();  this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[] });
			
		});
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Crear';
	savePoints(contentRoute: any,callback) {
		this.regPoint(0,contentRoute,callback);
/*

		this.registerCount = 0;
		this.registerComplete = this.lineString3.geometry.coordinates.length;
		this.lineString3.geometry.coordinates.forEach((coord: any) => {
			let punto = {
				route_id: contentRoute.id,
				lat: coord[1],
				lon: coord[0],
			}
			this.pointsService.register(punto).subscribe((result: any) => {
				console.log("punto creado result:", result)
				this.registerCount++;
				this.createProgress = "Guardando " + Math.round(((this.registerCount)/this.registerComplete)*100) + "%"
				if (this.registerCount == this.registerComplete && callback != null) callback();
			});
		});*/
	}
	regPoint(index,contentRoute:any,callback){
		if (this.lineString3.geometry.coordinates.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.createProgress = "Guardando " + Math.round((index/this.lineString3.geometry.coordinates.length)*100) + "%"
		let coord =this.lineString3.geometry.coordinates[index];
		let punto = {
			route_id: contentRoute.id,
			lat: coord[1],
			lon: coord[0],
		}
		this.pointsService.register(punto).subscribe((result: any) => {
			console.log("punto creado result:", result)
			this.regPoint(index+1,contentRoute,callback);			
		});
	}
	async endDraw(feature2: Feature, $event: any) {
		console.log('this.map', this.map);


		//console.log("response",response.img);

		console.log('feature2', feature2);
		console.log('event', $event.target.sketchCoords_);
		console.log(
			'getCoordinates()',
			$event.feature.getGeometry().getCoordinates()
		);
		const olGeomPolygon = feature2.getGeometry();
		olGeomPolygon.transform(
			new Projection({ code: 'EPSG:3857' }),
			new Projection({ code: 'EPSG:4326' })
		);
		/*
			var extentOfAllFeatures = createEmpty();
			var flatFeatures = feature2.getGeometry().getExtent flat();
		
			flatFeatures.forEach(function (feature) {
			  extend(extentOfAllFeatures, feature.getGeometry().getExtent());
			});
			this.map.instance.getView().fit(feature2.getGeometry().getExtent() );
		*/

		//console.log("feature2",feature2.getGeometry().getCoordinates() );
		//console.log("olGeomPolygon",olGeomPolygon.getCoordinates());

		/*
		this.feature2 = {
		  type: 'Feature',
		  properties: {},
		  geometry: {
			type: 'LineString',
			coordinates: [olGeomPolygon.getCoordinates()[0][0]],
		  },
		};*/
		/*let featureTemp = {
			type: 'Feature',
			properties: {},
			geometry: {
			  type: 'LineString',
			  coordinates: [olGeomPolygon.getCoordinates()[0]],
			},
		  };
		this.lineString4 = {
			type: 'Feature',
			properties: {},
			geometry: {
			  type: 'LineString',
			  coordinates: [olGeomPolygon.getCoordinates()[0]],
			},
		  };*/
		//console.log("this.feature2",feature2);
		//console.log(	olGeomPolygon.getCoordinates());
		//console.log(this.lineString3.geometry.coordinates);
		//this.lineString2 = Object.assign({}, this.lineString4);
		this.lineString2.geometry.coordinates = $event.feature
			.getGeometry()
			.getCoordinates();
		this.distance = 0;
		var coord2 = [];
		for (let i = 1; i < this.lineString2.geometry.coordinates.length; i++) {
			coord2.push(fromLonLat(this.lineString2.geometry.coordinates[i], 'EPSG:3857'));
			this.distance += olSphere.getDistance(
				this.lineString2.geometry.coordinates[i - 1],
				this.lineString2.geometry.coordinates[i]
			);
		}

		this.distance = Math.round(this.distance);

		const olGeomPolygon2 = fromExtent(feature2.getGeometry().getExtent());
		olGeomPolygon2.transform(new Projection({ code: 'EPSG:3857' }), new Projection({ code: 'EPSG:4326' }));
		console.log("this.lineString2.geometry.coordinates", this.lineString2.geometry.coordinates);


		let point = new Point(this.lineString2.geometry.coordinates);


		//const markerSource = new Source
		//const geomet:SimpleGeometry = feature2.getGeometry();
		//this.map.instance.getView().fit(geomet);
		//this.opacityTile = 0.5;
		this.graticuleOn = false;

		this.thumbRoute = "assets/loading.gif";
		//console.log("this.lineString2",this.lineString2);
		setTimeout(async () => {

			const extent = this.featureString.instance.getGeometry().getExtent();

			this.map.instance.getView().fit(extent, {
				padding: [100, 100, 100, 100],
				maxZoom: 23,
				duration: 300
			});

			//const extent = this.featureString.instance.getGeometry().getExtent();
			//console.log("feature Extent",extent);

			//this.map.instance.getView().fit(extent);
			//this.map.instance.getView().fit(point, this.map.instance.getView());

			setTimeout(async () => {
				const response = await olMapScreenshot.getScreenshot(this.map.instance, {
					/*dim: [100, 100],*/
					//dim: [50, 30],
					scaleBarLength: 100,
					//resolution: '40dpi',
					resolution: 85,
					format: 'jpeg',
				});
				this.thumbRoute = await resizeImage(response.img);
				setTimeout(() => {
					//this.opacityTile = 1;
					this.graticuleOn = true;
				}, 100);
			}, 2000);
		}, 1000);

	}

	lon = 0;
	lat = 0;
	latToString(lat: number) {
		return toSexagesimal(lat, '', '-');
	}

	lonToString(lon: number) {
		return toSexagesimal(lon, '', '-');
	}
}
function toSexagesimal(
	value: number,
	positiveSuffix: string,
	negativeSuffix: string
): string {
	const modValue = ((value + 180) % 360) - 180;
	return (
		(modValue > 0 ? positiveSuffix : negativeSuffix) +
		Math.abs(modValue).toFixed(6)
	);
}


function resizeImage(base64Str) {


	return new Promise(resolve => {
		var img = new Image();

		img.onload = function () {
			var canvas = document.createElement('canvas');
			var MAX_WIDTH = 900;
			var MAX_HEIGHT = 900;
			var width = img.width;
			var height = img.height;

			if (width > height) {
				if (width > MAX_WIDTH) {
					height *= MAX_WIDTH / width;
					width = MAX_WIDTH;
				}
			} else {
				if (height > MAX_HEIGHT) {
					width *= MAX_HEIGHT / height;
					height = MAX_HEIGHT;
				}
			}
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, width, height);
			//console.log("canvas.toDataURL()", canvas.toDataURL("image/jpeg"));
			resolve(canvas.toDataURL("image/jpeg"));
		}

		img.src = base64Str;
	})
}