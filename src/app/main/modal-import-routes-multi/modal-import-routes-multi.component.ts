import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { JobroutesService } from '../../apipersonal.service.ts/jobroutes.services';

declare var $:any;

@Component({
  selector: 'app-modal-import-routes-multi',
  templateUrl: './modal-import-routes-multi.component.html',
  styleUrl: './modal-import-routes-multi.component.css'
})

export class ModalImportRoutesMultiComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private jobroutesService: JobroutesService,
		private routesService: RoutesService,
		private pointsService: PointsService,
		private districtPointsService: DistrictPointsService,){};

		jobroutes:any = [];
	ngOnInit(): void {
		
	}
	importData:any = {
		text : "",
		json: "",
		routes : [],
		districts:[],
	} 

	closeModal(){
		this.onClose.emit();
	}
	readFile(event:any,importData:any){
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = () => {
			//console.log(reader.result.toString());
			importData.text = reader.result.toString();
			importData.json = JSON.parse(importData.text);
			importData.data = [];
			console.log("importData.json",importData.json);
			this.registerComplete = 0;
			importData.json.features.forEach( (feature:any)=>{
				var route = {
					name:'',
					description:'',
					image_id:'',
					min_split_mt:5,
					max_split_mt:10,
					distance:0,
					frequency:'[1,2,3,4,5,6]',
					create_date: Date.now(),
					update_date: Date.now(),
					district_id: 1,
					color: '#6655ff',
				};
				
				var fullRoute = {
					routeDB : route,
					properties : {},
					points : {},
				}

				var el = document.createElement( 'html' );
				el.innerHTML = feature.properties.description;
				var trs = el.getElementsByTagName("tr");

				//console.log("trs", trs);
				var properties = {};
				for (var i = 0; i < trs.length; i++) {					
					let tds = trs[i].getElementsByTagName("td");					
					if (tds.length == 2){
						//console.log("td",tds[0].textContent, tds[1].textContent);
						properties[tds[0].textContent] = tds[1].textContent;
					}
				}
				Object.keys(feature.properties).forEach(key =>{					
					if (key ==  'description') return;
					let v = feature.properties[key];
					properties[key] = v;
				});

				fullRoute.properties = properties;
				var points = [];
				feature.geometry.coordinates.forEach( (p:any, index:number) => {
					if (Array.isArray(p[0])){
						p[0].forEach(pp=>{
							points.push( [pp[0],pp[1],index] );
						});						
					}else{
						points.push( [p[0],p[1],-1] );
					}
				});
				fullRoute.points = points;
				importData.data.push(fullRoute);
			} );
			let RouteDB = function (){
				this.name='';
				this.description='';
				this.min_split_mt=5;
				this.max_split_mt=10;
				this.distance=0;
				this.frequency ='[1,2,3,4,5,6]';
				this.create_date = Date.now();
				this.update_date = Date.now();
				this.district_id = 1;
				this.color = '#6655ff';
			}
			let Route = function (){
				this.registry = new RouteDB();
				this.sections = [];
			};
			let setPointsIndex = function (points,index){
				for(let i = 0; i < points.length ; i++) {
					if (points[i][2] == -1) points[i][2] = index;
				}
			};
			let colors = new Map();
			let layer = new Map();
			let routes = new Map();
			importData.data.forEach(d=>{
				colors.set(d.properties['Color'],d.properties['Color']);
				layer.set(d.properties['Layer'],d.properties['Layer']);
				var route = routes.get(d.properties['Layer']);
				if (route == undefined ){ 
					route = new Route();
					route.registry.color = '#'+ d.properties['Color'];
					route.registry.name = d.properties['Layer'];
				}
				if (route.sections == undefined ) route.sections = [];
				setPointsIndex(d.points, route.sections.length);
				route.sections.push(d.points);
				routes.set(d.properties['Layer'],route);
			});
			
			console.log("importData",importData);
			console.log("colors",colors);
			console.log("layer",layer);
			console.log("routes",routes);
			let routeArray = [];
			routes.forEach(r=>{
				routeArray.push(r);
			});
			importData['routes'] = routeArray;
		};

    	reader.readAsText(file);
	}
	changeSchedule(input){
		console.log(input.value);
		for(var i = 0 ; i < this.importData.routes.length; i++){
			let route = this.importData.routes[i];
			route.registry.frequency = input.value;			
		}
	}
	saveOnDb(){
		this.registerCount = 0;
		this.saveRoute(this.importData.routes,0);
	}
	saveRoute(routes:any,index:number) {
		//console.log(routes[index]);		
		if (routes[index]===undefined) { 
			this.createProgress = 'Completado';
			return;
		}
		let accomplish = Math.round((index/routes.length)*100);
		this.createProgress = 'Guardando ' + accomplish +'%';
		this.routesService.register(routes[index].registry).subscribe((result: any) => {
			console.log("result new route", result);
			routes[index]['id'] = result.content['id'];
			if (result.content['id'] == -1){
				throw "error";
			}

			let pointsRegistry = [];
			routes[index].sections.forEach(s=>{
				s.forEach(p=>{
					let point = {
						route_id:routes[index]['id'],
						section:p[2],
						lat:p[1],
						lon:p[0]
					};
					pointsRegistry.push(point);
				});
			});
			this.pointsService.register(pointsRegistry).subscribe((resultPoints:any) => {
				//console.log("resultPoints", resultPoints);
				this.saveRoute(this.importData.routes,index+1);		
			});
		});
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

}
