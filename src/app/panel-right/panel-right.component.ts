import { Component, Input, OnInit, input } from '@angular/core';

@Component({
  selector: 'app-panel-right',
  templateUrl: './panel-right.component.html',
  styleUrl: './panel-right.component.css'
})
export class PanelRightComponent implements OnInit {
	@Input() selected:string = "Dispositivos";
	@Input() tabs?:any;

	
	ngOnInit(): void {
		console.log("tabs",this.tabs);
	}
}
