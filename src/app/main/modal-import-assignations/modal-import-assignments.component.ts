import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { JobroutesService } from '../../apipersonal.service.ts/jobroutes.services';
import { AssignmentsService } from '../../api/assignments.service';

declare var $:any;

@Component({
  selector: 'app-modal-import-assignments',
  templateUrl: './modal-import-assignments.component.html',
  styleUrl: './modal-import-assignments.component.css'
})

export class ModalImportAssignmentsComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private personalService:PersonalService,
		private routesService: RoutesService,
		private pointsService: PointsService,
		private assignmentsService: AssignmentsService,
		private districtPointsService: DistrictPointsService,){};
	

	personal = [];
	routes = [];
	ngOnInit(): void {		
		this.personalService.getAll(1000,1,'id',false).subscribe(
			(res:any)=>{
				this.personal = res.content;
				this.personal.forEach(p=>{
					var namesList = [];
					console.log("p",p);
					if (p.firstname!=null)
						p.firstname.split(" ").forEach(n=>namesList.push(n));
					if (p.lastname!=null)
						p.lastname.split(" ").forEach(n=>namesList.push(n));
					p['namesList'] = namesList;
				});
						
				this.routesService.getAll(300,1,'id',false,'').subscribe(
					(res:any)=>{
						this.routes = res.content;
						console.log("this.routes",this.routes);
					}
				);
				console.log("this.personal",this.personal);
			}
		);

	}
	importData:any = {
		text : "",
		json : "",
		personal : [],
		assignments : [],
	} 

	closeModal(){
		this.onClose.emit();
	}
	parseTable(){
		let lines = this.importData.text.split("\n");
		this.importData.personal = [];
		lines.forEach(line=>{
			let fields = line.split("\t");
			if (fields.length < 3) return ;
			let person = {
				number: fields[0], 
				name : fields[1],
				ruta1 : fields[3],
				ruta2 : fields[4],
				finded : undefined,
				route1 : undefined,
				route2 : undefined,
			};
			var searchName = fields[1].split(" ");

			let finded = this.personal.find( p =>{
				let cc = 0;
				let cobj = searchName.length;
				p['namesList'].forEach(n=>{
					for(let si = 0; si < searchName.length; si++){
						if (n==searchName[si])
							cc++;
					}		
				});
				if (cc >=cobj )
					return p;
				else
					return false;
			});
			
			let route1 = this.routes.find( r =>{
				return person.ruta1 == r.name;
			});
			let route2 = this.routes.find( r =>{
				return person.ruta2 == r.name;
			});
			person.finded = finded;
			person.route1 = route1;
			person.route2 = route2;
			this.importData.personal.push(person);
		});
		console.log(this.importData);
		this.importData.assignments =[];
		this.importData.personal.forEach(personal => {
			if (personal.finded==undefined) return;
			if (personal.route1!=undefined){
				this.importData.assignments.push({
					route_id:personal.route1.id,
					personal_id:personal.finded.id,
					schedule_id:1
				});
			}
			if (personal.route2!=undefined){
				this.importData.assignments.push({
					route_id:personal.route2.id,
					personal_id:personal.finded.id,
					schedule_id:1
				});
			}
		});
		console.log("assignments",this.importData.assignments);
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
		this.saveAssignment(this.importData.assignments,0);
	}
	saveAssignment(assignments:any,index:number) {
		console.log(assignments[index]);		
		if (assignments[index]===undefined) { 
			this.createProgress = 'Completado';
			return;
		}
		let accomplish = Math.round((index/assignments.length)*100);
		this.createProgress = 'Guardando ' + accomplish +'%';
		this.assignmentsService.register(assignments[index]).subscribe((result: any) => {
			console.log("result", result);			
			this.saveAssignment(this.importData.assignments,index+1);		
		});
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

}
