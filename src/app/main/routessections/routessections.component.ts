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
//import $ from 'jquery';
enum StatesEnum {
	ROUTE_VIEWER = 1,
	ROUTE_EDITOR = 2,
	ROUTE_CREATOR = 3,
	ROUTE_CREATOR_AREA = 4,
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
	layerMap = 'osm';
	mapHeight = '100%';
	mapWidth = '100%';
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
		/*
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
		},3000);*/
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
	sumPaths(linePaths){
		if (linePaths == undefined) return 0;
		let sumPoints = 0;
		linePaths.forEach( l=> sumPoints+=l.length );
		return sumPoints;
	}
	generateCell(route){		
		this.routesService.generateCell(route,0.2,true);
		route.controls.showCells=true;
	}
	generatePaths(route){
		this.layerMap = 'local_bw';
		route.controls.showArea=false;
		route.controls.showCells=false;
		route.controls.showPaths=false;
		route.controls.showLinePaths=false;
		route.controls.showSmooth=false;

		let onEnd = ()=>{
			this.layerMap = 'osm';
			route.controls.show = true;
			route.controls.showPaths=true;			
			route.controls.showLinePaths=true;
			route.controls.showSmooth=true;
			
			this.mapHeight = '100%';
			this.mapWidth = '100%';
		}

		this.selectedRoute = route;
		console.log("this.selectedRoute",this.selectedRoute);
		const extent = this.selectedRoute.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];
		
		//this.mapHeight = '8000px';
		//this.mapWidth = '8000px';
		/*this.map.instsance.on('postrender', function () {
			debWriteln([['postrendercount',postrendercount++]]);
			drawcoordinates();
		});
*/
		this.map.instance.getView().fit(extent3857, {
			maxZoom: 18,
			duration: 300
		});	
		
		setTimeout(() => {
			this.createFromPixel2(route,18,200,()=>{
				//this.guardarRuta();
				onEnd();
			}); 
		}, 3000);
	}
	generateSma(route){		
		this.routesService.smoothSectionsSmoothpaths(route);
		route.controls.showSmooth=true;
	}
	generateAvg(route){
		
		route.controls.showSmooth=true;
		this.routesService.average(route);
	}
	decimate(route){		
		//this.routesService.decimate(route,0.000027);
		this.routesService.decimate(route,0.000013);
		route.controls.showSmooth=true;
	}
	select($event: SelectEvent) {
		console.log("select:",$event);
	}
	openModal(template: TemplateRef<void>, data?:any) {
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-lg ',			
		});
	}
	sectionToPaths(route){
		this.routesService.sectionToPaths(route);		
	}
	saveRouteGenerated(route) {
		this.routesService.saveRouteGenerated(route,this.pointsService);		
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

	createFromPixel2(route,zoom,ms,cb){
		this.selectedRoute.controls.show = false;
		
		let me = this;
		let map = this.map.instance;	
		var w = map.getSize()[0];
		var h = map.getSize()[1];
		//console.log("map.w",w);
		//console.log("map.h",h);

		
		/*map.getView().setZoom(16);
		map.getView().setCenter(transform([route.extend[0],route.extend[3]], 'EPSG:4326', 'EPSG:3857'));*/

		//let t = (e)=> transform(e, 'EPSG:4326', 'EPSG:3857');
		setTimeout(async () => {
			const response =  await olMapScreenshot.getScreenshot(this.map.instance, {
			//	showDisplayScale:false,								
				//resolution: 600,
				format: 'png',
			});
			
				//console.log("createFromPixel2.response",response);
	
				var myImage = new Image();
				myImage.onload = function(){

				for(let s_index = 0; s_index < route.sections.length ; s_index++){
					let section = route.sections[s_index];
			
					let cellPosition = null;
					let	cellPaths = [];
					let	cellLinePaths = [];
			
					if (section['cellPaths']==undefined){
						section['cellPaths'] = cellPaths;
						section['linePaths'] = cellLinePaths;			
					}else{
						cellPaths = section['cellPaths'];
						cellLinePaths = section['linePaths'];
					}
			
					let cells = section['splitCoordsCells'];
					var data_index  = 0;
					let currentCell = null;
					let indexCell = -1;

						var canvas = document.createElement("canvas");
						canvas.width=w;
						canvas.height=h;
						var ctx = canvas.getContext("2d");
						ctx.drawImage(myImage,0,0);
						var data = ctx.getImageData(0, 0, w, h).data;
						//me.taskGetPixel(cells,0,data,cellPaths,map,w,h,0,2000);
						console.log("cells.length",cells.length);
						for(let cell_index =0; cell_index < cells.length; cell_index++ ){						 
						//for(let cell_index = w*4; cell_index < cells.length-(w*4); cell_index++ ){						 
							currentCell = cells[cell_index];
							if (!currentCell[2]) continue;
							cellPosition = map.getPixelFromCoordinate(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));
		
							cellPosition[0] = Math.round(cellPosition[0]);
							cellPosition[1] = Math.round(cellPosition[1]);
							if ( cellPosition[0]> w-1 || cellPosition[1]>h-1) continue;
							if ( cellPosition[0]<= 0 || cellPosition[1]<=0) continue;
							var x = cellPosition[0] * 1;
							var y = cellPosition[1] * 1;
							data_index =y*w*4 + x*4 ;
							var color = 'rgb(' + data[data_index] + ',' + data[data_index+1] + ','+ data[data_index+2] + ')';
							if (data[data_index]<=1 &&
								data[data_index+1]<=1 &&
								data[data_index+2]<=1
							) {
							/*if (data[data_index]>=140 && data[data_index]<=153 &&	data[data_index+1]>=140 && data[data_index+1]<=153 && data[data_index+2]>=140 && data[data_index+2]<=153 &&  data[data_index] == data[data_index+1] &&  data[data_index+1] == data[data_index+2]
							) {*/
								currentCell[2] = false;
								cellPaths.push(currentCell);
							}
						}
						
						for(let cell_index = 0; cell_index < cells.length; cell_index++ )
							if (!cells[cell_index][2])
								cells.splice(cell_index,1);

						let near = null;
						let dist = 99999;
						let tmp_dist = 99999;

						let isPath = (currentCell,parentCell)=>{						
							let cellA = [parentCell[0]-currentCell[0],parentCell[1]-currentCell[1]];
							cellA[0] = currentCell[0]+cellA[0]*0.3;
							cellA[1] = currentCell[1]+cellA[1]*0.3;
							let cellB = [parentCell[0]-currentCell[0],parentCell[1]-currentCell[1]];
							cellB[0] = currentCell[0]+cellB[0]*0.6;
							cellB[1] = currentCell[1]+cellB[1]*0.6;

							let cellPositionA = map.getPixelFromCoordinate(transform([cellA[0],cellA[1]], 'EPSG:4326', 'EPSG:3857'));	
							let cellPositionB = map.getPixelFromCoordinate(transform([cellB[0],cellB[1]], 'EPSG:4326', 'EPSG:3857'));								
							let data_indexA = Math.round(cellPositionA[1])*w*4+Math.round(cellPositionA[0])*4;
							let data_indexB = Math.round(cellPositionB[1])*w*4+Math.round(cellPositionB[0])*4;
							if ((data[data_indexA]<=1 && data[data_indexA+1]<=1 && data[data_indexA+2]<=1) &&
								(data[data_indexB]<=1 && data[data_indexB+1]<=1 && data[data_indexB+2]<=1)
							) return true;

							return false;
						}
						/* mid path is black? */
						let isPathSingle = (currentCell,parentCell)=>{						
							let cell = [parentCell[0]-currentCell[0],parentCell[1]-currentCell[1]];
							cell[0] = currentCell[0]+cell[0]/2;
							cell[1] = currentCell[1]+cell[1]/2;
							cellPosition = map.getPixelFromCoordinate(transform([cell[0],cell[1]], 'EPSG:4326', 'EPSG:3857'));	
							var x = Math.round(cellPosition[0]);
							var y = Math.round(cellPosition[1]);
							data_index = y*w*4+x*4;
							if (data[data_index]<=1 &&
								data[data_index+1]<=1 &&
								data[data_index+2]<=1
							) return true;
							return false;
						}
						let midPoint = (currentCell,parentCell)=>{
							let cell = [parentCell[0]-currentCell[0],parentCell[1]-currentCell[1]];
							cell[0] = currentCell[0]+cell[0]/2;
							cell[1] = currentCell[1]+cell[1]/2;
							return cell;
						}
						let midPoint3 = (currentCell,parentCell,parentCell2)=>{
							let cell = [currentCell[0]+parentCell[0]+parentCell2[0],currentCell[1]+parentCell[1]+parentCell2[1]];
							cell[0] = currentCell[0]/3;
							cell[1] = currentCell[1]/3;
							return cell;
						}
						let getNear = (index_parent,pindex)=>{
							dist = 99999;
							near = null;
							for(let cell_index = 0; cell_index < cellPaths.length; cell_index++ ){
								//if (cellPaths[cell_index][2]==false && cellPaths[cell_index][3]==0 && cell_index!=index_parent ){
								if ( cellPaths[cell_index][2]==false && cellPaths[cell_index][3]<pindex && cell_index!=index_parent ){
									tmp_dist = olSphere.getDistance( 
										[cellPaths[cell_index][0], cellPaths[cell_index][1]],
										[cellPaths[index_parent][0], cellPaths[index_parent][1]]);
									//console.log("tmp_dist",tmp_dist);
									if (tmp_dist < dist && tmp_dist < 30){
										if (isPath(cellPaths[cell_index],cellPaths[index_parent])){
											near = cell_index;
											dist = tmp_dist;
										}
									}
								}
							}
							return near;
						} 
						let getNearDif = (cell_point,pindex)=>{
							dist = 99999;
							near = null;
							for(let cell_index = 0; cell_index < cellPaths.length; cell_index++ ){
								//if (cellPaths[cell_index][2]==false && cellPaths[cell_index][3]==0 && cell_index!=index_parent ){
								if (  cellPaths[cell_index][2]!=false &&cellPaths[cell_index][3]!=pindex  ){
									tmp_dist = olSphere.getDistance( 
										[cellPaths[cell_index][0], cellPaths[cell_index][1]],
										[cell_point[0], cell_point[1]]);
									//console.log("tmp_dist",tmp_dist);
									if (tmp_dist < dist && tmp_dist < 80){
										if (isPath(cellPaths[cell_index],cell_point)){
											near = cell_index;
											dist = tmp_dist;
										}
									}
								}
							}
							return near;
						} 
						let linePath = null;
						let recFind=(index_current,index_parent,root,pindex)=>{
								//if (cellPaths[index_current][3]<pindex  ){
									let cell_index_near = getNear(index_current,pindex);	
									if (cell_index_near!= null){
										cellPaths[index_current][2] = true;
										cellPaths[index_current][3] = pindex;
										cellPaths[cell_index_near][3] = pindex;
										root.push(cellPaths[cell_index_near]);
										recFind(cell_index_near,index_current,root,pindex);									
									}
								//}
							}
						let pathIndex = 0;
						for(let cell_index = 0; cell_index < cellPaths.length; cell_index++ )	{
							if (cellPaths[cell_index][3]>0) continue;						
							let cell_index_near = getNear(cell_index,1);	
							if (cell_index_near != null){										
								linePath = [];
								pathIndex++;
								cellPaths[cell_index][2]=true;
								cellPaths[cell_index][3]=pathIndex;
								cellPaths[cell_index_near][3]=pathIndex;
								linePath.push(cellPaths[cell_index]);
								linePath.push(cellPaths[cell_index_near]);
								cellLinePaths.push (linePath);							
								recFind(cell_index_near,cell_index,linePath,pathIndex);							
								let firstNear = getNearDif(linePath[0],pathIndex);	
								let lastNear = getNearDif(linePath[linePath.length-1],pathIndex);							
								if (firstNear!=null) {cellPaths[firstNear][4]=true; linePath.unshift(cellPaths[firstNear]);  }
								if (lastNear!=null) {cellPaths[lastNear][4]=true; linePath.push(cellPaths[lastNear]); }
								

							}
						}

						/* SMOOTH  */

						section['smoothPaths'] = cellLinePaths;
						/*
						section['smoothPaths'] = [];
						for(let c_index = 0; c_index < cellLinePaths.length; c_index++ ){
							let linePath = cellLinePaths[c_index];
							let smooth_linePath = [] ;
							
							if (linePath.length > 0) smooth_linePath.push(linePath[0]);
							//for(let p_index = 1; p_index < linePath.length; p_index++ ){
							for(let p_index = 1; p_index < linePath.length; p_index++ ){
								smooth_linePath.push(midPoint(linePath[p_index-1],linePath[p_index]));
								//smooth_linePath.push(midPoint3(linePath[p_index-2],linePath[p_index-1],linePath[p_index]));
							}
							if (linePath.length > 1) smooth_linePath.push(linePath[linePath.length-1]);

							//cellLinePaths[c_index] = smooth_linePath;
							section['smoothPaths'].push(smooth_linePath);
						}
						let joinPaths = [];
						*/
						/*for (let c_index = 0; c_index < section['smoothPaths'].length; c_index++){
							section['smoothPaths'][c_index]
						}*/
						/* SECOND SMOOTH */
						/*
						for(let c_index = 0; c_index < section['smoothPaths'].length; c_index++ ){
							let linePath = section['smoothPaths'][c_index];
							let smooth_linePath = [] ;
							
							if (linePath.length > 0) smooth_linePath.push(linePath[0]);
							for(let p_index = 1; p_index < linePath.length; p_index++ ){
								smooth_linePath.push(midPoint(linePath[p_index-1],linePath[p_index]));
							}
							if (linePath.length > 1) smooth_linePath.push(linePath[linePath.length-1]);

							section['smoothPaths'][c_index] = smooth_linePath;
							//section['smoothPaths'].push(smooth_linePath);
						}*/

						console.log("route.cellpaths.length",cellPaths.length);
						console.log("route",route);
	
						myImage.onload = null;
						me.selectedRoute.controls.show = true;
					}

					if (cb!=null) cb();
				};
	
				myImage.src = response.img;
		
		}, 600);
	}

	
	createFromPixel3(route,zoom,ms,indx,indy){
		let map = this.map.instance;	

		if (route.extend[0]+0.005*indx > route.extend[2]){
			indy++;
			indx=0;
			
			if (route.extend[3]-0.005*indy < route.extend[1]){
				return;
			}
		}
		//map.getView().setZoom(16);
		map.getView().setCenter(transform([route.extend[0]+0.005*indx,route.extend[3]-0.005*indy], 'EPSG:4326', 'EPSG:3857'));

		//let t = (e)=> transform(e, 'EPSG:4326', 'EPSG:3857');
		setTimeout(async () => {
			this.createFromPixel2(route,zoom,ms,()=>{
				this.createFromPixel3(route,zoom,ms,indx+1,indy);
			});			

		}, 1000);
	}

	taskGetPixel(cells,cell_index_ini,data,cellPaths,map,w,h, pos,step){
		if (cells[cell_index_ini+pos*step] == undefined) return;
		console.log("taskGetPixel pos",pos );
		for(let cell_index = cell_index_ini; cell_index < cell_index_ini+pos*step; cell_index++ ){
			let currentCell = cells[cell_index];
			let cellPosition = map.getPixelFromCoordinate(transform([currentCell[0],currentCell[1]], 'EPSG:4326', 'EPSG:3857'));

			cellPosition[0] = Math.round(cellPosition[0]);
			cellPosition[1] = Math.round(cellPosition[1]);
			var x = cellPosition[0] * 1;
			var y = cellPosition[1] * 1;
			let data_index =y*w*4 + x*4 ;
			var color = 'rgb(' + data[data_index] + ',' + data[data_index+1] + ','+ data[data_index+2] + ')';
			if (data[data_index]>=140 && data[data_index]<=153 &&
				data[data_index+1]>=140 && data[data_index+1]<=153 &&
				data[data_index+2]>=140 && data[data_index+2]<=153 &&  data[data_index] == data[data_index+1] &&  data[data_index+1] == data[data_index+2]
			) {
				cellPaths.push(currentCell);
			}
		}
		this.taskGetPixel(cells,cell_index_ini+(pos)*step,data,cellPaths,map,w,h,pos+1,step);
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
			
			});
		
		setTimeout( ()=>{
			readyToGetPixel = true; 
			map.render();	
		},2000);
	}
	sumAllPoints(route:any){
		let sumPoints = 0;
		if (route.sections == undefined) return 0;
		if (route.sections.length == 0) return 0;
		route.sections.forEach(s=>sumPoints+=s.coords.length);
		return sumPoints;
	}
	sumAllPointsDecimate(route:any){
		let sumPoints = 0;
		if (route.sections == undefined) return 0;
		if (route.sections.length == 0) return 0;
		if (route.sections[0].smoothPaths == undefined) return 0;
		route.sections.forEach(s=>s.smoothPaths.forEach(ss=>sumPoints+=ss.length));
		return sumPoints;
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
			this.createFromPixel2(route,18,200,()=>{
				this.guardarRuta();
			}); 
			//this.createFromPixel3(route,18,200,0,0); 
		}, 32300);
	}

	guardarRuta(){
		let route = this.selectedRoute;
		this.newRoute.name = route.name+'.Area';
		this.newRoute.distance = 0;
		this.newRoute.image_id= null;
		this.newRoute.image= null;
		this.newRoute.sections = [];
		
		
		let countsection = 0;
		
		
		console.log('route', this.newRoute);
		this.routesService.register(this.newRoute).subscribe((result: any) => {
			let points = [];
			route.sections.forEach( (s,iss)=>{	
				s.smoothPaths.forEach( (sm,iz)=>{
					countsection++;
					sm.forEach( (smm ,ix)=> {								
						let punto = {
							route_id: result.content.id,
							lat: smm[1],
							lon: smm[0],
							section: countsection,
						};
						points.push(punto);
					});
								
				});
				
			});
			
			this.pointsService.register(points).subscribe((result: any) => {
				console.log("puntos creados result:", result);
			});
			console.log("result", result);			
			
		});
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
			//console.log("punto creado result:", result)
			this.regPoint(index+1,contentRoute,section,indexSection,callback);			
		});
	}
	/*END ROUTES*/
}
