import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { kaLocale } from 'ngx-bootstrap/chronos';
import { transform } from 'ol/proj';
import { MapComponent } from 'ng-openlayers';

declare var xmlx:any;
@Component({
  selector: 'app-modal-import-kml',
  templateUrl: './modal-import-kml.component.html',
  styleUrl: './modal-import-kml.component.css'
})

export class ModalImportKmlComponent {
	@ViewChild('map') map: MapComponent;
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private routesService: RoutesService,
		private pointsService: PointsService,){};

	importData:any = {
		text : "",
		json: "",
		routes : []
	} 
	zoom = 18;
	keyword = "";
	routeSelected = null;
	routesSelected = [];
	name_prefix = '';

	closeModal(){
		this.onClose.emit();
	}
	tokenTable = [
		{
			id:0,
			type: 'tag',
			states: [0,1,2,3,4],
			condition:{				
				type: 'tag',
				name: 'name',
			},
			fordward:[
				{type : 'attr',
				name : 'name',
				value : '$value'
				}
			],			
		},
		{
			id:10,
			type: 'tag',
			states: [0,1,2,3,4],
			condition:{				
				type: 'tag',
				name: 'id',
			},
			fordward:[
				{type : 'attr',
				name : 'id',
				value : '$value'
				}
			],			
		},
		{
			id:1,
			type: 'prop',
			states: [0,1],
			condition:{
				name : 'name',
				type: 'propName',
			},
			fordward:[
				{type : 'attr',
				name : 'name',
				value : '$value'}
			],			
		},
		{
			id:2,
			type: 'tag',
			states: [0],
			condition:{
				name : 'Folder',
				type: 'tag',
			},
			fordward:[
				{type : 'attrArr',
					name : 'FeatureCollection',
					value : `{"type"="FeatureCollection","name":"","crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },"features":[]}`,},
				{type : 'setState',
					value : 1,
				}
			],
		},
		{
			id:3,
			type: 'tag',
			states: [1],
			condition:{
				name : 'Placemark',
				type: 'tag',
			},
			fordward:[
				{type : 'attrArr',
				name : 'features',
				value: `"type": "Feature", "properties": { "Name": 1, "Color": 254, "Elevation": 0, 
						"Entity": "Group", 
						"FID": 1, 
						"Field_1": 1, 
						"Id": 0, 
						"Layer": "", 
						"LineWt": 9, 
						"Linetype": "Continuous", 
						"area": "0" }, 
						"geometry": {} `},
				{type : 'setState',
					value : 2,
				}
			],
		},
		{
			id:6,
			type: 'tag',
			states: [2],
			condition:{
				name : 'MultiGeometry',
				type: 'tag',
			},
			fordward:[
				{type : 'attrObj',
				name : 'geometry',
				value : `{"type":"MultiPolygon","coordinates":[]}`},
				{type : 'setState',
					value : 3,
				}
			],
		},
		{
			id:4,
			type: 'tag',
			states: [3],
			condition:{
				name : 'LineString',
				type: 'tag',
			},
			fordward:[
				{type : 'appendArr',
				name : 'coordinates',
				value : '[]'},
				{type : 'setState',
					value : 4,
				}
			],
		},
		{
			id:5,
			type: 'tag',
			states: [4],
			condition:{
				name : 'coordinates',
				type: 'tag',
			},
			fordward:[
				{type : 'contentArrCoord',
				name : 'coordinates',
				value : '[]'},				
			],
		},
	];
	parseXMLtoJson(xml,state){
		let geojson = {};
		let useTokenTable = this.tokenTable.filter(t=>t.states.includes(state));
		console.log("useTokenTable",useTokenTable);
		let attr = Object.keys(xml);
		console.log("attr",attr);
		console.log("xml",xml);
		console.log("xmlDoc.attributes",xml['attributes'] );
		console.log("xmlDoc.childrens",xml['childrens'] );
		xmlx = xml;
		xml.childrens.forEach(c=>{
			console.log("children",c);
		});

	}
	showRoute(route){
		//this.selectedRoute = route;
		//console.log("showing",this.selectedRoute);
	}
	joinRoutes(){
		this.routesSelected = this.importData.routes.filter(r=>r.controls.selected)		
		if (this.routesSelected.length<2) return;
		let newRoute = JSON.parse(JSON.stringify(this.routesSelected[0]));
		for(let i = 1;i<this.routesSelected.length;i++){						
			this.routesSelected[i].sections.forEach( s => {
				newRoute.sections.push(s);
			});
		};
		for(let i = 0;i<this.routesSelected.length;i++)				
			this.importData.routes.splice( this.importData.routes.indexOf(this.routesSelected[i]),1);
		newRoute.controls.selected = false;
		this.importData.routes.push(newRoute);
		console.log("this.importData",this.importData);
	}
	selectRoute(route: any) {
		const extent = route.extend;
		const corner1 = transform([extent[0], extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2], extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0], corner1[1], corner2[0], corner2[1]];
		console.log("route.extend",route.extend);
		if (extent3857!=undefined && route.points.length>0) {
			this.map.instance.getView().fit(extent3857, {
				padding: [100, 100, 100, 100],
				maxZoom: 23,
				duration: 300
			});
		}
		setTimeout(() => {
			if (route !== undefined) route.controls.selected = !route.controls.selected;
		}, 200);
	}

	readFile(event:any,importData:any){
		const file = event.target.files[0];
		const reader = new FileReader();
		let name = this.name_prefix;//importData.json.name;
		reader.onload = () => {
			//console.log(reader.result.toString());
			importData.text = reader.result.toString();
			
			let parser = new DOMParser();
			let xmlDoc = parser.parseFromString(importData.text,"text/xml");
			//let json = this.parseXMLtoJson(xmlDoc,0);
			let placemarks = Array.from(xmlDoc.getElementsByTagName("Placemark"));
			console.log("xmlDoc",xmlDoc);
			console.log("xmlDoc.Placemark",xmlDoc.getElementsByTagName("Placemark"));
			console.log("xmlDoc.Placemark.length",xmlDoc.getElementsByTagName("Placemark").length);	
			
			let geojson = {"type":"FeatureCollection","name":"","crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },"features":[]};
			placemarks.forEach( p =>{
				//let name = Array.from(p.children).find(n=>n.tagName=="name").textContent;
				let nameRoute = p.querySelector("name").textContent;
				this.registerComplete = 0;
				var rxColor = "#775599";
				var rxDistance = 0 ;
				var points = [];
				let lineStrings = p.querySelectorAll("LineString coordinates")
				let sections = [];
				Array.from(lineStrings).forEach((lc,index)=>{
					let pointsSection = lc.textContent.trim().split(" ").map(p=>p.split(",",2).map(pp=>Number(pp)));
					//points.push(pointsSection);
					let section = {'coords':[]};
					section['coords'] = pointsSection;
					sections.push(section);
					this.registerComplete ++;
				});
				
				var route = {
					//([A-Z])\w+(?<=(RefName\<\/td>\n\n\<td\>))[a-zA-Z0-9\-]*(?=<\/td>) for name
					name : (name!=""?name+ "-":"")+nameRoute,
					//name : feature.properties.name,
					color : rxColor,//feature.properties.description.match(rxColor)[0],
					distance : rxDistance,//parseFloat(feature.properties.description.match(rxDistance)[0].replaceAll("<td>","").replaceAll("<","").replaceAll(",",".").replaceAll(" ","").replaceAll("\n",""))*1000,
					sections : sections,
					controls : {selected:false},
					thumb:"",
					id: '',
					min_split_mt: '5',
					max_split_mt: '10',					
				};
				importData.routes.push(route);
			});
			
			
			


			//document.getElementById("demo").innerHTML =	xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;

/*			importData.json = JSON.parse(importData.text);			
			console.log("importData.json",importData.json);
			let name = this.name_prefix;//importData.json.name;
			this.registerComplete = 0;
			importData.json.features.forEach( (feature:any)=>{
				var rxColor = "#775599";
				var rxDistance = 0 ;
				//var rxColor = new RegExp("(?<=\<tr bgcolor\=\"\#)[A-F0-9]{6}","i");
				//var rxDistance = new RegExp("(?<=\<td\>LONG\<\/td>)[0-9\,\<\>td\n]*","i");
				var points = [];
				feature.geometry.coordinates.forEach( (c:any, index:number) => {
					c.forEach(p =>{
						points.push( [p[0],p[1],index] );
						this.registerComplete ++;
					})
				});
				var route = {
					//([A-Z])\w+(?<=(RefName\<\/td>\n\n\<td\>))[a-zA-Z0-9\-]*(?=<\/td>) for name
					name : (name!=""?name+ "-":"")+feature.properties.name,
					//name : feature.properties.name,
					color : rxColor,//feature.properties.description.match(rxColor)[0],
					distance : rxDistance,//parseFloat(feature.properties.description.match(rxDistance)[0].replaceAll("<td>","").replaceAll("<","").replaceAll(",",".").replaceAll(" ","").replaceAll("\n",""))*1000,
					points : points,
					thumb:"",
					id: '',
					min_split_mt: '5',
					max_split_mt: '10',					
				};
				importData.routes.push(route);
			} );*/
			console.log("importData",importData);
			
		};
    	reader.readAsText(file);
	}
	saveOnDb(){
		this.registerCount = 0;
		this.saveRoute(this.importData.routes,0);
	}
	saveRoute(routes:any,index:number) {
		if (routes[index] == undefined) {this.createProgress ="completado" ; return;}

		this.routesService.register(routes[index]).subscribe((result: any) => {
			console.log("result", result);
			console.log("index", index);
			console.log("routes", routes);
			routes[index]['id'] = result.content.id;
			console.log("result.content.id", result.content.id);
			console.log("routes", routes);
			let points = [];
			routes[index].sections.forEach((section,index)=>{
				section.coords.forEach(coord=>{
					let punto = {
						route_id: result.content.id,
						lat: coord[1],
						lon: coord[0],
						section: index,
					};
					points.push(punto);
				});
			});
			points
			this.pointsService.register(points).subscribe((result: any) => {
				console.log("puntos creados result:", result);
				this.saveRoute(routes,index+1);
			});
/*
			if ( result.content instanceof Array)
				this.savePoints(result.content[0],()=>{ if (index < routes.length) this.saveRoute(routes,index+1);	});
			else
				this.savePoints(result.content,()=>{ if (index < routes.length) this.saveRoute(routes,index+1); });*/
			
		});
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

	savePoints(contentRoute: any,callback) {
		this.regPoint(0,contentRoute,callback);
	}
	regPoint(index,contentRoute:any,callback){
		if (contentRoute.points.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		let coord = contentRoute.points[index];
		let punto = {
			route_id: contentRoute.id,
			lat: coord[1],
			lon: coord[0],
			section: coord[2],
		}
		this.pointsService.register(punto).subscribe((result: any) => {
			console.log("punto creado result:", result)
			this.regPoint(index+1,contentRoute,callback);			
		});
	}
}
