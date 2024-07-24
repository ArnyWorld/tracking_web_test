import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AngularOpenlayersModule, FeatureComponent,MapComponent } from 'ng-openlayers';
import { LayerVectorComponent } from 'ng-openlayers';


import Projection from 'ol/proj/Projection';
import olMapScreenshot from 'ol-map-screenshot';
import * as olSphere from 'ol/sphere';
import { Feature } from 'ol';
import { Layer as OlLayer } from 'ol/layer';
import { transform, fromLonLat } from 'ol/proj';
import { SelectEvent } from 'ol/interaction/Select';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PersonalService } from '../../api/personal.service';
import { PointsService } from '../../api/points.service';
import { RoutesService } from '../../api/routes.service';
import { ImagesService } from '../../api/images.service';

enum StatesEnum {
	ROUTE_VIEWER = 1,
	ROUTE_EDITOR = 2,
	ROUTE_CREATOR = 3,
}

@Component({
  selector: 'app-routessections',
  templateUrl: './routessections.component.html',
  styleUrl: './routessections.component.css'
})
export class RoutessectionsComponent implements OnInit{	

	@ViewChild('map') map: MapComponent;
	@ViewChild('layerMarkers') layerMarkers: LayerVectorComponent;


	

	public StatesEnum: typeof StatesEnum = StatesEnum;
	public mode: StatesEnum = StatesEnum.ROUTE_VIEWER;

	modalRef?: BsModalRef;
	zoom:number 			= 18;
	lat:number 				= 0;
	lon:number 				= 0;	
	routes:any 				;
	/* create */
	thumbRoute:string		= "";
	distance:number		= 0;
	createProgress:string	= "Crear"
	selectedRoute:any;
	newRoute = {
		id: '',
		name: '',
		image_id: 0,
		image:null,
		min_split_mt: '5',
		max_split_mt: '10',
		distance: 0,
		sections:[
			
		],
		currentSection: 0,
	}
	defaulsection = {
		uuid:0,
		show:false,
		over:false,
		coords:[]
	};

	constructor(
		private routesService: RoutesService,
		private pointsService: PointsService,
		private personalService: PersonalService,
		private imagesService: ImagesService,
		private modalService: BsModalService){}

	ngOnInit(): void {
		this.loadRoutes();
	}	
	createRouteControls(){
		return {
			selected:false,
			show:false,
			showTrack:false,
		};
	}
	loadRoutes(){
		this.routesService.getAll(100, 1, 'id',false,'').subscribe((result: any) => {
			this.routes = result.content;
			//console.log("routes",this.routes);
			

			this.routes.forEach(route => {
				//route['extend'] = [+180,90,-180,-90];
				
				route['controls'] = this.createRouteControls();
				//route['splitPoints'] = this.routesService.splitPoints(route.points, 4, 10 ); 
				//route['splitPointsCoords'] = this.routesService.toCoord(route['splitPoints']);
				route['string']={
					'geometry':{
						coordinates:route.points.map(p => [p.lon, p.lat] )
					}
				}
				this.routesService.pointsASections(route);
				/*
				route['sections'] = Array.from(this.routesService.groupBy(route.points, p => p.section)).map(
					(p:any,index:number )=>{
						return {uuid:index,coords:(p[1].map( (pp:any) => { 
							route['extend'][0]=pp.lon<route['extend'][0]?pp.lon:route['extend'][0];
							route['extend'][1]=pp.lat<route['extend'][1]?pp.lat:route['extend'][1];
							route['extend'][2]=pp.lon>route['extend'][2]?pp.lon:route['extend'][2];
							route['extend'][3]=pp.lat>route['extend'][3]?pp.lat:route['extend'][3];
							;return [pp.lon,pp.lat]} ))};
					}
				);*/
				route['sections'].forEach( t => {
					t['splitCoords'] = this.routesService.splitPointsCoord(t.coords,4,10);
				});
				
				//route['sections'] = route['sections'].map(v=>v.value);
				console.log("route",route);
			});
		});
	}
	select($event: SelectEvent) {
		console.log("select:",$event);
	}
	openModal(template: TemplateRef<void>, data?:any) {
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-lg ',			
		});
	}
	closeModal(){
		this.modalRef.hide();
	}
	keyPress(event) {
		console.log("keyPress",event);
	}
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
		var newSection = {... this.defaulsection};
		newSection.uuid = this.newRoute.currentSection;
		newSection.coords = coords;
		newSection.show = true;		

		this.newRoute.sections.push(newSection);
		this.newRoute.currentSection++;
		
		
		this.thumbRoute = "assets/loading.gif";
		this.routesService.processExtend(this.newRoute);
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
	onMouseOut(section){
		section.over=false;
		console.log(section);
	}
	onMouseIn(section){
		section.over=true;
		console.log(section);
	}
	onClick(event) {
		/*const coordinates = event.coordinate;
		this.lon = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[0];
		this.lat = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[1];*/
		
		
		//this.newRoute.sections[this.newRoute.currentSection].coords.push([this.lon, this.lat]);
		//console.log(this.newRoute.sections[this.newRoute.currentSection].coords[this.newRoute.sections[this.newRoute.currentSection].coords.length-1]);
		//this.lineString3.geometry.coordinates.push([this.lon, this.lat]);
	}
	dispatchCursor(event){
	/*	const coordinates = event.coordinate;
		this.lon = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[0];
		this.lat = transform(coordinates, 'EPSG:3857', 'EPSG:4326')[1];*/
	}

	isMarkerLayer = (layer: OlLayer) => {
		//console.log("layer",layer['ol_uid']);
		//console.log("this.markersLayer",this.markersLayer);
		return layer === this.layerMarkers?.instance;
	};

	/*ROUTES*/
	lineString2:any;
	lineString3:any;
	selectRoute (route:any){
		if (this.selectedRoute!== undefined) this.selectedRoute.controls.show = false;
		this.selectedRoute = route;
		console.log("this.selectedRoute",this.selectedRoute);
		
		/*
		console.log("this.selectedRoute",this.selectedRoute);
		const extent = this.selectedRoute.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];*/
		
		this.map.instance.getView().fit( this.selectedRoute.extend_3857, {
			padding: [100, 100, 100, 100],
			maxZoom: 23,
			duration: 300
		});	
		setTimeout(() => {
			if (route!== undefined) route.controls.show = true;
		}, 200);
	}

	createThumb(callback){
		this.thumbRoute = "assets/loading.gif";
		setTimeout(async () => {
			this.routesService.processExtend(this.newRoute);
			const extent = this.newRoute['extend_3857'];

			this.map.instance.getView().fit(extent, {
				padding: [100, 100, 100, 100],
				maxZoom: 23,
				duration: 300
			});
			setTimeout(async () => {
				const response = await olMapScreenshot.getScreenshot(this.map.instance, {
					scaleBarLength: 100,
					resolution: 85,
					format: 'jpeg',
				});
				this.thumbRoute = await this.routesService.resizeImage(response.img);

				let image = {
					base64:this.thumbRoute,
					path:'',
					create_date:1719099774,
					update_date:1719099774
				}
				this.imagesService.register(image).subscribe((result:any)=>{
					console.log("this.imagesService.result.content",result.content);
					callback(result.content);
				});
				
			}, 200);
		}, 100);
	}
	saveRoute() {
		this.createThumb( (image)=> {
			this.newRoute.image = image;
			this.newRoute.image_id = image.id;
			this.newRoute.distance = this.distance;
			console.log('route', this.newRoute);
			this.routesService.register(this.newRoute).subscribe((result: any) => {
				console.log("result", result);
				if ( result.content instanceof Array)
					this.savePoints(result.content[0],()=>{ this.loadRoutes(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;	});//this.loadRoutes(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[]});
				else
					this.savePoints(result.content,()=>{ this.loadRoutes(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER; });//this.loadRoutes();  this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[] });
				
			});
		})		
	}
	savePoints(contentRoute: any,callback) {
		contentRoute.sections.forEach( ((section:any,indexSection:number) =>{
			this.regPoint(0, contentRoute, section, indexSection, callback);
		}) );
		
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
	regPoint(index, contentRoute:any, section, indexSection, callback){
		if (section.coords.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		//this.createProgress = "Guardando " + Math.round((index/section.coords.length)*100) + "%"
		let coord = section.coords[index];
		let punto = {
			route_id: contentRoute.id,
			lat: coord[1],
			lon: coord[0],
			section: indexSection,
		}
		this.pointsService.register(punto).subscribe((result: any) => {
			console.log("punto creado result:", result)
			this.regPoint(index+1,contentRoute,section,indexSection,callback);			
		});
	}
	/*END ROUTES*/
}
