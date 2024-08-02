import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { Route } from '@angular/router';
import { PersonaltypeService } from '../../api/jobroutes.services';
import { AssignmentsService } from '../../api/assignments.service';

@Component({
  selector: 'app-modal-import-personal',
  templateUrl: './modal-import-personal.component.html',
  styleUrl: './modal-import-personal.component.css'
})

export class ModalImportPersonalComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private personalService: PersonalService,
		private personsService: PersonsService,
		private routesService: RoutesService,
		private assignmentsService : AssignmentsService,
		private personaltypeService: PersonaltypeService,
		private districtPointsService: DistrictPointsService){};

	persons:any = [];
	routes:any = [];
	personalTypes:any = [];
	ngOnInit(): void {
		this.personsService.getAll().subscribe(
			(res:any)=>{
				this.persons = res.content;
				console.log("this.persons",this.persons);
			}
		);
		this.routesService.getAll(300,1,'id',false,'').subscribe(
			(res:any)=>{
				this.routes = res.content;
				console.log("this.routes",this.routes);
			}
		);
		this.personaltypeService.getAll().subscribe(
			(res:any)=>{
				this.personalTypes = res.content;
				console.log("this.personalTypes",this.personalTypes);
			}
		);
	}
	importData:any = {
		text : "",
		json: "",
		districts : []
	} 

	closeModal(){
		this.onClose.emit();
	}
	readFile(event:any,importData:any){

	}
	saveOnDb(){
		this.registerCount = 0;
		this.savePerson(this.persons,0);
	}
	savePerson(persons:any,index:number) {
		let person = persons [index];
		console.log("person",person);
		let p = (cadena:any) =>{
			if (cadena == null) return "";
			if (cadena == undefined) return "";
			if (cadena == " ") return "";
			return cadena;
		};
		let newPerson = {
            "name": (`${p(person.names)} ${p(person.last_name_)} ${p(person.last_name_2)} ${p(person.last_name_3)}`).replaceAll("  "," "),
            "code":  person.code,
            "image_id": null,
            "personal_type_id": this.personalTypes.find(pt => pt.name.trim() == person.position.trim()).id,
            "create_date": 1719099774,
            "update_date": 1719599774,
		};
		this.personalService.register(newPerson).subscribe((result: any) => {
			console.log("registrado",result);
			persons[index]['id'] = result.content.id;
			this.saveAssignments(persons[index],()=>{ if (index < persons.length) this.savePerson(persons,index+1); });
		});
	/*	this.personsService.register(districts[index]).subscribe((result: any) => {
			console.log("registrado",result);
			jobroutes[index]['id'] = result.content.id;
			this.savePoints(jobroutes[index],()=>{ if (index < jobroutes.length) this.saveRoute(jobroutes,index+1); });
		});*/
		/*
		this.districtsService.register(districts[index]).subscribe((result: any) => {
			console.log("result", result);

			if ( result.content instanceof Array)
				this.savePoints(result.content[0],()=>{ if (index < districts.length) this.saveDistrict(districts,index+1);	});
			else
				this.savePoints(result.content,()=>{ if (index < districts.length) this.saveDistrict(districts,index+1); });
			
		});*/
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

	saveAssignments(contentPerson: any,callback) {
		this.regAssignment(0,contentPerson,callback);
	}
	regAssignment(index,contentPerson:any,callback){
		console.log("contentPerson",contentPerson);
		if (contentPerson.personroutes.length == 0) {			
			callback();
			return;
		}
		if (contentPerson.personroutes.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		let personroutes = contentPerson.personroutes[index];
		let route = this.routes.find( r=> r.name.trim() == personroutes['job_routes'].code.trim() );
		if (route == undefined){
			console.log("personroutes['job_routes']",personroutes['job_routes']);
			throw "personroutes['job_routes']";
		}

		
		let assignment = {
			personal_id: contentPerson.id,
			route_id: route.id,
			schedule_id: 1,
		}
		console.log("assignment",JSON.stringify(assignment));
		this.assignmentsService.register(assignment).subscribe((result: any) => {
			console.log("asignacion creada result:", result)
			this.regAssignment(index+1, contentPerson, callback);
		});
	}
}
