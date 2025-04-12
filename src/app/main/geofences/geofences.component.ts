import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AngularOpenlayersModule, FeatureComponent,MapComponent } from 'ng-openlayers';
import { LayerVectorComponent } from 'ng-openlayers';


import Projection from 'ol/proj/Projection';
import olMapScreenshot from 'ol-map-screenshot';
import * as olSphere from 'ol/sphere';
import { Feature } from 'ol';
import { Layer as OlLayer } from 'ol/layer';
import { transform, fromLonLat } from 'ol/proj';
import  { getArea, getLength} from 'ol/sphere.js';
import { SelectEvent } from 'ol/interaction/Select';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PersonalService } from '../../api/personal.service';
import { RoutesService } from '../../api/routes.service';
import { ImagesService } from '../../api/images.service';
import { GeofencesService } from '../../api/geofences.service';
//import $ from 'jquery';
enum StatesEnum {
	ROUTE_VIEWER = 1,
	ROUTE_EDITOR = 2,
	ROUTE_CREATOR = 3,
	ROUTE_CREATOR_AREA = 4,
	GEOFENCE_POLYGON_CREATOR = 5,
	GEOFENCE_POINT_CREATOR = 6,
}

@Component({
  selector: 'app-geofences',
  templateUrl: './geofences.component.html',
  styleUrl: './geofences.component.css'
})
export class GeofencesComponent implements OnInit{	

	@ViewChild('map') map: MapComponent;
	@ViewChild('layerMarkers') layerMarkers: LayerVectorComponent;

	public StatesEnum: typeof StatesEnum = StatesEnum;
	public mode: StatesEnum = StatesEnum.ROUTE_VIEWER;

	modalRef?: BsModalRef;
	zoom:number 			= 18;
	lat:number 				= 0;
	lon:number 				= 0;	
	routes:any;
	geofences:any;
	/* create */
	thumbRoute:string		= "";
	distance:number			= 0;
	createProgress:string	= "Crear"
	selectedRoute:any;
	selectedGeofence:any;
	
	newGeofence = {
		id: '',
		name: '',
		desc: '',
		area: 0,
		data: '',
		type:'',
		sections:[			
		],
		currentSection: 0,
	}

	newRoute = {
		id: '',
		name: '',
		image_id: 0,
		frequency: "[1,2,3,4,5,6]",
		image:null,
		min_split_mt: '5',
		max_split_mt: '10',
		distance: 0,
		district_id: 1,
		sections:[			
		],
		currentSection: 0,
	}

	defaulsection = {
		uuid:0,
		show:false,
		over:false,
		area:0,
		radius:10,
		type:'POLYGONS',
		coords:[]
	};

	mousePosition = null;
	layerMap = 'osm';
	mapHeight = '100%';
	mapWidth = '100%';
	constructor(
		private routesService: RoutesService,
		private geofencesService: GeofencesService,
		private personalService: PersonalService,
		private imagesService: ImagesService,
		private modalService: BsModalService){}

	ngOnInit(): void {
		//this.loadRoutes();
		//this.setMapEvents();
		this.loadGeofences();
	}	
	
	loadGeofences(){
		this.geofencesService.getAll().subscribe(
			results=>{
				console.log("loadGeofences.results",results);
				results['content'].forEach(geofence => {
					geofence.data = JSON.parse(geofence.data);
					geofence['sections'] = geofence.data;
					geofence['area'] = 0;
					geofence['controls'] = this.createRouteControls();
					geofence.data.forEach(p=>geofence['area']+=parseFloat(p['area']==undefined?0:p['area']));
				});
				this.geofences=results['content'];
			},
			errors=>{	}
		);
	}
	createRouteControls(){
		return {
			selected:false,
			show:false,
			showTrack:false,
			showCells:false,
			showArea:false,
			showPath:false,
			showLinePaths:false,
			showSmooth:false,
			showRoute:false,
			showRoutePoints:false,
		};
	}
	select($event: SelectEvent) {
		console.log("select:",$event);
	}
	
	keyPress(event) {
		console.log("keyPress",event);
	}
	// DRAW POLYGON
	async endDraw(feature2: Feature, $event: any) {
		const olGeomPolygon:any = feature2.getGeometry();
		olGeomPolygon.transform(
			new Projection({ code: 'EPSG:3857' }),
			new Projection({ code: 'EPSG:4326' })
		);
		console.log("olGeomPolygon", olGeomPolygon.getCoordinates());
		let coords = olGeomPolygon.getCoordinates();
		for (let i = 1; i < coords.length; i++) {
			//console.log(fromLonLat(coords[i], 'EPSG:3857'));
			//this.newRoute.sections[this.newRoute.currentSection].coords.push(fromLonLat(coords[i], 'EPSG:3857'));
			this.distance += olSphere.getDistance(
				coords[i - 1],
				coords[i]
			);
		}
		const area = getArea(olGeomPolygon,{ projection: 'EPSG:4326' });
		console.log("area",area);
		var newSection = {... this.defaulsection};
		newSection.uuid = this.newRoute.currentSection;
		newSection.coords = coords;
		newSection.area = Math.round(area * 100) / 100;
		newSection.type = "POLYGONS";
		newSection.show = true;		

		this.newGeofence.sections.push(newSection);
		this.newGeofence['area'] = 0;
		this.newGeofence.sections.forEach(s=>this.newGeofence['area']+=s.area);
		this.newGeofence.currentSection++;
		
		this.thumbRoute = "assets/loading.gif";
		this.routesService.processExtend(this.newGeofence);
		const extent = this.newRoute['extend_3857'];

		setTimeout(async () => {
			const response = await olMapScreenshot.getScreenshot(this.map.instance, {
				scaleBarLength: 100,
				resolution: 85,
				format: 'jpeg',
			});
			this.thumbRoute = await this.routesService.resizeImage(response.img);
		}, 200);
		
		console.log("section creado", this.newRoute);
	}
	startDraw(feature2: Feature){

	}
	// DRAW POINT
	
	async endDrawPoint(feature2: Feature, $event: any) {
		const olGeomPolygon:any = feature2.getGeometry();
		olGeomPolygon.transform(
			new Projection({ code: 'EPSG:3857' }),
			new Projection({ code: 'EPSG:4326' })
		);
		console.log("olGeomPolygon", olGeomPolygon.getCoordinates());
		let coords = olGeomPolygon.getCoordinates();
		for (let i = 1; i < coords.length; i++) {
			//console.log(fromLonLat(coords[i], 'EPSG:3857'));
			//this.newRoute.sections[this.newRoute.currentSection].coords.push(fromLonLat(coords[i], 'EPSG:3857'));
			this.distance += olSphere.getDistance(
				coords[i - 1],
				coords[i]
			);
		}
		const area = getArea(olGeomPolygon);
		console.log("area",area);
		var newSection = {... this.defaulsection};
		newSection.uuid = this.newRoute.currentSection;
		newSection.area = Math.round(area * 100) / 100;
		newSection.type = "POINTS";
		newSection.coords = coords;
		newSection.show = true;		
		newSection.radius = 10

		this.newGeofence.sections.push(newSection);
		this.newGeofence.currentSection++;
		
		
		this.thumbRoute = "assets/loading.gif";
		this.routesService.processExtend(this.newGeofence);
		const extent = this.newRoute['extend_3857'];

		setTimeout(async () => {
			const response = await olMapScreenshot.getScreenshot(this.map.instance, {
				scaleBarLength: 100,
				resolution: 85,
				format: 'jpeg',
			});
			this.thumbRoute = await this.routesService.resizeImage(response.img);
		}, 200);
		
		console.log("endDrawPoint.[GEOFENCE]section creado", this.newGeofence);
	}
	startDrawPoint(feature2: Feature){

	}

	onMouseOut(section){
		section.over=false;
		console.log(section);
	}
	onMouseIn(section){
		section.over=true;
		console.log(section);
	}
	onClick(event) {
	}
	dispatchCursor(event){
	}

	isMarkerLayer = (layer: OlLayer) => {
		return layer === this.layerMarkers?.instance;
	};

	//TO DO
	selectGeofence(geofence:any){
		console.log("selectGeofence.geofence",geofence);
		this.selectedGeofence = geofence;
		this.selectedGeofence.controls.show = true;
	}
	selectRoute (route:any){
		if (this.selectedRoute!== undefined) this.selectedRoute.controls.show = false;

		this.selectedRoute = route;
		this.selectedRoute.controls.showRoute = true;
		this.selectedRoute.controls.showRoutePoints = true;
		console.log("this.selectedRoute",this.selectedRoute);
		const extent = this.selectedRoute.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];
		
		this.map.instance.getView().fit(extent3857, {
			padding: [100, 100, 100, 100],
			maxZoom: 18,
			duration: 300
		});	
		
		setTimeout(() => {
			this.selectedRoute.controls.show = true;
		}, 300);
	}
	//TO DO
	selectRoute2 (route:any){
		if (this.selectedRoute!== undefined) this.selectedRoute.controls.show = false;

		this.selectedRoute = route;
		console.log("this.selectedRoute",this.selectedRoute);
		const extent = this.selectedRoute.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];
		
		this.map.instance.getView().fit(extent3857, {
			//padding: [100, 100, 100, 100],
			maxZoom: 18,
			duration: 300
		});	
		//this.map.instance.render();
		setTimeout(() => {
		//	if (route!== undefined) route.controls.show = true;
			//this.createFromPixel(route,28,200);
			//this.createFromPixel2(route,18,200,()=>{
		//		this.guardarRuta();
		//	}); 
			//this.createFromPixel3(route,18,200,0,0); 
		}, 32300);
	}

	sectionsToData(sections){
		let data = JSON.stringify(sections);
		return data;
	}

	saveGeofence(geofence,type){
		let newGeofence = {
			name : geofence.name,
			type : type,
			data : this.sectionsToData(geofence.sections),
		};
		console.log('saveGeofence.newGeofence', newGeofence);
		this.geofencesService.register(newGeofence).subscribe((result: any) => {
			console.log("result", result);			
			//this.createProgress = "Guardado";
			this.mode = StatesEnum.ROUTE_VIEWER;
		});
	}
	
}
