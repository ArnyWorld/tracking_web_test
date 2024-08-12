import { Component, OnInit, TemplateRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonalService } from '../../api/personal.service';
import { RoutesService } from '../../api/routes.service';
import { AssignmentsService } from '../../api/assignments.service';
import { QrCodeModule } from 'ng-qrcode';
import { ImagesService } from '../../api/images.service';
import { environment } from '../../../environments/environment';
import { ScheduleService } from '../../api/schedule.service';
@Component({
  selector: 'app-personal',
  standalone: true,
  providers: [BsModalService],
  imports: [CommonModule, FormsModule, ReactiveFormsModule,QrCodeModule],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css'
})
export class PersonalComponent implements OnInit {
	modalRef?: BsModalRef;
	constructor(
		private personalApi: PersonalService,
		private AssignmentsService: AssignmentsService,
		private AssignmentsPersonalService: AssignmentsService,
		private routesService: RoutesService, 
		private modalService: BsModalService,
		private imagesService: ImagesService,
		private scheduleService: ScheduleService,
	) { }

	personal = {
		id: '',
		name: '',
		code: '',
		image_id: '',
		image: null,
		personal_type_id: '',		
		schedule_id:1,
	};
	Schedules = [];
	Assignments = [];

	default = {
		id: '',
		name: '',
		code: '',
		image_id: '',
		image: null,
		personal_type_id: '',
		schedule_id:1,
	};
	defaultImage = {
		base64 : '',
		path: '',
		create_date: 0,
		update_date: 0,
	};
	newImage = {
		base64 : '',
		path: '',
		create_date: 0,
		update_date: 0
	};
	keyword="";
	routes: any[];

	personals: any[];
	personalFiltred: any[];

	ngOnInit(): void {		
		this.load();
		this.loadRoutes();

	}
	filtrar(){
		if (this.keyword == "") {this.personalFiltred = this.personals; return;}
		if (this.keyword.length < 3) return;
		this.personalFiltred = this.personals.filter( (p:any)=>{
			return p.name.toLowerCase().includes(this.keyword.toLowerCase());
		});
	}
	openModal(template: TemplateRef<void>, data?:any) {
		if (data){
			this.personal = Object.assign({}, data);
			//this.personal['Assignments']			
			this.Assignments = [];
			
			this.routes.forEach((route:any,i:number)=>{
				
				let asignacion = this.personal['assignments'].find((asignacion)=>asignacion.route_id == route.id);
				if (asignacion==null){
					this.Assignments[i]={
						id:'',
						personal_id:this.personal.id,
						route_id:route.id,
						schedule_id:1,
						is_check:false,
					};
				}else{
					this.Assignments[i] = asignacion;
					this.Assignments[i]['is_check'] = true;
				}
			})
			
		}else{			
			this.personal = Object.assign({}, this.default);
		}
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered modal-lg ',			
		});
	}
	loadRoutes(){
		console.log("loading routes");
		this.routesService.getList().subscribe((res: any) => {
			this.routes = res.content;			
			console.log("routes loaded", this.routes);
		});
	}
	load(){
		this.personalApi.getAll(100, 1, 'id',false,'').subscribe((res: any) => {
			this.personals = res.content;
			this.personalFiltred = this.personals;
			console.log("this.personals",this.personals);
		});
		this.scheduleService.getAll().subscribe((res:any)=>{
			this.Schedules = res.content;
			console.log("this.Schedules",this.Schedules);
		});
	}
	saveAssignments(){
		
		let resultCount = 0;
		let resultComplete = this.Assignments.length;
		let callback = ()=>{
			console.log("completado");
			this.load();
		};
		let progress = (msg='') => {
			resultCount++; if (resultCount == resultComplete) if(callback!=null) callback();
		};
		console.log(this.Assignments);
		this.Assignments.forEach((asignacion:any,i_number)=>{
			this.AssignmentsPersonalService.setPrefix(`personal/${this.personal.id}`);
			if (asignacion.id == ""){
				if(asignacion.is_check)
					this.AssignmentsPersonalService.register(asignacion).subscribe((result)=>progress("asignacion creada"));
				else
					progress("asignacion revisada")
			}else{
				if(asignacion.is_check)
					this.AssignmentsPersonalService.update(asignacion,asignacion.id).subscribe((result)=>progress("asignacion actualizada"));
				else
					this.AssignmentsPersonalService.delete(asignacion.id).subscribe((result)=>progress("asignacion eliminada"));
			}

		});
		this.closeModal();
	}
	fileToBase64(event:any,data:any,key:string){
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			console.log(reader.result);
			data[key] = reader.result.toString();
		};
	}
	closeModal() {
		this.modalRef.hide();
	}
	edit(form: any): void{
		if (form.valid ) {			
			this.saveImage( (image)=>{
				this.personal.image = image;
				this.personal.image_id = image.id;
				this.personalApi.update(this.personal,this.personal.id).subscribe((res: any) => {
					console.log(res);
					this.load();
					this.closeModal();
				});
			});
		}
	}
	delete(form: any): void {
		//console.log('Form data:', this.user);
		this.personalApi.delete(this.personal.id).subscribe((res: any) => {
			console.log(res);
			this.load();
			this.closeModal();
		});
	}
	
	save(form: any): void {
		//console.log('Form data:', this.user);		
		if (form.valid ) {
			this.saveImage( (image)=>{
				this.personal.image = image;
				this.personal.image_id = image.id;
				this.personalApi.register(this.personal).subscribe((res: any) => {
					if (!environment.production)
						console.log("personalApi.result",res);
					this.load();
					this.closeModal();
				});
			});			
		}
	}
	saveImage( callback){
		console.log("this.newImage",this.newImage);
		this.newImage.create_date = new Date().getTime();
		this.newImage.update_date = new Date().getTime();

		this.imagesService.register(this.newImage).subscribe( (res:any) => {
			if (!environment.production)
				console.log("ImageApi.result",res);
			if (callback!=null)
				callback( res.content );
		});
	}
	
}