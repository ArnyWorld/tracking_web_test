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
import $ from 'jquery';
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
		coords:[]
	};
	mousePosition = null;
	constructor(
		private routesService: RoutesService,
		private pointsService: PointsService,
		private personalService: PersonalService,
		private imagesService: ImagesService,
		private modalService: BsModalService){}

	ngOnInit(): void {
		this.loadRoutes();
		//this.setMapEvents();
	}	
	setMapEvents(){
		
		setTimeout(()=>{
			let map = this.map.instance;			
			let layers = map.getLayers();
			let mousePosition = null;
			//console.log("layers",layers);
			let layer = layers['array_'][0];
			//console.log("layer",layer);
			layer.on('postrender', function(event) {
				//console.log("postcompose");
				event.crossOrigin = "Anonymous";
				var ctx = event.context;
				var pixelRatio = event.frameState.pixelRatio;
				//console.log("mousePosition",mousePosition);
				if (mousePosition) {
				  var x = mousePosition[0] * pixelRatio;
				  var y = mousePosition[1] * pixelRatio;
				  var data = ctx.getImageData(x, y, 1, 1).data;
				  var color = 'rgb(' + data[0] + ',' + data[1] + ','+ data[2] + ')';
				  console.log("color",color);
				  console.log("data",data);
				  
				  $('#box').css('background-color', color);
				}
			  });
			  layer.set('postcompose', true);
			$(map.getViewport()).on('mousemove', function(evt) {
				//console.log("move");
				mousePosition = map.getEventPixel(evt.originalEvent);
				//console.log("mousePosition",this.mousePosition);
				map.render();
			  }).on('mouseout', function() {
				mousePosition = null;
				map.render();
			  });
		},3000);
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
				//this.routesService.pointsASections(route);
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
			/*	route['sections'].forEach( t => {
					t['splitCoords'] = this.routesService.splitPointsCoord(t.coords,4,10);
				});*/
				
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

	createFromPixel2(route,zoom,ms){
		let map = this.map.instance;	
		var w = map.getSize()[0];
		var h = map.getSize()[1];
		console.log("map.w",w);
		console.log("map.h",h);
		setTimeout(async () => {
			const response = await olMapScreenshot.getScreenshot(this.map.instance, {
				showDisplayScale:false,				
				//resolution: 150,
				format: 'png',
			});
			console.log("createFromPixel2.response",response);
			var canvas = document.createElement("canvas");
			canvas.width=w;
			canvas.height=h;

			let cellPosition = null;
			let	cellPaths = [];
			let cells = route.sections[0]['splitCoordsCells'];
			var data_index  = 0;
			let currentCell = null;
			let indexCell = -1;

			route.sections[0]['cellPaths'] = cellPaths;
			var myImage = new Image();
			myImage.onload = function(){
				var ctx = canvas.getContext("2d");
				ctx.drawImage(myImage,0,0);
				var data = ctx.getImageData(0, 0, w, h).data;
				//console.log("data",data);
				for(let cell_index = 0; cell_index < cells.length; cell_index++ ){
					//console.log("cell_index",cell_index);
					currentCell = cells[cell_index];
					cellPosition = map.getPixelFromCoordinate(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));

					//console.log("cellPosition",cellPosition);
					//cellPosition[0] = ((cellPosition[0] % w) + w) % w;
					//cellPosition[1] = ((cellPosition[1] % h) + h) % h;
					//console.log("cellPosition",cellPosition);
					cellPosition[0] = Math.round(cellPosition[0]);
					cellPosition[1] = Math.round(cellPosition[1]);
					var x = cellPosition[0] * 1;
					var y = cellPosition[1] * 1;
					data_index =y*w*4 + x*4 ;

					//console.log("data_index",data_index);
					//data = data[data_index];
					//var data = ctx.getImageData(x, y, 1, 1).data;
					var color = 'rgb(' + data[data_index] + ',' + data[data_index+1] + ','+ data[data_index+2] + ')';
					//console.log(color);
					//if (data[data_index]==146 && data[data_index+1]==146 && data[data_index+2]==146){
					//	cellPaths.push(currentCell);
					//if (data[data_index]>=219 && data[data_index+1]<=216 && data[data_index+2]<=215){
					if (data[data_index]>=140 && data[data_index]<=253 &&
						data[data_index+1]>=140 && data[data_index+1]<=253 &&
						data[data_index+2]>=140 && data[data_index+2]<=253 &&  data[data_index] == data[data_index+1] &&  data[data_index+1] == data[data_index+2]
					) {
						cellPaths.push(currentCell);
						//console.log("added");
					}
				}
				console.log("route",route);
			};

			myImage.src = response.img;
			

			//cellPosition = map.getPixelFromCoordinate(currentCell);
			//this.thumbRoute = await this.routesService.resizeImage(response.img);
			//console.log("createFromPixel2.response",response);
		});
	}

	createFromPixel(route,zoom,ms){
		let me = this; 
		let map = this.map.instance;	
		
		let layers = map.getLayers();
		let mousePosition = null;
		let layer = layers['array_'][0];
		let readyToGetPixel = false;
		
		let cellPosition = null;
		let	cellPaths = [];
		let cells = route.sections[0]['splitCoordsCells'];
		let currentCell = null;
		let indexCell = -1;

		route.sections[0]['cellPaths'] = cellPaths;

		
		//map.getView().setZoom(zoom);
		//map.getView().setCenter(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));

		let addPathCell = (data)=>{
			if (data[0]>=140 && data[0]<=253 &&
				data[1]>=140 && data[1]<=253 &&
				data[2]>=140 && data[2]<=253 
			) {
				cellPaths.push(currentCell);
				console.log("route",route)
			}
			if (indexCell+1 >= cells.length) return false;
			indexCell++;			
			currentCell = cells[indexCell];
			cellPosition = map.getPixelFromCoordinate(currentCell);
			var w = map.getSize()[0];
			var h = map.getSize()[1];

			cellPosition[0] = ((cellPosition[0] % w) + w) % w;
			cellPosition[1] = ((cellPosition[1] % h) + h) % h;

			return true;
//			console.log("cellPosition",cellPosition);
//			console.log("center",[currentCell[0],currentCell[1]]);//'EPSG:4326'
			//map.getView().setCenter(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));
			/*setTimeout( ()=>{
				readyToGetPixel = true; 
				console.log("indexCell",indexCell);
//				map.render();
			},ms);*/
		};
		layer.on('postrender', function(event) {
			var ctx = event.context;
			var pixelRatio = event.frameState.pixelRatio;
			console.log("pixelRatio",pixelRatio);
		//	console.log("redndered");
			console.log("postrender");
			var w = map.getSize()[0];
			var h = map.getSize()[1];
			console.log("map.w",w);
			console.log("map.h",h);
			if ( !readyToGetPixel ) return;

			var data = ctx.getImageData(0, 0, w, h).data;
			//var data = [];
			var data_index  = 0;
			console.log("cells.length:",cells.length);
			console.log("w,h",w,h);
			console.log("data.length",data.length);setTimeout(()=>{
				for(let cell_index = 0; cell_index < cells.length; cell_index++ ){
					//console.log("cell_index",cell_index);
					currentCell = cells[cell_index];
					cellPosition = map.getPixelFromCoordinate(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));
					cellPosition[0] = ((cellPosition[0] % w) + w) % w;
					cellPosition[1] = ((cellPosition[1] % h) + h) % h;
					var x = cellPosition[0] * pixelRatio;
					var y = cellPosition[1] * pixelRatio;
					data_index =y*w*4 + x*4 ;
					//data = data[data_index];
					//var data = ctx.getImageData(x, y, 1, 1).data;
					var color = 'rgb(' + data[data_index] + ',' + data[data_index+1] + ','+ data[data_index+2] + ')';
					console.log(color);
					if (data[0]>=219 && data[1]<=216 && data[2]<=215){
				/*	if (data[0]>=140 && data[0]<=253 &&
						data[1]>=140 && data[1]<=253 &&
						data[2]>=140 && data[2]<=253 &&  data[0] == data[1] == data[2]
					) {*/
					//	cellPaths.push(currentCell);
						//console.log("added");
					}
					//$('#box').css('background-color', color);
				}
				console.log("route",route);
			},1000);
			
			readyToGetPixel=false;
			

			/*if (readyToGetPixel)
				if (cellPosition) {
					var ctx = event.context;
					var pixelRatio = event.frameState.pixelRatio;
				//	console.log("redndered");
					var x = cellPosition[0] * pixelRatio;
					var y = cellPosition[1] * pixelRatio;
					var data = ctx.getImageData(x, y, 1, 1).data;
					var color = 'rgb(' + data[0] + ',' + data[1] + ','+ data[2] + ')';
				//	console.log("color",color);
					readyToGetPixel=false;
					cellPosition=null;
				//	setTimeout( ()=>{
						while(addPathCell(data));
				//	},ms);
					
					//$('#box').css('background-color', color);
				}*/
			});
		//layer.set('postcompose', true);
	

		
		setTimeout( ()=>{
			readyToGetPixel = true; 
			map.render();	
		},2000);
	}

	selectRoute (route:any){
		if (this.selectedRoute!== undefined) this.selectedRoute.controls.show = false;
		//this.routesService.cellsToRoutePixel(this.map, route);


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
			//this.createFromPixel(route,28,200);
			this.createFromPixel2(route,28,200); 
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
