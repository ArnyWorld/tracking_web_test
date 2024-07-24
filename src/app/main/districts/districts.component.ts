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
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';

enum StatesEnum {
	ROUTE_VIEWER = 1,
	ROUTE_EDITOR = 2,
	ROUTE_CREATOR = 3,
}

@Component({
  selector: 'app-routessections',
  templateUrl: './districts.component.html',
  styleUrl: './districts.component.css'
})
export class DistrictsComponent implements OnInit{	

	@ViewChild('map') map: MapComponent;
	@ViewChild('layerMarkers') layerMarkers: LayerVectorComponent;
	@ViewChild('selectedFeatureString') selectedFeatureStringRef: FeatureComponent;

	public StatesEnum: typeof StatesEnum = StatesEnum;
	public mode: StatesEnum = StatesEnum.ROUTE_VIEWER;

	modalRef?: BsModalRef;
	zoom:number 			= 18;
	lat:number 				= 0;
	lon:number 				= 0;	
	districts:any 				;
	/* create */
	thumbRoute:string		= "";
	distance:number		= 0;
	createProgress:string	= "Crear"
	selectedDistrict:any;
	newDistrict = {
		id: '',
		name: '',		
		coords:[],
		show: false,
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
		private districtsService: DistrictsService,
		private districtPointsService: DistrictPointsService,
		private modalService: BsModalService){}

	ngOnInit(): void {
		this.loadDistricts();
	}	
	createRouteControls(){
		return {
			selected:false,
			show:false,
			showTrack:false,
		};
	}
	
	loadDistricts(){
		this.districtsService.getAll(100, 1, 'id',false,'').subscribe((result: any) => {
			this.districts = result.content;
			
			this.districts.forEach(district => {
				district['controls'] = this.createRouteControls();				
				district['coords']= district.points.map(p => [p.lon, p.lat] );
				this.districtsService.getExtends(district);
				console.log("route",district);
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
		
		this.newDistrict.coords = coords;
		this.newDistrict.show = true;		
		
		
		this.thumbRoute = "assets/loading.gif";
		this.districtsService.processExtend(this.newDistrict);
		const extent = this.newDistrict['extend_3857'];

		setTimeout(async () => {
			const response = await olMapScreenshot.getScreenshot(this.map.instance, {
				scaleBarLength: 100,
				resolution: 85,
				format: 'jpeg',
			});
			this.thumbRoute = await this.routesService.resizeImage(response.img);
		}, 200);
		
		console.log("polygon created", this.newDistrict);
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
	

	/*ROUTES*/
	lineString2:any;
	lineString3:any;
	selectDistrict (route:any){
		if (this.selectedDistrict!== undefined) this.selectedDistrict.controls.show = false;
		this.selectedDistrict = route;
		console.log("this.selectedDistrict",this.selectedDistrict);
		
		this.map.instance.getView().fit( this.selectedDistrict.extend_3857, {
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
			this.districtsService.processExtend(this.newDistrict);
			const extent = this.newDistrict['extend_3857'];

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
	saveDistrict() {
		this.createThumb( (image)=> {
			console.log('district', this.newDistrict);
			this.districtsService.register(this.newDistrict).subscribe((result: any) => {
				console.log("result", result);
				if ( result.content instanceof Array)
					this.savePoints(result.content[0],()=>{ this.loadDistricts(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;	});//this.loadRoutes(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[]});
				else
					this.savePoints(result.content,()=>{ this.loadDistricts(); this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER; });//this.loadRoutes();  this.createProgress="Crear";this.mode = StatesEnum.ROUTE_VIEWER;this.lineString3.geometry.coordinates=[];this.lineString2.geometry.coordinates=[] });
				
			});
		})		
	}
	savePoints(contentDistrict: any,callback) {
			this.regPoint(0, contentDistrict, contentDistrict.coords, 0, callback);
	}
	regPoint(index, contentDistrict:any, coord_points, indexSection, callback){
		if (coord_points.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		//this.createProgress = "Guardando " + Math.round((index/section.coords.length)*100) + "%"
		let coord = coord_points[index];
		let punto = {
			district_id: contentDistrict.id,
			lat: coord[1],
			lon: coord[0]
		}
		this.districtPointsService.register(punto).subscribe((result: any) => {
			console.log("punto de distrito creado creado result:", result)
			this.regPoint(index+1,contentDistrict,coord_points,indexSection,callback);			
		});
	}
	/*END ROUTES*/
}
