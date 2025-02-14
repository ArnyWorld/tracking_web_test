import { Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { transform, fromLonLat } from 'ol/proj';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MapComponent } from 'ng-openlayers';

@Component({
  selector: 'app-modal-edit-routes',
  templateUrl: './modal-edit-routes.component.html',
  styleUrl: './modal-edit-routes.component.css'
})

export class ModalEditRoutesComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	@ViewChild('map') map: MapComponent;
	
	constructor(
		private routesService: RoutesService,
		private pointsService: PointsService,
		private modalService: BsModalService,
	){}
	
	
	/* ATTRIBUTES */
	routes = [];
	modalRef?: BsModalRef;
	keyword="";
	routeSelected = null;
	routesSelected = [];
	copyOverwrite = true;
	completedMessage = "Copiar";
	routeA ;
	routeB ;

	/* METHODS */
	ngOnInit(): void {
		this.loadRoutes();
	};
	copyPoints(routeA,routeB,copyOverwrite){
		console.log("routeA",routeA);
		console.log("routeB",routeB);
		console.log("copyOverwrite",copyOverwrite);
		routeA.sections.forEach( s => {
			routeB.sections.push(s);
		});
		let callbackEnd = ()=>{
			let points = [];
			routeA.sections.forEach((section,index)=>{
				section.coords.forEach(coord=>{
					let punto = {
						route_id: routeB.id,
						lat: coord[1],
						lon: coord[0],
						section: index,
					};
					points.push(punto);
				});
			});
			this.pointsService.register(points).subscribe((result: any) => {
				console.log("puntos creados result:", result);	
			});
		};
		let progress = 0;
		let success = routeB.points.length-1; //routeB.sections.reduce((s1,s2) => s1 + s2.coords.length , 0) ;
		let increaseProgress = ()=>{ progress++; this.completedMessage=(Math.round((progress/success)*100))+"% completado"; if(progress == success) callbackEnd() };
		console.log("success",success);
		let tasks = [];
		let processTask = (task:any,index:number) => {
			if (index >= success) return;
			if (tasks[index] == undefined) return;
			tasks[index](()=>{
				processTask(tasks,index+1);
			});
		};
		if(copyOverwrite && routeB.points.length>0){
			routeB.points.forEach( p=>{
				tasks.push((next)=>{
					this.pointsService.delete(p.id).subscribe(response=>{
						console.log("copyPoints: response",response);
						increaseProgress();
						next();
					},error=>{
						console.error("deleteRoutePoints,subscribe error",error);
						throw "deleteRoutePoints error, data error "+error;
					});
				});
			});
			processTask(tasks,0);
		}else{
			callbackEnd();
		}
	}
	filter(keyword){
		if (keyword.length>1)
			this.routes.forEach(r=>{
				r.controls.show = r.name.toLowerCase().includes(keyword);
			});
		else
			this.routes.forEach(r=>{
				r.controls.show = true;
			});
	}	
	joinRoutes(){
		this.routesSelected = this.routes.filter(r=>r.controls.selected)		
		if (this.routesSelected.length<2) return;
		let newRoute = JSON.parse(JSON.stringify(this.routesSelected[0]));
		for(let i = 1;i<this.routesSelected.length;i++){						
			this.routesSelected[i].sections.forEach( s => {
				newRoute.sections.push(s);
			});
		};
		for(let i = 0;i<this.routesSelected.length;i++)				
			this.routes.splice( this.routes.indexOf(this.routesSelected[i]),1);
		newRoute.controls.selected = false;
		this.routes.push(newRoute);
		console.log("this.routes",this.routes);
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
	loadRoutes(){
		localStorage.removeItem('routes');
		let setControls = (route)=>{
			route['controls']={
				selected : false,
				show : true,
			}
		}
		this.routesService.getAll(300,1,'',false,'').subscribe(
			response=>{
				this.routes = response.content;
				this.routes.forEach(r=>{
					setControls(r);
				});
			},error=>{
				console.error("loadRoutes,subscribe error",error);
				throw "loadRoutes error, data error "+error;
			}
		);
	}
	openModal(template: TemplateRef<void>, data?:any) {
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-sm ',		
				
		});
	}
	closeModal(){
		this.onClose.emit();
	}
	closeSubModal(){
		this.modalRef.hide();
	}
	deleteRoutes(){
		let selectedRoutes = this.routes.filter(r=>r.controls.selected);
		console.log("selectedRoutes",selectedRoutes);
		selectedRoutes.forEach( r=>{
			this.routesService.delete(r.id).subscribe(response=>{},error=>{
				console.error("deleteRoutes,subscribe error",error);
				throw "deleteRoutes error, data error "+error;
			});
		});
		this.loadRoutes();
		this.closeSubModal();
	}
	deleteRoutesPoints(){
		let selectedRoutes = this.routes.filter(r=>r.controls.selected);
		console.log("selectedRoutes",selectedRoutes);
		if(selectedRoutes.length != 1) return;
		selectedRoutes.forEach( r=>{
			r.points.forEach( p=>{
				this.pointsService.delete(p.id).subscribe(response=>{},error=>{
					console.error("deleteRoutePoints,subscribe error",error);
					throw "deleteRoutePoints error, data error "+error;
				});
			});
		});
		this.loadRoutes();
		this.closeSubModal();
	}
}
